/**
 * SMS-Activate API v2 Client
 * Documentation: https://sms-activate.io/api2
 * OpenAPI v2: https://sms-activate.io/docs/v2
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
  currency?: number // ISO 4217 Num
  countryCode?: string
  canGetAnotherSms?: string
  activationTime?: string
  activationOperator?: string
}

interface GetStatusResponse {
  status: string
  code?: string
  verificationType?: number // 0 - SMS, 1 - call number, 2 - voice call
  text?: string
  receivedAt?: string
}

interface GetBalanceResponse {
  balance: number
  cashback?: number
}

interface GetPricesResponse {
  [country: string]: {
    [service: string]: {
      cost: number
      count: number
    }
  }
}

interface TopCountriesResponse {
  country: number
  count: number
  price: number
  retail_price: number
  freePriceMap?: {
    [price: string]: number
  }
}

interface ActiveActivation {
  activationId: string
  serviceCode: string
  phoneNumber: string
  activationCost: number
  activationStatus: string
  smsCode?: string[]
  smsText?: string
  activationTime: string
  discount: string
  repeated: string
  countryCode: string
  countryName: string
  canGetAnotherSms: string
  currency: number
}

interface WebhookPayload {
  activationId: number
  service: string
  text: string
  code: string
  country: number
  receivedAt: string
}

class SmsActivateClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: SmsActivateConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || "https://api.sms-activate.ae/stubs/handler_api.php"
  }

  /**
   * Get balance of the account (with optional cashback)
   */
  async getBalance(includeCashback = false): Promise<GetBalanceResponse> {
    const action = includeCashback ? "getBalanceAndCashBack" : "getBalance"
    const response = await this.makeRequest<string>({ action })

    // Response format: "ACCESS_BALANCE:123.45"
    const balance = Number.parseFloat(response.split(":")[1])
    return { balance }
  }

  /**
   * Get available prices for services and countries
   */
  async getPrices(country?: string, service?: string): Promise<GetPricesResponse> {
    const params: Record<string, string> = {
      action: "getPrices",
    }

    if (country) params.country = country
    if (service) params.service = service

    const response = await this.makeRequest<GetPricesResponse>(params)
    return response
  }

  /**
   * Get current prices with FreePrice support
   */
  async getPricesFreePrice(country: string, service?: string): Promise<GetPricesResponse> {
    const params: Record<string, string> = {
      action: "getPricesFreePrice",
      country,
    }

    if (service) params.service = service

    return this.makeRequest<GetPricesResponse>(params)
  }

  /**
   * Get top countries by service with FreePrice support
   */
  async getTopCountriesByService(service: string, freePrice = false): Promise<TopCountriesResponse[]> {
    const params: Record<string, string> = {
      action: "getTopCountriesByService",
      service,
    }

    if (freePrice) params.freePrice = "true"

    const response = await this.makeRequest<Record<string, TopCountriesResponse>>(params)
    return Object.values(response)
  }

  /**
   * Get top countries by service considering user rank with FreePrice support
   */
  async getTopCountriesByServiceRank(service: string, freePrice = false): Promise<TopCountriesResponse[]> {
    const params: Record<string, string> = {
      action: "getTopCountriesByServiceRank",
      service,
    }

    if (freePrice) params.freePrice = "true"

    const response = await this.makeRequest<Record<string, TopCountriesResponse>>(params)
    return Object.values(response)
  }

  /**
   * Get available count for a specific service and country
   */
  async getNumbersStatus(countryCode: string, service?: string): Promise<number> {
    const smsActivateCountryCode = getSmsActivateCountryCode(countryCode)
    if (smsActivateCountryCode === undefined) {
      console.warn(`[SMS-Activate] No country mapping for: ${countryCode}`)
      return 0
    }

    const params: Record<string, string> = {
      action: "getNumbersStatus",
      country: smsActivateCountryCode.toString(),
    }

    if (service) params.operator = service

    const response = await this.makeRequest<Record<string, number>>(params)

    // Response is a JSON object like: {"vk_0":76,"ok_0":139}
    if (typeof response === "object" && response !== null) {
      let totalCount = 0
      for (const key in response) {
        if (!service || key.startsWith(service)) {
          totalCount += response[key] || 0
        }
      }
      return totalCount
    }

    return 0
  }

  /**
   * Get available operators for a country
   */
  async getOperators(country?: string): Promise<Record<string, string[]>> {
    const params: Record<string, string> = {
      action: "getOperators",
    }

    if (country) params.country = country

    const response = await this.makeRequest<{
      status: string
      countryOperators: Record<string, string[]>
    }>(params)

    if (response.status === "success") {
      return response.countryOperators
    }

    throw new Error("Failed to get operators")
  }

  /**
   * Get active activations for the account
   */
  async getActiveActivations(): Promise<ActiveActivation[]> {
    const response = await this.makeRequest<{
      status: string
      activeActivations: ActiveActivation[]
    }>({
      action: "getActiveActivations",
    })

    if (response.status === "success") {
      return response.activeActivations
    }

    return []
  }

  /**
   * Rent a phone number for OTP (v1 legacy method)
   */
  async getNumber(
    country: string,
    service: string,
    options?: {
      operator?: string
      ref?: string
      phoneException?: string
      maxPrice?: number
      useCashBack?: boolean
      activationType?: 0 | 1 | 2 // 0: SMS, 1: number, 2: voice
      language?: string
      userId?: string
    },
  ): Promise<GetNumberResponse> {
    const smsActivateCountryCode = getSmsActivateCountryCode(country)
    if (smsActivateCountryCode === undefined) {
      throw new Error(`No SMS-Activate country mapping for: ${country}`)
    }

    const params: Record<string, string> = {
      action: "getNumber",
      service,
      country: smsActivateCountryCode.toString(),
    }

    if (options?.operator) params.operator = options.operator
    if (options?.ref) params.ref = options.ref
    if (options?.phoneException) params.phoneException = options.phoneException
    if (options?.maxPrice) params.maxPrice = options.maxPrice.toString()
    if (options?.useCashBack) params.useCashBack = "true"
    if (options?.activationType !== undefined) params.activationType = options.activationType.toString()
    if (options?.language) params.language = options.language
    if (options?.userId) params.userId = options.userId

    const response = await this.makeRequest<string>(params)

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
   * Rent a phone number for OTP (v2 with extended response)
   */
  async getNumberV2(
    country: string,
    service: string,
    options?: {
      operator?: string
      ref?: string
      phoneException?: string
      maxPrice?: number
      activationType?: 0 | 1 | 2
      language?: string
      userId?: string
      orderId?: string
    },
  ): Promise<GetNumberResponse> {
    const smsActivateCountryCode = getSmsActivateCountryCode(country)
    if (smsActivateCountryCode === undefined) {
      throw new Error(`No SMS-Activate country mapping for: ${country}`)
    }

    const params: Record<string, string> = {
      action: "getNumberV2",
      service,
      country: smsActivateCountryCode.toString(),
    }

    if (options?.operator) params.operator = options.operator
    if (options?.ref) params.ref = options.ref
    if (options?.phoneException) params.phoneException = options.phoneException
    if (options?.maxPrice) params.maxPrice = options.maxPrice.toString()
    if (options?.activationType !== undefined) params.activationType = options.activationType.toString()
    if (options?.language) params.language = options.language
    if (options?.userId) params.userId = options.userId
    if (options?.orderId) params.orderId = options.orderId

    return this.makeRequest<GetNumberResponse>(params)
  }

  /**
   * Get status of activation and OTP code if available (v1 legacy)
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
    // "STATUS_WAIT_RETRY:pastCode" - waiting for code clarification

    if (response.startsWith("STATUS_OK:")) {
      return {
        status: "completed",
        code: response.split(":")[1],
      }
    }

    if (response === "STATUS_WAIT_CODE") {
      return { status: "waiting" }
    }

    if (response.startsWith("STATUS_WAIT_RETRY:")) {
      return {
        status: "retry",
        code: response.split(":")[1],
      }
    }

    if (response === "STATUS_CANCEL") {
      return { status: "cancelled" }
    }

    return { status: "unknown" }
  }

  /**
   * Get status of activation (v2 with extended information)
   */
  async getStatusV2(activationId: string): Promise<GetStatusResponse> {
    const response = await this.makeRequest<GetStatusResponse>({
      action: "getStatusV2",
      id: activationId,
    })

    return response
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
   * Ready to receive SMS
   */
  async setReady(activationId: string): Promise<string> {
    return this.setStatus(activationId, 1)
  }

  /**
   * Request another SMS (for free)
   */
  async requestAnotherSms(activationId: string): Promise<string> {
    return this.setStatus(activationId, 3)
  }

  /**
   * Complete activation
   */
  async finishActivation(activationId: string): Promise<string> {
    return this.setStatus(activationId, 6)
  }

  /**
   * Cancel activation
   */
  async cancelActivation(activationId: string): Promise<string> {
    return this.setStatus(activationId, 8)
  }

  /**
   * Get activation history
   */
  async getHistory(options?: {
    startDate?: string
    endDate?: string
    status?: string
    country?: string
    service?: string
  }): Promise<any> {
    const params: Record<string, string> = {
      action: "getHistory",
    }

    if (options?.startDate) params.startDate = options.startDate
    if (options?.endDate) params.endDate = options.endDate
    if (options?.status) params.status = options.status
    if (options?.country) params.country = options.country
    if (options?.service) params.service = options.service

    return this.makeRequest<any>(params)
  }

  /**
   * Get list of all countries
   */
  async getAllCountries(): Promise<any> {
    return this.makeRequest<any>({
      action: "getCountries",
    })
  }

  /**
   * Get list of all services
   */
  async getAllServices(): Promise<any> {
    return this.makeRequest<any>({
      action: "getServices",
    })
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

    try {
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

      // Try to parse as JSON first
      if (contentType?.includes("application/json")) {
        const jsonResponse = await response.json()

        // Check for API errors in JSON response
        if (typeof jsonResponse === "object" && jsonResponse.error) {
          throw new Error(`SMS-Activate API error: ${jsonResponse.error}`)
        }

        return jsonResponse
      }

      // Handle plain text responses
      const textResponse = await response.text()

      // Check for known error codes
      this.handleErrorResponse(textResponse)

      return textResponse as T
    } catch (error) {
      console.error("[SMS-Activate] API request failed:", error)
      throw error
    }
  }

  /**
   * Handle API error responses
   */
  private handleErrorResponse(response: string): void {
    const errorMap: Record<string, string> = {
      BAD_KEY: "Invalid API key",
      BAD_ACTION: "Incorrect action",
      BAD_SERVICE: "Incorrect service name",
      BAD_STATUS: "Incorrect status",
      NO_NUMBERS: "No numbers available",
      NO_BALANCE: "Insufficient balance",
      NO_ACTIVATION: "Activation ID does not exist",
      BANNED: "Account is banned",
      ERROR_SQL: "SQL server error",
      WRONG_EXCEPTION_PHONE: "Incorrect exclusion prefixes",
      CHANNELS_LIMIT: "Account blocked - channels limit",
      EARLY_CANCEL_DENIED: "Cannot cancel within first 2 minutes",
      WRONG_ACTIVATION_ID: "Invalid activation ID",
      WRONG_MAX_PRICE: "Maximum price is too low",
      ORDER_ALREADY_EXISTS: "Order has already been created",
    }

    for (const [errorCode, errorMessage] of Object.entries(errorMap)) {
      if (response.startsWith(errorCode)) {
        throw new Error(`SMS-Activate: ${errorMessage} (${response})`)
      }
    }
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

export type {
  GetNumberResponse,
  GetStatusResponse,
  GetPricesResponse,
  TopCountriesResponse,
  ActiveActivation,
  WebhookPayload,
}
