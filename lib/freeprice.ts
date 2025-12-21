/**
 * FreePrice Integration for SMS-Activate
 * Enables dynamic market-based pricing with 15% average savings
 */

import { getSmsActivateClient } from "./sms-activate"
import type { TopCountriesResponse } from "./sms-activate"

export interface FreePriceOption {
  price: number
  count: number
  savingsPercentage: number
  isRecommended: boolean
}

export interface FreePriceInfo {
  enabled: boolean
  options: FreePriceOption[]
  regularPrice: number
  minPrice: number
  maxPrice: number
  recommendedPrice: number
  totalStock: number
  maxSavings: number
}

/**
 * Get FreePrice information for a service
 */
export async function getFreePriceInfo(service: string, country?: string): Promise<FreePriceInfo | null> {
  try {
    const client = getSmsActivateClient()

    // Get top countries with FreePrice data
    const topCountries = await client.getTopCountriesByServiceRank(service, true)

    if (!topCountries || topCountries.length === 0) {
      return null
    }

    // Find matching country or use first available
    let countryData: TopCountriesResponse | undefined

    if (country) {
      countryData = topCountries.find((c) => c.country.toString() === country)
    }

    if (!countryData) {
      countryData = topCountries[0]
    }

    if (!countryData.freePriceMap || Object.keys(countryData.freePriceMap).length === 0) {
      // No FreePrice available
      return {
        enabled: false,
        options: [],
        regularPrice: countryData.retail_price,
        minPrice: countryData.price,
        maxPrice: countryData.retail_price,
        recommendedPrice: countryData.price,
        totalStock: countryData.count,
        maxSavings: 0,
      }
    }

    // Parse FreePrice options
    const options: FreePriceOption[] = Object.entries(countryData.freePriceMap)
      .map(([priceStr, count]) => {
        const price = Number.parseFloat(priceStr)
        const savingsPercentage = ((countryData!.retail_price - price) / countryData!.retail_price) * 100

        return {
          price,
          count: count as number,
          savingsPercentage: Math.round(savingsPercentage),
          isRecommended: false,
        }
      })
      .sort((a, b) => a.price - b.price) // Sort by price ascending

    // Mark recommended option (best value - lowest price with sufficient stock)
    const recommendedOption = options.find((opt) => opt.count >= 10) || options[0]
    if (recommendedOption) {
      recommendedOption.isRecommended = true
    }

    const minPrice = Math.min(...options.map((o) => o.price))
    const maxPrice = Math.max(...options.map((o) => o.price))
    const maxSavings = Math.max(...options.map((o) => o.savingsPercentage))
    const totalStock = options.reduce((sum, opt) => sum + opt.count, 0)

    return {
      enabled: true,
      options,
      regularPrice: countryData.retail_price,
      minPrice,
      maxPrice,
      recommendedPrice: recommendedOption?.price || minPrice,
      totalStock,
      maxSavings,
    }
  } catch (error) {
    console.error("[FreePrice] Error fetching FreePrice info:", error)
    return null
  }
}

/**
 * Calculate optimal FreePrice based on user preferences and stock
 */
export function calculateOptimalFreePrice(
  freePriceInfo: FreePriceInfo,
  preferences: {
    prioritizePrice?: boolean // true = cheapest, false = best availability
    maxPrice?: number
    minStock?: number
  } = {},
): FreePriceOption | null {
  if (!freePriceInfo.enabled || freePriceInfo.options.length === 0) {
    return null
  }

  let filteredOptions = freePriceInfo.options

  // Filter by max price
  if (preferences.maxPrice) {
    filteredOptions = filteredOptions.filter((opt) => opt.price <= preferences.maxPrice!)
  }

  // Filter by minimum stock
  if (preferences.minStock) {
    filteredOptions = filteredOptions.filter((opt) => opt.count >= preferences.minStock!)
  }

  if (filteredOptions.length === 0) {
    return null
  }

  // Sort by preference
  if (preferences.prioritizePrice) {
    // Cheapest first
    return filteredOptions.sort((a, b) => a.price - b.price)[0]
  } else {
    // Best availability first (highest stock at reasonable price)
    return filteredOptions.sort((a, b) => b.count - a.count)[0]
  }
}

/**
 * Format FreePrice savings for display
 */
export function formatFreePriceSavings(regularPrice: number, freePrice: number): string {
  const savings = regularPrice - freePrice
  const percentage = ((savings / regularPrice) * 100).toFixed(0)

  return `Tiết kiệm ${percentage}% (${savings.toFixed(2)}₫)`
}

/**
 * Get FreePrice badge color based on savings
 */
export function getFreePriceBadgeVariant(savingsPercentage: number): "default" | "secondary" | "destructive" {
  if (savingsPercentage >= 15) return "default" // Great deal
  if (savingsPercentage >= 10) return "secondary" // Good deal
  return "destructive" // Minimal savings
}
