/**
 * Multi-Provider Client with Automatic Failover
 * Handles SMS-Activate and 5sim with intelligent fallback
 */

import { getSmsActivateClient } from "./sms-activate"
import { getFiveSimClient } from "./5sim"
import { getSmsActivateCode, getFiveSimCode } from "./service-mapping"
import { getFiveSimCountryCode } from "./country-mapping"

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
 * Try to rent a number with automatic failover between providers
 * Now includes pre-check for stock availability
 */
export async function rentNumberWithFailover(countryCode: string, internalServiceCode: string): Promise<RentalResult> {
  console.log(`[v0] Renting number with failover for service: ${internalServiceCode}, country: ${countryCode}`)

  console.log("[v0] Checking stock availability...")
  const stockCheck = await checkStockAvailability(countryCode, internalServiceCode)
  console.log("[v0] Stock check result:", stockCheck)

  if (stockCheck.total === 0) {
    return {
      success: false,
      provider: "sms-activate",
      activationId: "",
      phoneNumber: "",
      cost: 0,
      error: "NO_STOCK_AVAILABLE - Both providers are out of stock for this service",
    }
  }

  // Determine which provider to try first based on stock availability
  const trySmsActivateFirst = stockCheck.smsActivate > 0

  if (trySmsActivateFirst) {
    // Try SMS-Activate first (primary provider)
    try {
      const smsActivateCode = getSmsActivateCode(internalServiceCode)
      if (!smsActivateCode) {
        console.warn(`[v0] No SMS-Activate mapping for service: ${internalServiceCode}`)
        throw new Error("SERVICE_NOT_MAPPED")
      }

      console.log(`[v0] Trying SMS-Activate with code: ${smsActivateCode}`)
      const client = getSmsActivateClient()
      const result = await client.getNumber(countryCode, smsActivateCode)

      console.log(`[v0] SMS-Activate success: ${result.phoneNumber}`)
      return {
        success: true,
        provider: "sms-activate",
        activationId: result.activationId,
        phoneNumber: result.phoneNumber,
        cost: result.activationCost,
      }
    } catch (smsActivateError: any) {
      console.error(`[v0] SMS-Activate failed:`, smsActivateError.message)

      // Failover to 5sim if available
      if (stockCheck.fiveSim > 0) {
        console.log(`[v0] Failing over to 5sim...`)
        return tryFiveSim(countryCode, internalServiceCode)
      } else {
        return {
          success: false,
          provider: "sms-activate",
          activationId: "",
          phoneNumber: "",
          cost: 0,
          error: smsActivateError.message,
        }
      }
    }
  } else {
    // Try 5sim first if SMS-Activate has no stock
    try {
      return await tryFiveSim(countryCode, internalServiceCode)
    } catch (fiveSimError: any) {
      // Failover to SMS-Activate if available
      if (stockCheck.smsActivate > 0) {
        console.log(`[v0] Failing over to SMS-Activate...`)
        return trySmsActivate(countryCode, internalServiceCode)
      } else {
        return {
          success: false,
          provider: "5sim",
          activationId: "",
          phoneNumber: "",
          cost: 0,
          error: fiveSimError.message,
        }
      }
    }
  }
}

async function trySmsActivate(countryCode: string, internalServiceCode: string): Promise<RentalResult> {
  const smsActivateCode = getSmsActivateCode(internalServiceCode)
  if (!smsActivateCode) {
    throw new Error("SERVICE_NOT_MAPPED")
  }

  console.log(`[v0] Trying SMS-Activate with code: ${smsActivateCode}`)
  const client = getSmsActivateClient()
  const result = await client.getNumber(countryCode, smsActivateCode)

  console.log(`[v0] SMS-Activate success: ${result.phoneNumber}`)
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

  console.log(`[v0] Trying 5sim with code: ${fiveSimCode}`)
  const client = getFiveSimClient()
  const result = await client.purchaseNumber(countryCode, "any", fiveSimCode)

  console.log(`[v0] 5sim success: ${result.phone}`)
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
