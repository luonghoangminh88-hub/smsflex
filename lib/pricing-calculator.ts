/**
 * Centralized pricing calculation with profit margin protection
 */

export interface PricingInput {
  basePrice: number
  costPrice: number
  rentalType: "standard" | "multi-service" | "long-term"
  additionalServicesCount?: number
  rentDurationHours?: number
}

export interface PricingResult {
  originalPrice: number
  discount: number
  discountPercentage: number
  finalPrice: number
  adminProfit: number
  adminProfitPercentage: number
  breakdown: {
    basePrice: number
    multiplier: number
    discountAmount: number
    finalPrice: number
  }
}

/**
 * Calculate final pricing with discount validation
 * Ensures admin always maintains minimum profit margin
 */
export function calculateRentalPricing(input: PricingInput): PricingResult {
  const { basePrice, costPrice, rentalType, additionalServicesCount = 0, rentDurationHours = 0 } = input

  let multiplier = 1
  let discountPercentage = 0

  // Calculate multiplier and discount based on rental type
  if (rentalType === "multi-service") {
    multiplier = 1 + additionalServicesCount

    // Tiered discount for multi-service
    if (additionalServicesCount >= 3) {
      discountPercentage = 0.25 // 25% off (was 47%)
    } else if (additionalServicesCount >= 2) {
      discountPercentage = 0.18 // 18% off (was 30%)
    } else if (additionalServicesCount >= 1) {
      discountPercentage = 0.1 // 10% off (was 15%)
    }
  } else if (rentalType === "long-term") {
    // Map rent duration to multiplier
    if (rentDurationHours === 168) {
      // 1 week
      multiplier = 24
      discountPercentage = 0.3 // 30% off to match UI
    } else if (rentDurationHours === 24) {
      // 1 day
      multiplier = 4
      discountPercentage = 0.2 // 20% off to match UI
    } else if (rentDurationHours === 4) {
      // 4 hours
      multiplier = 1
      discountPercentage = 0.05 // 5% off (basic discount)
    }
  }

  // Calculate prices
  const originalPrice = basePrice * multiplier
  const discountAmount = originalPrice * discountPercentage
  let finalPrice = Math.round(originalPrice - discountAmount)

  // Calculate admin profit
  const totalCost = costPrice * multiplier
  let adminProfit = finalPrice - totalCost
  let adminProfitPercentage = totalCost > 0 ? (adminProfit / totalCost) * 100 : 0

  const MINIMUM_PROFIT_MARGIN = 0.05 // 5%
  if (adminProfitPercentage < MINIMUM_PROFIT_MARGIN * 100) {
    // Recalculate final price to ensure minimum profit
    const minimumPrice = Math.ceil(totalCost * (1 + MINIMUM_PROFIT_MARGIN))

    console.log("[v0] Adjusting price to maintain minimum profit:", {
      originalFinalPrice: finalPrice,
      adjustedFinalPrice: minimumPrice,
      totalCost,
      oldProfit: adminProfitPercentage.toFixed(2) + "%",
      newProfit: "5.00%",
    })

    finalPrice = minimumPrice
    adminProfit = finalPrice - totalCost
    adminProfitPercentage = (adminProfit / totalCost) * 100

    // Recalculate discount based on adjusted price
    const actualDiscountAmount = originalPrice - finalPrice
    discountPercentage = (actualDiscountAmount / originalPrice) * 100
  }

  return {
    originalPrice,
    discount: Math.round(originalPrice - finalPrice),
    discountPercentage: discountPercentage * 100,
    finalPrice,
    adminProfit,
    adminProfitPercentage,
    breakdown: {
      basePrice,
      multiplier,
      discountAmount: originalPrice - finalPrice,
      finalPrice,
    },
  }
}

/**
 * Validate pricing request from frontend
 * Prevents price manipulation attacks
 */
export function validatePricingRequest(
  frontendPrice: number,
  dbBasePrice: number,
  dbCostPrice: number,
  rentalType: "standard" | "multi-service" | "long-term",
  additionalServicesCount?: number,
  rentDurationHours?: number,
): { valid: boolean; error?: string; calculatedPrice?: number } {
  try {
    const calculated = calculateRentalPricing({
      basePrice: dbBasePrice,
      costPrice: dbCostPrice,
      rentalType,
      additionalServicesCount,
      rentDurationHours,
    })

    // Allow 1đ tolerance for rounding differences
    const priceDifference = Math.abs(frontendPrice - calculated.finalPrice)
    if (priceDifference > 1) {
      return {
        valid: false,
        error: `Price mismatch: frontend sent ${frontendPrice}đ but calculated ${calculated.finalPrice}đ`,
        calculatedPrice: calculated.finalPrice,
      }
    }

    return {
      valid: true,
      calculatedPrice: calculated.finalPrice,
    }
  } catch (error: any) {
    return {
      valid: false,
      error: error.message,
    }
  }
}
