/**
 * SMS-Activate API V2 Client
 * Extended features including getNumberV2, Free Price, and advanced operations
 */

import { getSmsActivateCountryCode } from "./country-mapping"
import { SmsActivateError, SmsActivateErrorCode } from "./errors/sms-activate-errors"

interface GetNumberV2Response {
  activationId: string
  phoneNumber: string
  activationCost: number
  canGetAnotherSms: boolean
  activationTime: string
  discount: number
  activationOperator: string
  countryCode: string
  serviceCode: string
}

interface FreePriceResponse {
  [country: string]: {
    [service: string]: {
      cost: number
      count: number
    }
  }
}

interface TopCountriesResponse {
  [country: string]: number
}

interface AdditionalSmsResponse {
  code?: string
  status: string
}

export class SmsActivateV2Client {
  private apiKey: string
  private baseUrl: string

  constructor(apiKey: string, baseUrl?: string) {
    this.apiKey = apiKey
    this.baseUrl = baseUrl || "https://api.sms-activate.io/stubs/handler_api.php"
  }

  /**
   * Get number with detailed information (API V2)
   * Provides more metadata about the activation
   */
  async getNumberV2(country: string, service: string): Promise<GetNumberV2Response> {
    const smsActivateCountryCode = getSmsActivateCountryCode(country)
    if (smsActivateCountryCode === undefined) {
      throw new SmsActivateError(
        SmsActivateErrorCode.WRONG_SERVICE,
        `No SMS-Activate country mapping for: ${country}`,
        false,
      )
    }

    const response = await this.makeRequest<string>({
      action: "getNumberV2",
      service,
      country: smsActivateCountryCode.toString(),
    })

    // Response format V2: JSON object with detailed info
    if (typeof response === "object" && "activationId" in response) {
      return response as GetNumberV2Response
    }

    // Fallback to V1 format parsing
    if (typeof response === "string" && response.startsWith("ACCESS_NUMBER:")) {
      const parts = response.split(":")
      return {
        activationId: parts[1],
        phoneNumber: parts[2],
        activationCost: Number.parseFloat(parts[3] || "0"),
        canGetAnotherSms: false,
        activationTime: new Date().toISOString(),
        discount: 0,
        activationOperator: "unknown",
        countryCode: country,
        serviceCode: service,
      }
    }

    throw SmsActivateError.fromResponse(response as string)
  }

  /**
   * Get prices with Free Price method
   * This returns more competitive pricing
   */
  async getFreePrice(country?: string, service?: string): Promise<FreePriceResponse> {
    const params: Record<string, string> = {
      action: "getPricesFreePrice",
    }

    if (country) {
      const smsActivateCountryCode = getSmsActivateCountryCode(country)
      if (smsActivateCountryCode !== undefined) {
        params.country = smsActivateCountryCode.toString()
      }
    }

    if (service) {
      params.service = service
    }

    const response = await this.makeRequest<FreePriceResponse>(params)
    return response
  }

  /**
   * Get top countries by service
   * Helps determine which countries have best availability
   */
  async getTopCountriesByService(service: string): Promise<TopCountriesResponse> {
    const response = await this.makeRequest<TopCountriesResponse>({
      action: "getTopCountriesByService",
      service,
    })

    return response
  }

  /**
   * Request additional SMS for the same activation
   */
  async requestAdditionalSms(activationId: string): Promise<AdditionalSmsResponse> {
    const response = await this.makeRequest<string>({
      action: "setStatus",
      id: activationId,
      status: "3", // Status 3 = request another SMS
    })

    if (response.startsWith("STATUS_OK:")) {
      return {
        code: response.split(":")[1],
        status: "received",
      }
    }

    if (response === "STATUS_WAIT_CODE") {
      return { status: "waiting" }
    }

    return { status: response }
  }

  /**
   * Get rent number (long-term rental)
   */
  async getRentNumber(
    service: string,
    country: string,
    rentTime = 4,
  ): Promise<{
    phoneNumber: string
    rentId: string
    endDate: string
    cost: number
  }> {
    const smsActivateCountryCode = getSmsActivateCountryCode(country)
    if (smsActivateCountryCode === undefined) {
      throw new SmsActivateError(SmsActivateErrorCode.WRONG_SERVICE, `No country mapping for: ${country}`, false)
    }

    const response = await this.makeRequest<string>({
      action: "getRentNumber",
      service,
      country: smsActivateCountryCode.toString(),
      rent_time: rentTime.toString(), // hours
    })

    // Response format: "ACCESS_RENT:rentId:phoneNumber:endDate:cost"
    if (response.startsWith("ACCESS_RENT:")) {
      const parts = response.split(":")
      return {
        rentId: parts[1],
        phoneNumber: parts[2],
        endDate: parts[3],
        cost: Number.parseFloat(parts[4] || "0"),
      }
    }

    throw SmsActivateError.fromResponse(response)
  }

  /**
   * Get rent status and messages
   */
  async getRentStatus(rentId: string): Promise<{ messages: Array<{ text: string; timestamp: string }> }> {
    const response = await this.makeRequest<any>({
      action: "getRentStatus",
      id: rentId,
    })

    if (typeof response === "object" && "values" in response) {
      return {
        messages: response.values || [],
      }
    }

    return { messages: [] }
  }

  private async makeRequest<T>(params: Record<string, string>): Promise<T> {
    if (typeof window !== "undefined") {
      throw new Error("SMS-Activate V2 client can only be used on server-side")
    }

    const url = new URL(this.baseUrl)
    url.searchParams.append("api_key", this.apiKey)

    for (const [key, value] of Object.entries(params)) {
      url.searchParams.append(key, value)
    }

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: { Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
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
      data = (await response.text()) as T
    }

    return data
  }
}

// Export singleton
let v2ClientInstance: SmsActivateV2Client | null = null

export function getSmsActivateV2Client(): SmsActivateV2Client {
  if (!v2ClientInstance) {
    const apiKey = process.env.SMS_ACTIVATE_API_KEY
    if (!apiKey) {
      throw new Error("SMS_ACTIVATE_API_KEY environment variable is not set")
    }
    v2ClientInstance = new SmsActivateV2Client(apiKey)
  }
  return v2ClientInstance
}
