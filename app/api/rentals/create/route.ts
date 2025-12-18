import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { rentNumberWithFailover } from "@/lib/multi-provider-client"
import { notifyRentalCreated, notifyBalanceLow } from "@/lib/notification-service"
import { rentalSchema, validateAndSanitize } from "@/lib/security/api-validation"

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

    const { data: service } = await supabase.from("services").select("code, name").eq("id", serviceId).single()

    const { data: country } = await supabase.from("countries").select("code, name").eq("id", countryId).single()

    if (!service || !country) {
      return NextResponse.json({ error: "Service or country not found" }, { status: 404 })
    }

    const { data: pricing } = await supabase
      .from("service_prices")
      .select("price")
      .eq("service_id", serviceId)
      .eq("country_id", countryId)
      .eq("is_available", true)
      .single()

    if (!pricing) {
      return NextResponse.json({ error: "Service not available for this country" }, { status: 400 })
    }

    const { data: profile } = await supabase.from("profiles").select("balance").eq("id", user.id).single()

    if (!profile || profile.balance < pricing.price) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    console.log(`[v0] Renting number with failover for service: ${service.code}, country: ${country.code}`)
    const rentalResult = await rentNumberWithFailover(country.code, service.code)

    if (!rentalResult.success) {
      console.error("[v0] All providers failed:", rentalResult.error)
      return NextResponse.json(
        { error: rentalResult.error || "Failed to get phone number from any provider. Please try again later." },
        { status: 503 },
      )
    }

    console.log(`[v0] Successfully rented from ${rentalResult.provider}: ${rentalResult.phoneNumber}`)

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
      console.error("[v0] Failed to save rental to database, rolling back:", rentalError)
      try {
        const { cancelActivation } = await import("@/lib/multi-provider-client")
        await cancelActivation(rentalResult.activationId, rentalResult.provider)
      } catch (cancelError) {
        console.error("[v0] Failed to cancel activation during rollback:", cancelError)
      }
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
        console.error("[v0] Failed to set SMS-Activate status:", statusError)
      }
    }

    return NextResponse.json({ success: true, rental })
  } catch (error) {
    console.error("[v0] Error creating rental:", error)
    return NextResponse.json({ error: "Failed to create rental" }, { status: 500 })
  }
}
