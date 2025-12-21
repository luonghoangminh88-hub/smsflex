/**
 * Multi-Service Number Client
 * Allows using one phone number for multiple services
 */

import { createClient } from "@supabase/supabase-js"
import { getSmsActivateV2Client } from "./sms-activate-v2"

interface MultiServiceRental {
  id: string
  userId: string
  countryId: string
  phoneNumber: string
  activationId: string
  provider: string
  services: string[]
  totalPrice: number
  status: string
  messages: Array<{ service: string; text: string; timestamp: string }>
  expiresAt: string
}

export class MultiServiceClient {
  private supabase

  constructor() {
    this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  /**
   * Rent a number that can receive SMS for multiple services
   * This is more cost-effective than renting multiple numbers
   */
  async rentMultiServiceNumber(
    userId: string,
    countryId: string,
    country: string,
    services: string[],
  ): Promise<MultiServiceRental> {
    if (services.length === 0) {
      throw new Error("At least one service is required")
    }

    // Use the first service to get the number
    const primaryService = services[0]
    const v2Client = getSmsActivateV2Client()

    try {
      // Get number with detailed info
      const activation = await v2Client.getNumberV2(country, primaryService)

      // Calculate total price (multi-service is typically cheaper per service)
      const basePrice = activation.activationCost
      const additionalServiceCost = basePrice * 0.3 // 30% of base price per additional service
      const totalPrice = basePrice + additionalServiceCost * (services.length - 1)

      // Store in database
      const expiresAt = new Date()
      expiresAt.setMinutes(expiresAt.getMinutes() + 20) // 20 minutes expiry

      const { data, error } = await this.supabase
        .from("multi_service_rentals")
        .insert({
          user_id: userId,
          country_id: countryId,
          phone_number: activation.phoneNumber,
          activation_id: activation.activationId,
          provider: "sms-activate",
          services: services,
          total_price: totalPrice,
          status: "active",
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      return {
        id: data.id,
        userId: data.user_id,
        countryId: data.country_id,
        phoneNumber: data.phone_number,
        activationId: data.activation_id,
        provider: data.provider,
        services: data.services,
        totalPrice: data.total_price,
        status: data.status,
        messages: data.messages || [],
        expiresAt: data.expires_at,
      }
    } catch (error) {
      console.error("[Multi-Service] Error renting number:", error)
      throw error
    }
  }

  /**
   * Check for new messages across all services
   */
  async checkMessages(rentalId: string): Promise<Array<{ service: string; text: string; timestamp: string }>> {
    const { data: rental, error } = await this.supabase
      .from("multi_service_rentals")
      .select("*")
      .eq("id", rentalId)
      .single()

    if (error || !rental) {
      throw new Error("Rental not found")
    }

    const v2Client = getSmsActivateV2Client()
    const newMessages: Array<{ service: string; text: string; timestamp: string }> = []

    // Check for additional SMS
    try {
      const response = await v2Client.requestAdditionalSms(rental.activation_id)
      if (response.code) {
        newMessages.push({
          service: "unknown", // We'd need to parse which service this is for
          text: response.code,
          timestamp: new Date().toISOString(),
        })
      }
    } catch (error) {
      console.error("[Multi-Service] Error checking messages:", error)
    }

    // Update messages in database
    if (newMessages.length > 0) {
      const allMessages = [...(rental.messages || []), ...newMessages]
      await this.supabase.from("multi_service_rentals").update({ messages: allMessages }).eq("id", rentalId)
    }

    return newMessages
  }

  /**
   * Cancel multi-service rental
   */
  async cancelRental(rentalId: string): Promise<void> {
    await this.supabase.from("multi_service_rentals").update({ status: "cancelled" }).eq("id", rentalId)
  }

  /**
   * Get user's multi-service rentals
   */
  async getUserRentals(userId: string): Promise<MultiServiceRental[]> {
    const { data, error } = await this.supabase
      .from("multi_service_rentals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return (
      data?.map((d) => ({
        id: d.id,
        userId: d.user_id,
        countryId: d.country_id,
        phoneNumber: d.phone_number,
        activationId: d.activation_id,
        provider: d.provider,
        services: d.services,
        totalPrice: d.total_price,
        status: d.status,
        messages: d.messages || [],
        expiresAt: d.expires_at,
      })) || []
    )
  }
}

// Singleton
let multiServiceClientInstance: MultiServiceClient | null = null

export function getMultiServiceClient(): MultiServiceClient {
  if (!multiServiceClientInstance) {
    multiServiceClientInstance = new MultiServiceClient()
  }
  return multiServiceClientInstance
}
