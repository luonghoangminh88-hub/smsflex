/**
 * 5sim.net API Client
 * Documentation: https://5sim.net/docs
 */

import { getFiveSimCountryCode } from "./country-mapping"

interface FiveSimConfig {
  apiKey: string
  baseUrl?: string
}

interface FiveSimCountry {
  name: string
  iso: string
  prefix: string
}

interface FiveSimOperator {
  name: string
  operator: string
}

interface FiveSimProduct {
  [country: string]: {
    [operator: string]: {
      [service: string]: {
        cost: number
        count: number
      }
    }
  }
}

interface FiveSimPurchaseResponse {
  id: number
  phone: string
  operator: string
  product: string
  price: number
  status: string
  expires: string
  sms: any[]
  created_at: string
  country: string
}

interface FiveSimOrderResponse {
  id: number
  phone: string
  operator: string
  product: string
  price: number
  status: string
  expires: string
  sms: Array<{
    date: string
    sender: string
    text: string
    code: string
  }>
  created_at: string
}

class FiveSimClient {
  private apiKey: string
  private baseUrl: string

  constructor(config: FiveSimConfig) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || "https://5sim.net/v1"
  }

  /**
   * Get account balance
   */
  async getBalance(): Promise<number> {
    const response = await this.makeRequest<{ balance: number }>("/user/profile")
    return response.balance
  }

  /**
   * Get list of countries
   */
  async getCountries(): Promise<FiveSimCountry[]> {
    const response = await this.makeRequest<FiveSimCountry[]>("/guest/countries")
    return response
  }

  /**
   * Get available products (services) and prices
   */
  async getPrices(country?: string, product?: string): Promise<FiveSimProduct> {
    let endpoint = "/guest/prices"
    const params: string[] = []

    if (country) {
      const fiveSimCountry = getFiveSimCountryCode(country)
      if (!fiveSimCountry) {
        console.warn(`[v0] No 5sim country mapping for: ${country}`)
        throw new Error(`No 5sim country mapping for: ${country}`)
      }
      params.push(`country=${fiveSimCountry}`)
    }
    if (product) {
      params.push(`product=${product}`)
    }

    if (params.length > 0) {
      endpoint += `?${params.join("&")}`
    }

    console.log(`[v0] 5sim getPrices endpoint:`, endpoint)
    const response = await this.makeRequest<FiveSimProduct>(endpoint)
    return response
  }

  /**
   * Purchase a phone number
   */
  async purchaseNumber(country: string, operator: string, product: string): Promise<FiveSimPurchaseResponse> {
    const fiveSimCountry = getFiveSimCountryCode(country)
    if (!fiveSimCountry) {
      throw new Error(`No 5sim country mapping for: ${country}`)
    }

    const response = await this.makeRequest<FiveSimPurchaseResponse>(
      `/user/buy/activation/${fiveSimCountry}/${operator}/${product}`,
      "GET",
    )
    return response
  }

  /**
   * Get order details and check for SMS
   */
  async getOrder(orderId: number): Promise<FiveSimOrderResponse> {
    const response = await this.makeRequest<FiveSimOrderResponse>(`/user/check/${orderId}`)
    return response
  }

  /**
   * Finish order (mark as complete)
   */
  async finishOrder(orderId: number): Promise<FiveSimOrderResponse> {
    const response = await this.makeRequest<FiveSimOrderResponse>(`/user/finish/${orderId}`, "GET")
    return response
  }

  /**
   * Cancel order (refund)
   */
  async cancelOrder(orderId: number): Promise<FiveSimOrderResponse> {
    const response = await this.makeRequest<FiveSimOrderResponse>(`/user/cancel/${orderId}`, "GET")
    return response
  }

  /**
   * Ban order (report and refund)
   */
  async banOrder(orderId: number): Promise<FiveSimOrderResponse> {
    const response = await this.makeRequest<FiveSimOrderResponse>(`/user/ban/${orderId}`, "GET")
    return response
  }

  /**
   * Request SMS resend
   */
  async resendSMS(orderId: number): Promise<FiveSimOrderResponse> {
    const response = await this.makeRequest<FiveSimOrderResponse>(`/user/reuse/${orderId}`, "GET")
    return response
  }

  /**
   * Make HTTP request to 5sim API
   */
  private async makeRequest<T>(endpoint: string, method: "GET" | "POST" = "GET"): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`

    const response = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        Accept: "application/json",
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`5sim API error: ${response.status} - ${errorText}`)
    }

    return response.json()
  }
}

// Export singleton instance
let fiveSimClient: FiveSimClient | null = null

export function getFiveSimClient(): FiveSimClient {
  if (!fiveSimClient) {
    const apiKey = process.env.FIVESIM_API_KEY

    if (!apiKey) {
      throw new Error("FIVESIM_API_KEY environment variable is not set")
    }

    fiveSimClient = new FiveSimClient({ apiKey })
  }

  return fiveSimClient
}

export type { FiveSimPurchaseResponse, FiveSimOrderResponse, FiveSimProduct, FiveSimCountry, FiveSimOperator }
