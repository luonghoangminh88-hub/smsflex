import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { rentNumberWithFailover } from "@/lib/multi-provider-client"
import { notifyRentalCreated, notifyBalanceLow } from "@/lib/notification-service"
import { rentalSchema, validateAndSanitize } from "@/lib/security/api-validation"
import { checkIdempotency, completeIdempotency, failIdempotency, generateIdempotencyKey } from "@/lib/idempotency"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validation = validateAndSanitize(rentalSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { serviceId, countryId } = validation.data

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
        .select("price")
        .eq("service_id", serviceId)
        .eq("country_id", countryId)
        .eq("is_available", true)
        .single()

      if (!pricing) {
        const errorResponse = { error: "Service not available for this country" }
        await failIdempotency(idempotencyKey, { message: errorResponse.error, status: 400 })
        return NextResponse.json(errorResponse, { status: 400 })
      }

      const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single()

      if (!profile || profile.balance < pricing.price) {
        const errorResponse = { error: "Insufficient balance" }
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
          price: pricing.price,
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

      const newBalance = Number.parseFloat(profile.balance.toString()) - Number.parseFloat(pricing.price.toString())
      await supabase.from("profiles").update({ balance: newBalance }).eq("id", user.id)

      await supabase.from("transactions").insert({
        user_id: user.id,
        rental_id: rental.id,
        type: "rental_purchase",
        amount: -pricing.price,
        balance_before: profile.balance,
        balance_after: newBalance,
        status: "completed",
        description: `Rental for ${service.name} - ${country.name} (${rentalResult.provider})`,
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
