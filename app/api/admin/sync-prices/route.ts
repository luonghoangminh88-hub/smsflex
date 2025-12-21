import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { getSmsActivateClient } from "@/lib/sms-activate"
import { getFreePriceInfo } from "@/lib/freeprice"

/**
 * Admin endpoint to sync prices from SMS-Activate API with FreePrice support
 */
export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    // Check if user is admin
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

    if (!profile || profile.role !== "admin") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { data: profitMarginSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "profit_margin_percentage")
      .single()

    const { data: freePriceSetting } = await supabase
      .from("system_settings")
      .select("value")
      .eq("key", "freeprice_enabled")
      .single()

    const profitMarginPercentage = profitMarginSetting ? Number(profitMarginSetting.value) : 20
    const profitMultiplier = 1 + profitMarginPercentage / 100 // e.g., 20% = 1.2
    const freePriceEnabled = freePriceSetting?.value === "true"

    // Get prices from SMS-Activate
    const smsClient = getSmsActivateClient()
    const prices = await smsClient.getPrices()

    // Get all services and countries from database
    const { data: services } = await supabase.from("services").select("id, code")
    const { data: countries } = await supabase.from("countries").select("id, code")

    if (!services || !countries) {
      return NextResponse.json({ error: "Failed to fetch services or countries" }, { status: 500 })
    }

    let updatedCount = 0
    let createdCount = 0
    let freePriceCount = 0

    // Update service prices
    for (const country of countries) {
      const countryPrices = prices[country.code]
      if (!countryPrices) continue

      for (const service of services) {
        const servicePrice = countryPrices[service.code]
        if (!servicePrice) continue

        const costPrice = servicePrice.cost
        const sellingPrice = costPrice * profitMultiplier

        let freePriceData = null
        if (freePriceEnabled) {
          try {
            freePriceData = await getFreePriceInfo(service.code, country.code)
          } catch (error) {
            console.error(`[v0] Failed to fetch FreePrice for ${service.code}:`, error)
          }
        }

        // Check if price exists
        const { data: existingPrice } = await supabase
          .from("service_prices")
          .select("id")
          .eq("service_id", service.id)
          .eq("country_id", country.id)
          .single()

        const priceUpdate: any = {
          cost_price: costPrice,
          price: sellingPrice,
          stock_count: servicePrice.count,
          is_available: servicePrice.count > 0,
          updated_at: new Date().toISOString(),
        }

        if (freePriceData?.enabled) {
          priceUpdate.freeprice_enabled = true
          priceUpdate.freeprice_map = JSON.stringify(
            Object.fromEntries(freePriceData.options.map((opt) => [opt.price.toString(), opt.count])),
          )
          priceUpdate.min_freeprice = freePriceData.minPrice
          priceUpdate.max_freeprice = freePriceData.maxPrice
          priceUpdate.recommended_freeprice = freePriceData.recommendedPrice
          freePriceCount++
        } else {
          priceUpdate.freeprice_enabled = false
          priceUpdate.freeprice_map = null
          priceUpdate.min_freeprice = null
          priceUpdate.max_freeprice = null
          priceUpdate.recommended_freeprice = null
        }

        if (existingPrice) {
          // Update existing price
          await supabase.from("service_prices").update(priceUpdate).eq("id", existingPrice.id)

          updatedCount++
        } else {
          // Create new price
          await supabase.from("service_prices").insert({
            service_id: service.id,
            country_id: country.id,
            ...priceUpdate,
          })

          createdCount++
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Synced prices with ${profitMarginPercentage}% profit margin`,
      profitMarginPercentage,
      freePriceEnabled,
      freePriceCount,
      updated: updatedCount,
      created: createdCount,
    })
  } catch (error) {
    console.error("[v0] Error syncing prices:", error)
    return NextResponse.json({ error: "Failed to sync prices" }, { status: 500 })
  }
}
