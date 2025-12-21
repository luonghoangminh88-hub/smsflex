import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { rentNumberWithFailover } from "@/lib/multi-provider-client"
import { notifyRentalCreated, notifyBalanceLow } from "@/lib/notification-service"
import { rentalSchema, validateAndSanitize } from "@/lib/security/api-validation"
import { checkIdempotency, completeIdempotency, failIdempotency, generateIdempotencyKey } from "@/lib/idempotency"
import { z } from "zod"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const enhancedSchema = rentalSchema.extend({
      rentalType: z.enum(["standard", "multi-service", "long-term"]).optional().default("standard"),
      additionalServices: z.array(z.string()).optional(),
      rentDurationHours: z.number().optional(),
      expectedPrice: z.number().positive(),
    })

    const validation = validateAndSanitize(enhancedSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { serviceId, countryId, rentalType, additionalServices, rentDurationHours, expectedPrice } = validation.data

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const idempotencyKey = generateIdempotencyKey(user.id, { serviceId, countryId })
    const idempotencyCheck = await checkIdempotency(idempotencyKey, user.id, { serviceId, countryId })

    if (!idempotencyCheck.isNew) {
      if (idempotencyCheck.status === 409) {
        return NextResponse.json({ error: "Request is already being processed" }, { status: 409 })
      }
      // Return cached response
      return NextResponse.json(idempotencyCheck.data, { status: idempotencyCheck.status || 200 })
    }

    try {
      const { data: service } = await supabase.from("services").select("code, name").eq("id", serviceId).single()

      const { data: country } = await supabase.from("countries").select("code, name").eq("id", countryId).single()

      if (!service || !country) {
        const errorResponse = { error: "Service or country not found" }
        await failIdempotency(idempotencyKey, { message: errorResponse.error, status: 404 })
        return NextResponse.json(errorResponse, { status: 404 })
      }

      const { data: pricing } = await supabase
        .from("service_prices")
        .select("price, cost_price")
        .eq("service_id", serviceId)
        .eq("country_id", countryId)
        .eq("is_available", true)
        .single()

      if (!pricing) {
        const errorResponse = { error: "Service not available for this country" }
        await failIdempotency(idempotencyKey, { message: errorResponse.error, status: 400 })
        return NextResponse.json(errorResponse, { status: 400 })
      }

      const { calculateRentalPricing, validatePricingRequest } = await import("@/lib/pricing-calculator")

      const pricingValidation = validatePricingRequest(
        expectedPrice,
        pricing.price,
        pricing.cost_price || pricing.price * 0.7, // Changed fallback from 0.8 to 0.7 to ensure minimum 5% profit margin with discounts
        rentalType,
        additionalServices?.length || 0,
        rentDurationHours,
      )

      if (!pricingValidation.valid) {
        console.error("[Rental] Pricing validation failed:", pricingValidation.error)
        const errorResponse = {
          error: "Pricing validation failed",
          details: pricingValidation.error,
          calculatedPrice: pricingValidation.calculatedPrice,
        }
        await failIdempotency(idempotencyKey, { message: errorResponse.error, status: 400 })
        return NextResponse.json(errorResponse, { status: 400 })
      }

      const calculatedPricing = calculateRentalPricing({
        basePrice: pricing.price,
        costPrice: pricing.cost_price || pricing.price * 0.7, // Changed fallback from 0.8 to 0.7 for consistent profit calculation
        rentalType,
        additionalServicesCount: additionalServices?.length || 0,
        rentDurationHours: rentDurationHours || 0,
      })

      console.log("[Rental] Pricing breakdown:", calculatedPricing)

      const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single()

      if (!profile || profile.balance < calculatedPricing.finalPrice) {
        const errorResponse = {
          error: "Insufficient balance",
          required: calculatedPricing.finalPrice,
          current: profile?.balance || 0,
        }
        await failIdempotency(idempotencyKey, { message: errorResponse.error, status: 400 })
        return NextResponse.json(errorResponse, { status: 400 })
      }

      const rentalResult = await rentNumberWithFailover(country.code, service.code)

      if (!rentalResult.success) {
        console.error("[Rental] All providers failed:", rentalResult.error)
        const errorResponse = {
          error: rentalResult.error || "Failed to get phone number from any provider. Please try again later.",
        }
        await failIdempotency(idempotencyKey, { message: errorResponse.error, status: 503 })
        return NextResponse.json(errorResponse, { status: 503 })
      }

      const { data: rental, error: rentalError } = await supabase
        .from("phone_rentals")
        .insert({
          user_id: user.id,
          service_id: serviceId,
          country_id: countryId,
          activation_id: rentalResult.activationId,
          phone_number: rentalResult.phoneNumber,
          price: calculatedPricing.finalPrice, // Use calculated final price
          cost_price: pricing.cost_price || pricing.price * 0.7, // Changed fallback from 0.8 to 0.7 for accurate cost tracking
          rental_type: rentalType,
          additional_services: additionalServices,
          rent_duration_hours: rentDurationHours,
          status: "active",
          provider: rentalResult.provider,
          expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString(),
        })
        .select()
        .single()

      if (rentalError) {
        console.error("[Rental] Failed to save rental to database, rolling back:", rentalError)
        try {
          const { cancelActivation } = await import("@/lib/multi-provider-client")
          await cancelActivation(rentalResult.activationId, rentalResult.provider)
        } catch (cancelError) {
          console.error("[Rental] Failed to cancel activation during rollback:", cancelError)
        }
        await failIdempotency(idempotencyKey, rentalError)
        throw rentalError
      }

      const newBalance = Number.parseFloat(profile.balance.toString()) - calculatedPricing.finalPrice
      await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)

      await supabase.from("transactions").insert({
        user_id: user.id,
        rental_id: rental.id,
        type: "rental_purchase",
        amount: -calculatedPricing.finalPrice,
        balance_before: profile.balance,
        balance_after: newBalance,
        status: "completed",
        description: `Rental for ${service.name} - ${country.name} (${rentalResult.provider})`,
        metadata: {
          rentalType,
          originalPrice: calculatedPricing.originalPrice,
          discount: calculatedPricing.discount,
          discountPercentage: calculatedPricing.discountPercentage,
          finalPrice: calculatedPricing.finalPrice,
          adminProfit: calculatedPricing.adminProfit,
          adminProfitPercentage: calculatedPricing.adminProfitPercentage,
        },
      })

      await notifyRentalCreated(user.id, rentalResult.phoneNumber, service.name, country.name)

      if (newBalance < 10000) {
        await notifyBalanceLow(user.id, newBalance)
      }

      if (rentalResult.provider === "sms-activate") {
        try {
          const { getSmsActivateClient } = await import("@/lib/sms-activate")
          const client = getSmsActivateClient()
          await client.setStatus(rentalResult.activationId, 1)
        } catch (statusError) {
          console.error("[Rental] Failed to set SMS-Activate status:", statusError)
        }
      }

      const successResponse = { success: true, rental }
      await completeIdempotency(idempotencyKey, successResponse, 200, rental.id)

      return NextResponse.json(successResponse)
    } catch (error: any) {
      await failIdempotency(idempotencyKey, error)
      throw error
    }
  } catch (error) {
    console.error("[Rental] Error creating rental:", error)
    return NextResponse.json({ error: "Failed to create rental" }, { status: 500 })
  }
}
