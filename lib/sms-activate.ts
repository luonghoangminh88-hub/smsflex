/**
 * SMS-Activate API Client for 5SIM Protocol
 * Documentation: https://sms-activate.io/api
 * Enhanced with comprehensive error handling and security
 */

import { getSmsActivateCountryCode } from "./country-mapping"
import { SmsActivateError, SmsActivateErrorCode, shouldRetry, getRetryDelay } from "./errors/sms-activate-errors"

interface SmsActivateConfig {
  apiKey: string
  baseUrl?: string
  webhookSecret?: string
}

interface GetNumberResponse {
  activationId: string
  phoneNumber: string
  activationCost: number
}

interface GetStatusResponse {
  status: string
  code?: string
}

interface GetBalanceResponse {
  balance: number
}

interface GetPricesResponse {
  [country: string]: {
    [service: string]: {
      cost: number
      count: number
    }
  }
}

class SmsActivateClient {
  private apiKey: string
  private baseUrl: string
  private webhookSecret?: string

  constructor(config: SmsActivateConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || "https://api.sms-activate.io/stubs/handler_api.php"
    this.webhookSecret = config.webhookSecret
  }

  /**
   * Get balance of the account
   */
  async getBalance(): Promise<number> {
    const response = await this.makeRequest<string>({
      action: "getBalance",
    })

    // Response format: "ACCESS_BALANCE:123.45"
    if (response.startsWith("ACCESS_BALANCE:")) {
      const balance = Number.parseFloat(response.split(":")[1])
      return balance
    }

    throw SmsActivateError.fromResponse(response)
  }

  /**
   * Get available prices for services and countries
   */
  async getPrices(country?: string, service?: string): Promise<GetPricesResponse> {
    const params: Record<string, string> = {
      action: "getPrices",
    }

    if (country) {
      params.country = country
    }
    if (service) {
      params.service = service
    }

    const response = await this.makeRequest<GetPricesResponse>(params)
    return response
  }

  /**
   * Get available count for a specific service and country
   */
  async getNumbersStatus(countryCode: string, service: string): Promise<number> {
    const smsActivateCountryCode = getSmsActivateCountryCode(countryCode)
    if (smsActivateCountryCode === undefined) {
      console.warn(`[SMS-Activate] No country mapping for: ${countryCode}`)
      return 0
    }

    try {
      const response = await this.makeRequest<any>({
        action: "getNumbersStatus",
        country: smsActivateCountryCode.toString(),
        operator: service,
      })

      console.log(`[SMS-Activate] getNumbersStatus response:`, response)

      // Response is a JSON object like: {"vk_0":76,"ok_0":139}
      if (typeof response === "object" && response !== null) {
        let totalCount = 0
        for (const key in response) {
          if (key.startsWith(service)) {
            totalCount += response[key] || 0
          }
        }
        return totalCount
      }

      return 0
    } catch (error) {
      if (error instanceof SmsActivateError && error.code === SmsActivateErrorCode.NO_NUMBERS) {
        return 0
      }
      throw error
    }
  }

  /**
   * Rent a phone number for OTP with retry logic
   */
  async getNumber(country: string, service: string, attemptCount = 0): Promise<GetNumberResponse> {
    const smsActivateCountryCode = getSmsActivateCountryCode(country)
    if (smsActivateCountryCode === undefined) {
      throw new SmsActivateError(
        SmsActivateErrorCode.WRONG_SERVICE,
        `No SMS-Activate country mapping for: ${country}`,
        false,
      )
    }

    try {
      const response = await this.makeRequest<string>({
        action: "getNumber",
        service,
        country: smsActivateCountryCode.toString(),
      })

      // Response format: "ACCESS_NUMBER:activationId:phoneNumber:cost"
      if (response.startsWith("ACCESS_NUMBER:")) {
        const parts = response.split(":")
        return {
          activationId: parts[1],
          phoneNumber: parts[2],
          activationCost: Number.parseFloat(parts[3] || "0"),
        }
      }

      throw SmsActivateError.fromResponse(response)
    } catch (error) {
      if (error instanceof SmsActivateError && shouldRetry(error, attemptCount)) {
        const delay = getRetryDelay(attemptCount)
        console.log(`[SMS-Activate] Retrying getNumber after ${delay}ms (attempt ${attemptCount + 1})`)
        await new Promise((resolve) => setTimeout(resolve, delay))
        return this.getNumber(country, service, attemptCount + 1)
      }
      throw error
    }
  }

  /**
   * Get status of activation and OTP code if available
   */
  async getStatus(activationId: string): Promise<GetStatusResponse> {
    const response = await this.makeRequest<string>({
      action: "getStatus",
      id: activationId,
    })

    // Response formats:
    // "STATUS_OK:123456" - code received
    // "STATUS_WAIT_CODE" - waiting for SMS
    // "STATUS_CANCEL" - activation cancelled

    if (response.startsWith("STATUS_OK:")) {
      return {
        status: "completed",
        code: response.split(":")[1],
      }
    }

    if (response === "STATUS_WAIT_CODE") {
      return { status: "waiting" }
    }

    if (response === "STATUS_CANCEL") {
      return { status: "cancelled" }
    }

    if (response === "STATUS_WAIT_RETRY") {
      return { status: "waiting" }
    }

    console.warn(`[SMS-Activate] Unknown status: ${response}`)
    return { status: "unknown" }
  }

  /**
   * Set status of activation
   */
  async setStatus(activationId: string, status: number): Promise<string> {
    // Status codes:
    // 1 - ready to receive SMS (notify that number is being used)
    // 3 - request another SMS
    // 6 - complete activation
    // 8 - cancel activation

    const response = await this.makeRequest<string>({
      action: "setStatus",
      id: activationId,
      status: status.toString(),
    })

    if (response.includes("ACCESS_") || response.includes("ERROR")) {
      if (response.startsWith("ALREADY_")) {
        throw SmsActivateError.fromResponse(response)
      }
    }

    return response
  }

  /**
   * Cancel activation
   */
  async cancelActivation(activationId: string): Promise<string> {
    return this.setStatus(activationId, 8)
  }

  /**
   * Finish activation
   */
  async finishActivation(activationId: string): Promise<string> {
    return this.setStatus(activationId, 6)
  }

  /**
   * Make HTTP request to SMS-Activate API with enhanced error handling
   */
  private async makeRequest<T>(params: Record<string, string>): Promise<T> {
    if (typeof window !== "undefined") {
      throw new Error("SMS-Activate client can only be used on server-side")
    }

    const url = new URL(this.baseUrl)
    url.searchParams.append("api_key", this.apiKey)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value)
    }

    try {
      const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(15000), // 15 second timeout
      })

      if (!response.ok) {
        throw new SmsActivateError(
          SmsActivateErrorCode.UNKNOWN_ERROR,
          `HTTP error: ${response.status} ${response.statusText}`,
          false,
        )
      }

      const contentType = response.headers.get("content-type")
      let data: T

      if (contentType?.includes("application/json")) {
        data = await response.json()
      } else {
        // Most responses are plain text
        data = (await response.text()) as T
      }

      if (typeof data === "string" && this.isErrorResponse(data)) {
        throw SmsActivateError.fromResponse(data)
      }

      return data
    } catch (error) {
      if (error instanceof SmsActivateError) {
        throw error
      }

      if (error instanceof Error) {
        if (error.name === "AbortError" || error.name === "TimeoutError") {
          throw new SmsActivateError(SmsActivateErrorCode.SQL_ERROR, "Request timeout", true)
        }

        throw new SmsActivateError(SmsActivateErrorCode.UNKNOWN_ERROR, error.message, false)
      }

      throw new SmsActivateError(SmsActivateErrorCode.UNKNOWN_ERROR, "Unknown error occurred", false)
    }
  }

  private isErrorResponse(response: string): boolean {
    const errorPatterns = [
      "NO_BALANCE",
      "BAD_KEY",
      "BANNED",
      "NO_NUMBERS",
      "NO_ACTIVATION",
      "WRONG_SERVICE",
      "WRONG_EXCEPTION_PHONE",
      "BAD_ACTION",
      "BAD_SERVICE",
      "WRONG_ACTIVATION_ID",
      "ALREADY_FINISH",
      "ALREADY_CANCEL",
      "SQL_ERROR",
    ]

    return errorPatterns.some((pattern) => response.includes(pattern))
  }

  getWebhookSecret(): string | undefined {
    return this.webhookSecret
  }
}

// Export singleton instance
let smsActivateClient: SmsActivateClient | null = null

export function getSmsActivateClient(): SmsActivateClient {
  if (!smsActivateClient) {
    const apiKey = process.env.SMS_ACTIVATE_API_KEY

    if (!apiKey) {
      throw new Error("SMS_ACTIVATE_API_KEY environment variable is not set")
    }

    const webhookSecret = process.env.SMS_ACTIVATE_WEBHOOK_SECRET

    smsActivateClient = new SmsActivateClient({
      apiKey,
      webhookSecret,
    })
  }

  return smsActivateClient
}

export type { GetNumberResponse, GetStatusResponse, GetPricesResponse }
export { SmsActivateError, SmsActivateErrorCode }
