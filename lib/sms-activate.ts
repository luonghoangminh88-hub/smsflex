/**
 * SMS-Activate API Client for 5SIM Protocol
 * Documentation: https://sms-activate.io/api
 */

import { getSmsActivateCountryCode } from "./country-mapping"

interface SmsActivateConfig {
  apiKey: string
  baseUrl?: string
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

  constructor(config: SmsActivateConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || "https://api.sms-activate.io/stubs/handler_api.php"
  }

  /**
   * Get balance of the account
   */
  async getBalance(): Promise<number> {
    const response = await this.makeRequest<string>({
      action: "getBalance",
    })

    // Response format: "ACCESS_BALANCE:123.45"
    const balance = Number.parseFloat(response.split(":")[1])
    return balance
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
      console.warn(`[v0] No SMS-Activate country mapping for: ${countryCode}`)
      return 0
    }

    const response = await this.makeRequest<any>({
      action: "getNumbersStatus",
      country: smsActivateCountryCode.toString(),
      operator: service, // SMS-Activate uses 'operator' parameter for service filtering
    })

    console.log(`[v0] SMS-Activate getNumbersStatus response:`, response)

    // Response is a JSON object like: {"vk_0":76,"ok_0":139}
    // We need to parse and sum up counts for our service
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
  }

  /**
   * Rent a phone number for OTP
   */
  async getNumber(country: string, service: string): Promise<GetNumberResponse> {
    const smsActivateCountryCode = getSmsActivateCountryCode(country)
    if (smsActivateCountryCode === undefined) {
      throw new Error(`No SMS-Activate country mapping for: ${country}`)
    }

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

    throw new Error(`Failed to get number: ${response}`)
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
    // "STATUS_WAIT_CODE" - waiting for SMS
    // "STATUS_OK:123456" - code received
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
   * Make HTTP request to SMS-Activate API
   */
  private async makeRequest<T>(params: Record<string, string>): Promise<T> {
    const url = new URL(this.baseUrl)
    url.searchParams.append("api_key", this.apiKey)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value)
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      throw new Error(`SMS-Activate API error: ${response.statusText}`)
    }

    const contentType = response.headers.get("content-type")
    if (contentType?.includes("application/json")) {
      return response.json()
    }

    // Most responses are plain text
    return response.text() as T
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

    smsActivateClient = new SmsActivateClient({ apiKey })
  }

  return smsActivateClient
}

export type { GetNumberResponse, GetStatusResponse, GetPricesResponse }
