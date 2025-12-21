/**
 * Multi-Provider Client with Enhanced Failover
 * Includes health tracking, smart retry, and performance monitoring
 */

import { getSmsActivateClient } from "./sms-activate"
import { getFiveSimClient } from "./5sim"
import { getSmsActivateCode, getFiveSimCode } from "./service-mapping"
import { getFiveSimCountryCode } from "./country-mapping"
import { getFreePriceInfo, calculateOptimalFreePrice } from "./freeprice"
import {
  recordProviderRequest,
  selectOptimalProvider,
  isProviderHealthy,
  getProviderPreferences,
  type Provider,
  type RequestType,
} from "./provider-health"

export type { Provider }

export interface RentalResult {
  success: boolean
  provider: Provider
  activationId: string
  phoneNumber: string
  cost: number
  error?: string
  usedFreePrice?: boolean
  regularPrice?: number
  savingsAmount?: number
  responseTimeMs?: number
  retriedCount?: number
}

export interface StatusResult {
  status: "waiting" | "completed" | "cancelled" | "unknown"
  code?: string
  provider: Provider
}

/**
 * Execute provider request with timing and error tracking
 */
async function executeProviderRequest<T>(
  provider: Provider,
  requestType: RequestType,
  fn: () => Promise<T>,
  metadata?: {
    countryCode?: string
    serviceCode?: string
    rentalId?: string
  },
): Promise<T> {
  const startTime = Date.now()

  try {
    const result = await fn()
    const responseTimeMs = Date.now() - startTime

    // Record successful request
    await recordProviderRequest({
      provider,
      requestType,
      success: true,
      responseTimeMs,
      ...metadata,
    })

    return result
  } catch (error) {
    const responseTimeMs = Date.now() - startTime

    // Record failed request
    await recordProviderRequest({
      provider,
      requestType,
      success: false,
      responseTimeMs,
      errorMessage: error instanceof Error ? error.message : "Unknown error",
      ...metadata,
    })

    throw error
  }
}

/**
 * Retry logic with exponential backoff
 */
async function retryWithBackoff<T>(fn: () => Promise<T>, maxAttempts: number, delayMs: number): Promise<T> {
  let lastError: Error | undefined

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error instanceof Error ? error : new Error("Unknown error")
      console.log(`[Retry] Attempt ${attempt}/${maxAttempts} failed: ${lastError.message}`)

      if (attempt < maxAttempts) {
        const backoffDelay = delayMs * Math.pow(2, attempt - 1)
        console.log(`[Retry] Waiting ${backoffDelay}ms before next attempt...`)
        await new Promise((resolve) => setTimeout(resolve, backoffDelay))
      }
    }
  }

  throw lastError || new Error("Max retry attempts reached")
}

/**
 * Check stock availability before renting
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

    if (smsActivateCode) {
      const client = getSmsActivateClient()
      const count = await executeProviderRequest(
        "sms-activate",
        "check_status",
        () => client.getNumbersStatus(countryCode, smsActivateCode),
        { countryCode, serviceCode: smsActivateCode },
      )
      smsActivateStock = count
    }
  } catch (error: any) {
    console.error("[Stock Check] SMS-Activate error:", error.message)
  }

  // Check 5sim stock
  try {
    const fiveSimCode = getFiveSimCode(internalServiceCode)
    const fiveSimCountry = getFiveSimCountryCode(countryCode)

    if (fiveSimCode && fiveSimCountry) {
      const client = getFiveSimClient()
      const prices = await executeProviderRequest(
        "5sim",
        "check_status",
        () => client.getPrices(countryCode, fiveSimCode),
        { countryCode, serviceCode: fiveSimCode },
      )

      if (prices[fiveSimCountry] && prices[fiveSimCountry][fiveSimCode]) {
        const operators = prices[fiveSimCountry][fiveSimCode]
        let totalCount = 0
        for (const operator in operators) {
          if (operators[operator]?.count) {
            totalCount += operators[operator].count
          }
        }
        fiveSimStock = totalCount
      }
    }
  } catch (error: any) {
    console.error("[Stock Check] 5sim error:", error.message)
  }

  return {
    smsActivate: smsActivateStock,
    fiveSim: fiveSimStock,
    total: smsActivateStock + fiveSimStock,
  }
}

/**
 * Try to rent a number with enhanced failover logic
 */
export async function rentNumberWithFailover(
  countryCode: string,
  internalServiceCode: string,
  options?: {
    maxPrice?: number
    enableFreePrice?: boolean
    prioritizePrice?: boolean
  },
): Promise<RentalResult> {
  const preferences = await getProviderPreferences()
  const startTime = Date.now()
  let retriedCount = 0

  if (options?.enableFreePrice !== false) {
    const smsActivateCode = getSmsActivateCode(internalServiceCode)
    if (smsActivateCode) {
      const freePriceInfo = await getFreePriceInfo(smsActivateCode, countryCode)

      if (freePriceInfo?.enabled) {
        const optimalPrice = calculateOptimalFreePrice(freePriceInfo, {
          maxPrice: options?.maxPrice,
          prioritizePrice: options?.prioritizePrice ?? true,
          minStock: 5,
        })

        if (optimalPrice) {
          try {
            return await rentWithFreePrice(countryCode, smsActivateCode, optimalPrice.price, freePriceInfo.regularPrice)
          } catch (error) {
            console.error("[FreePrice] Failed, falling back:", error)
          }
        }
      }
    }
  }

  const stockCheck = await checkStockAvailability(countryCode, internalServiceCode)

  if (stockCheck.total === 0) {
    return {
      success: false,
      provider: "sms-activate",
      activationId: "",
      phoneNumber: "",
      cost: 0,
      error: "NO_STOCK_AVAILABLE",
      responseTimeMs: Date.now() - startTime,
    }
  }

  const optimalProvider = await selectOptimalProvider(stockCheck.smsActivate, stockCheck.fiveSim)
  const smsActivateHealthy = await isProviderHealthy("sms-activate")
  const fiveSimHealthy = await isProviderHealthy("5sim")

  const tryOrder: Provider[] = []

  if (optimalProvider === "sms-activate" && smsActivateHealthy && stockCheck.smsActivate > 0) {
    tryOrder.push("sms-activate")
    if (preferences.fallback_enabled && fiveSimHealthy && stockCheck.fiveSim > 0) {
      tryOrder.push("5sim")
    }
  } else if (optimalProvider === "5sim" && fiveSimHealthy && stockCheck.fiveSim > 0) {
    tryOrder.push("5sim")
    if (preferences.fallback_enabled && smsActivateHealthy && stockCheck.smsActivate > 0) {
      tryOrder.push("sms-activate")
    }
  } else {
    // Fallback: try any available healthy provider
    if (smsActivateHealthy && stockCheck.smsActivate > 0) tryOrder.push("sms-activate")
    if (fiveSimHealthy && stockCheck.fiveSim > 0) tryOrder.push("5sim")
  }

  let lastError = "All providers failed"

  for (const provider of tryOrder) {
    try {
      console.log(`[Failover] Trying ${provider}...`)

      const result = await retryWithBackoff(
        async () => {
          if (provider === "sms-activate") {
            return await trySmsActivate(countryCode, internalServiceCode, options?.maxPrice)
          } else {
            return await tryFiveSim(countryCode, internalServiceCode)
          }
        },
        preferences.retry_attempts,
        preferences.retry_delay_ms,
      )

      retriedCount = preferences.retry_attempts - 1
      return {
        ...result,
        responseTimeMs: Date.now() - startTime,
        retriedCount,
      }
    } catch (error: any) {
      console.error(`[Failover] ${provider} failed:`, error.message)
      lastError = error.message
      retriedCount++
      // Continue to next provider
    }
  }

  return {
    success: false,
    provider: "sms-activate",
    activationId: "",
    phoneNumber: "",
    cost: 0,
    error: lastError,
    responseTimeMs: Date.now() - startTime,
    retriedCount,
  }
}

async function rentWithFreePrice(
  countryCode: string,
  serviceCode: string,
  maxPrice: number,
  regularPrice: number,
): Promise<RentalResult> {
  const client = getSmsActivateClient()
  const result = await executeProviderRequest(
    "sms-activate",
    "purchase",
    () =>
      client.getNumberV2(countryCode, serviceCode, {
        maxPrice,
      }),
    { countryCode, serviceCode },
  )

  const savingsAmount = regularPrice - result.activationCost

  return {
    success: true,
    provider: "sms-activate",
    activationId: result.activationId,
    phoneNumber: result.phoneNumber,
    cost: result.activationCost,
    usedFreePrice: true,
    regularPrice,
    savingsAmount: savingsAmount > 0 ? savingsAmount : undefined,
  }
}

async function trySmsActivate(
  countryCode: string,
  internalServiceCode: string,
  maxPrice?: number,
): Promise<RentalResult> {
  const smsActivateCode = getSmsActivateCode(internalServiceCode)
  if (!smsActivateCode) {
    throw new Error("SERVICE_NOT_MAPPED")
  }

  const client = getSmsActivateClient()
  const result = await executeProviderRequest(
    "sms-activate",
    "purchase",
    () =>
      client.getNumberV2(countryCode, smsActivateCode, {
        maxPrice,
      }),
    { countryCode, serviceCode: smsActivateCode },
  )

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
  const result = await executeProviderRequest(
    "5sim",
    "purchase",
    () => client.purchaseNumber(countryCode, "any", fiveSimCode),
    { countryCode, serviceCode: fiveSimCode },
  )

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
    const result = await executeProviderRequest("sms-activate", "check_status", () => client.getStatus(activationId))

    return {
      ...result,
      provider: "sms-activate",
    }
  } else {
    const client = getFiveSimClient()
    const result = await executeProviderRequest("5sim", "check_status", () =>
      client.getOrder(Number.parseInt(activationId)),
    )

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
    await executeProviderRequest("sms-activate", "cancel", () => client.cancelActivation(activationId))
  } else {
    const client = getFiveSimClient()
    await executeProviderRequest("5sim", "cancel", () => client.cancelOrder(Number.parseInt(activationId)))
  }
}

/**
 * Finish an activation across providers
 */
export async function finishActivation(activationId: string, provider: Provider): Promise<void> {
  if (provider === "sms-activate") {
    const client = getSmsActivateClient()
    await executeProviderRequest("sms-activate", "finish", () => client.finishActivation(activationId))
  } else {
    const client = getFiveSimClient()
    await executeProviderRequest("5sim", "finish", () => client.finishOrder(Number.parseInt(activationId)))
  }
}
