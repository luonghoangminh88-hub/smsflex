/**
 * Multi-Provider Client with Automatic Failover
 * Handles SMS-Activate and 5sim with intelligent fallback
 */

import { getSmsActivateClient } from "./sms-activate"
import { getFiveSimClient } from "./5sim"
import { getSmsActivateCode, getFiveSimCode } from "./service-mapping"
import { getFiveSimCountryCode } from "./country-mapping"
import { getCircuitBreaker } from "./circuit-breaker"
import { getSmsActivateV2Client } from "./sms-activate-v2"

export type Provider = "sms-activate" | "5sim"

export interface RentalResult {
  success: boolean
  provider: Provider
  activationId: string
  phoneNumber: string
  cost: number
  error?: string
}

export interface StatusResult {
  status: "waiting" | "completed" | "cancelled" | "unknown"
  code?: string
  provider: Provider
}

/**
 * Check stock availability before renting
 * Returns available stock count or 0 if unavailable
 */
export async function checkStockAvailability(
  countryCode: string,
  internalServiceCode: string,
): Promise<{
  smsActivate: number
  fiveSim: number
  total: number
}> {
  let smsActivateStock = 0
  let fiveSimStock = 0

  // Check SMS-Activate stock
  try {
    const smsActivateCode = getSmsActivateCode(internalServiceCode)
    console.log(`[v0] Checking SMS-Activate stock for service: ${smsActivateCode}, country: ${countryCode}`)

    if (smsActivateCode) {
      const client = getSmsActivateClient()
      const count = await client.getNumbersStatus(countryCode, smsActivateCode)
      smsActivateStock = count
      console.log(`[v0] SMS-Activate stock count: ${count}`)
    }
  } catch (error: any) {
    console.error("[v0] Error checking SMS-Activate stock:", error.message)
  }

  // Check 5sim stock
  try {
    const fiveSimCode = getFiveSimCode(internalServiceCode)
    const fiveSimCountry = getFiveSimCountryCode(countryCode)
    console.log(`[v0] Checking 5sim stock for service: ${fiveSimCode}, country: ${fiveSimCountry}`)

    if (fiveSimCode && fiveSimCountry) {
      const client = getFiveSimClient()
      const prices = await client.getPrices(countryCode, fiveSimCode)
      console.log(`[v0] 5sim getPrices response:`, JSON.stringify(prices))

      // Response format: { countryName: { productName: { operatorName: { cost, count, rate } } } }
      if (prices[fiveSimCountry] && prices[fiveSimCountry][fiveSimCode]) {
        const operators = prices[fiveSimCountry][fiveSimCode]
        // Sum up all operator counts
        let totalCount = 0
        for (const operator in operators) {
          if (operators[operator]?.count) {
            totalCount += operators[operator].count
          }
        }
        fiveSimStock = totalCount
        console.log(`[v0] 5sim stock count: ${totalCount}`)
      }
    }
  } catch (error: any) {
    console.error("[v0] Error checking 5sim stock:", error.message)
  }

  return {
    smsActivate: smsActivateStock,
    fiveSim: fiveSimStock,
    total: smsActivateStock + fiveSimStock,
  }
}

/**
 * Check stock availability with Free Price optimization
 */
export async function checkStockAvailabilityWithPricing(
  countryCode: string,
  internalServiceCode: string,
): Promise<{
  smsActivate: { count: number; price?: number }
  fiveSim: { count: number; price?: number }
  bestProvider: Provider
  reason: string
}> {
  const circuitBreaker = getCircuitBreaker()
  let smsActivateStock = 0
  let smsActivatePrice: number | undefined
  let fiveSimStock = 0
  let fiveSimPrice: number | undefined

  const hasSmsActivateKey = !!process.env.SMS_ACTIVATE_API_KEY
  const hasFiveSimKey = !!process.env.FIVESIM_API_KEY

  const canUseSmsActivate = hasSmsActivateKey && (await circuitBreaker.canMakeRequest("sms-activate"))
  const canUseFiveSim = hasFiveSimKey && (await circuitBreaker.canMakeRequest("5sim"))

  // Check SMS-Activate with Free Price
  if (canUseSmsActivate) {
    try {
      const startTime = Date.now()
      const v2Client = getSmsActivateV2Client()
      const smsActivateCode = getSmsActivateCode(internalServiceCode)

      if (smsActivateCode) {
        // Try to get free price first
        try {
          const freePrices = await v2Client.getFreePrice(countryCode, smsActivateCode)
          if (freePrices[countryCode]?.[smsActivateCode]) {
            smsActivateStock = freePrices[countryCode][smsActivateCode].count || 0
            smsActivatePrice = freePrices[countryCode][smsActivateCode].cost
          }
        } catch (freePriceError) {
          // Fallback to regular stock check
          const client = getSmsActivateClient()
          smsActivateStock = await client.getNumbersStatus(countryCode, smsActivateCode)
        }

        const responseTime = Date.now() - startTime
        await circuitBreaker.recordSuccess("sms-activate", responseTime)
      }
    } catch (error: any) {
      console.error("[Stock Check] SMS-Activate error:", error.message)
      await circuitBreaker.recordFailure("sms-activate", error.message)
    }
  } else {
    if (!hasSmsActivateKey) {
      console.warn("[Stock Check] SMS-Activate API key not configured, skipping")
    } else {
      console.warn("[Stock Check] SMS-Activate circuit is open, skipping")
    }
  }

  // Check 5sim
  if (canUseFiveSim) {
    try {
      const startTime = Date.now()
      const fiveSimCode = getFiveSimCode(internalServiceCode)
      const fiveSimCountry = getFiveSimCountryCode(countryCode)

      if (fiveSimCode && fiveSimCountry) {
        const client = getFiveSimClient()
        const prices = await client.getPrices(countryCode, fiveSimCode)

        if (prices[fiveSimCountry]?.[fiveSimCode]) {
          const operators = prices[fiveSimCountry][fiveSimCode]
          let totalCount = 0
          let avgPrice = 0
          let priceCount = 0

          for (const operator in operators) {
            if (operators[operator]?.count) {
              totalCount += operators[operator].count
              avgPrice += operators[operator].cost
              priceCount++
            }
          }

          fiveSimStock = totalCount
          fiveSimPrice = priceCount > 0 ? avgPrice / priceCount : undefined
        }

        const responseTime = Date.now() - startTime
        await circuitBreaker.recordSuccess("5sim", responseTime)
      }
    } catch (error: any) {
      console.error("[Stock Check] 5sim error:", error.message)
      await circuitBreaker.recordFailure("5sim", error.message)
    }
  } else {
    if (!hasFiveSimKey) {
      console.warn("[Stock Check] 5sim API key not configured, skipping")
    } else {
      console.warn("[Stock Check] 5sim circuit is open, skipping")
    }
  }

  let bestProvider: Provider = "sms-activate"
  let reason = "Default provider"

  if (!hasSmsActivateKey && !hasFiveSimKey) {
    reason = "No API keys configured"
  } else if (!hasSmsActivateKey) {
    bestProvider = "5sim"
    reason = "Only 5sim API key configured"
  } else if (!hasFiveSimKey) {
    bestProvider = "sms-activate"
    reason = "Only SMS-Activate API key configured"
  } else if (smsActivateStock === 0 && fiveSimStock === 0) {
    reason = "No stock available"
  } else if (smsActivateStock === 0) {
    bestProvider = "5sim"
    reason = "SMS-Activate out of stock"
  } else if (fiveSimStock === 0) {
    bestProvider = "sms-activate"
    reason = "5sim out of stock"
  } else if (!canUseSmsActivate) {
    bestProvider = "5sim"
    reason = "SMS-Activate circuit open"
  } else if (!canUseFiveSim) {
    bestProvider = "sms-activate"
    reason = "5sim circuit open"
  } else if (smsActivatePrice && fiveSimPrice) {
    // Choose based on price
    if (smsActivatePrice <= fiveSimPrice * 0.9) {
      // SMS-Activate is at least 10% cheaper
      bestProvider = "sms-activate"
      reason = `Better price: ${smsActivatePrice} vs ${fiveSimPrice}`
    } else {
      bestProvider = "5sim"
      reason = `Better price: ${fiveSimPrice} vs ${smsActivatePrice}`
    }
  } else {
    // Choose based on stock availability
    bestProvider = smsActivateStock > fiveSimStock ? "sms-activate" : "5sim"
    reason = `Higher stock: ${bestProvider === "sms-activate" ? smsActivateStock : fiveSimStock} numbers`
  }

  return {
    smsActivate: { count: smsActivateStock, price: smsActivatePrice },
    fiveSim: { count: fiveSimStock, price: fiveSimPrice },
    bestProvider,
    reason,
  }
}

/**
 * Try to rent a number with automatic failover between providers
 * Now includes pre-check for stock availability
 */
export async function rentNumberWithFailover(countryCode: string, internalServiceCode: string): Promise<RentalResult> {
  console.log(`[Multi-Provider] Renting number for service: ${internalServiceCode}, country: ${countryCode}`)

  const stockCheck = await checkStockAvailabilityWithPricing(countryCode, internalServiceCode)
  console.log("[Multi-Provider] Advanced stock check:", stockCheck)

  if (stockCheck.smsActivate.count === 0 && stockCheck.fiveSim.count === 0) {
    return {
      success: false,
      provider: "sms-activate",
      activationId: "",
      phoneNumber: "",
      cost: 0,
      error: "NO_STOCK_AVAILABLE - Both providers are out of stock for this service",
    }
  }

  const circuitBreaker = getCircuitBreaker()
  const preferredProvider = stockCheck.bestProvider

  console.log(`[Multi-Provider] Using recommended provider: ${preferredProvider} (${stockCheck.reason})`)

  if (preferredProvider === "sms-activate") {
    try {
      const result = await trySmsActivate(countryCode, internalServiceCode)
      await circuitBreaker.recordSuccess("sms-activate", 1000)
      return result
    } catch (error: any) {
      await circuitBreaker.recordFailure("sms-activate", error.message)

      console.error(`[Multi-Provider] SMS-Activate failed: ${error.message}`)

      if (stockCheck.fiveSim.count > 0) {
        console.log("[Multi-Provider] Failing over to 5sim")
        try {
          const result = await tryFiveSim(countryCode, internalServiceCode)
          await circuitBreaker.recordSuccess("5sim", 1000)
          return result
        } catch (fiveSimError: any) {
          await circuitBreaker.recordFailure("5sim", fiveSimError.message)
          console.error(`[Multi-Provider] 5sim also failed: ${fiveSimError.message}`)
          throw fiveSimError
        }
      }
      throw error
    }
  } else {
    try {
      const result = await tryFiveSim(countryCode, internalServiceCode)
      await circuitBreaker.recordSuccess("5sim", 1000)
      return result
    } catch (error: any) {
      await circuitBreaker.recordFailure("5sim", error.message)

      console.error(`[Multi-Provider] 5sim failed: ${error.message}`)

      if (stockCheck.smsActivate.count > 0) {
        console.log("[Multi-Provider] Failing over to SMS-Activate")
        try {
          const result = await trySmsActivate(countryCode, internalServiceCode)
          await circuitBreaker.recordSuccess("sms-activate", 1000)
          return result
        } catch (smsActivateError: any) {
          await circuitBreaker.recordFailure("sms-activate", smsActivateError.message)
          console.error(`[Multi-Provider] SMS-Activate also failed: ${smsActivateError.message}`)
          throw smsActivateError
        }
      }
      throw error
    }
  }
}

async function trySmsActivate(countryCode: string, internalServiceCode: string): Promise<RentalResult> {
  const smsActivateCode = getSmsActivateCode(internalServiceCode)
  if (!smsActivateCode) {
    throw new Error("SERVICE_NOT_MAPPED")
  }

  const client = getSmsActivateClient()
  const result = await client.getNumber(countryCode, smsActivateCode)

  return {
    success: true,
    provider: "sms-activate",
    activationId: result.activationId,
    phoneNumber: result.phoneNumber,
    cost: result.activationCost,
  }
}

async function tryFiveSim(countryCode: string, internalServiceCode: string): Promise<RentalResult> {
  const fiveSimCode = getFiveSimCode(internalServiceCode)
  if (!fiveSimCode) {
    throw new Error("SERVICE_NOT_MAPPED")
  }

  const client = getFiveSimClient()
  const result = await client.purchaseNumber(countryCode, "any", fiveSimCode)

  return {
    success: true,
    provider: "5sim",
    activationId: result.id.toString(),
    phoneNumber: result.phone,
    cost: result.price,
  }
}

/**
 * Check status of an activation across providers
 */
export async function checkStatus(activationId: string, provider: Provider): Promise<StatusResult> {
  if (provider === "sms-activate") {
    const client = getSmsActivateClient()
    const result = await client.getStatus(activationId)
    return {
      ...result,
      provider: "sms-activate",
    }
  } else {
    const client = getFiveSimClient()
    const result = await client.getOrder(Number.parseInt(activationId))

    let status: StatusResult["status"] = "waiting"
    if (result.status === "FINISHED") {
      status = "completed"
    } else if (result.status === "CANCELED") {
      status = "cancelled"
    }

    return {
      status,
      code: result.sms[0]?.code,
      provider: "5sim",
    }
  }
}

/**
 * Cancel an activation across providers
 */
export async function cancelActivation(activationId: string, provider: Provider): Promise<void> {
  if (provider === "sms-activate") {
    const client = getSmsActivateClient()
    await client.cancelActivation(activationId)
  } else {
    const client = getFiveSimClient()
    await client.cancelOrder(Number.parseInt(activationId))
  }
}

/**
 * Finish an activation across providers
 */
export async function finishActivation(activationId: string, provider: Provider): Promise<void> {
  if (provider === "sms-activate") {
    const client = getSmsActivateClient()
    await client.finishActivation(activationId)
  } else {
    const client = getFiveSimClient()
    await client.finishOrder(Number.parseInt(activationId))
  }
}
