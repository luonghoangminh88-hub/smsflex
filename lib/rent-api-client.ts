/**
 * Long-term Rental Client
 * Handles SMS-Activate Rent API for extended number rentals
 */

import { createClient } from "@supabase/supabase-js"
import { getSmsActivateV2Client } from "./sms-activate-v2"
import { logCostOptimization } from "./analytics-service"

interface LongTermRental {
  id: string
  userId: string
  serviceId: string
  countryId: string
  phoneNumber: string
  rentId: string
  provider: string
  rentTimeHours: number
  price: number
  status: string
  messages: Array<{ text: string; timestamp: string }>
  startTime: string
  endTime: string
}

export class RentApiClient {
  private supabase

  constructor() {
    this.supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
  }

  /**
   * Rent a number for extended period (4-168 hours)
   * More cost-effective for long-term usage
   */
  async rentLongTerm(
    userId: string,
    serviceId: string,
    countryId: string,
    service: string,
    country: string,
    rentTimeHours = 4,
  ): Promise<LongTermRental> {
    if (rentTimeHours < 4 || rentTimeHours > 168) {
      throw new Error("Rent time must be between 4 and 168 hours")
    }

    const v2Client = getSmsActivateV2Client()

    try {
      const rental = await v2Client.getRentNumber(service, country, rentTimeHours)

      const startTime = new Date()
      const endTime = new Date(rental.endDate)

      // Store in database
      const { data, error } = await this.supabase
        .from("long_term_rentals")
        .insert({
          user_id: userId,
          service_id: serviceId,
          country_id: countryId,
          phone_number: rental.phoneNumber,
          rent_id: rental.rentId,
          provider: "sms-activate",
          rent_time_hours: rentTimeHours,
          price: rental.cost,
          status: "active",
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        })
        .select()
        .single()

      if (error) throw error

      // Log cost optimization
      await logCostOptimization({
        orderId: data.id,
        orderType: "long_term",
        providerSelected: "sms-activate",
        providerCost: rental.cost,
        selectionReason: `Long-term rental for ${rentTimeHours} hours`,
      })

      return {
        id: data.id,
        userId: data.user_id,
        serviceId: data.service_id,
        countryId: data.country_id,
        phoneNumber: data.phone_number,
        rentId: data.rent_id,
        provider: data.provider,
        rentTimeHours: data.rent_time_hours,
        price: data.price,
        status: data.status,
        messages: data.messages || [],
        startTime: data.start_time,
        endTime: data.end_time,
      }
    } catch (error) {
      console.error("[Rent API] Error renting long-term number:", error)
      throw error
    }
  }

  /**
   * Check for new messages in long-term rental
   */
  async checkRentMessages(rentalId: string): Promise<Array<{ text: string; timestamp: string }>> {
    const { data: rental, error } = await this.supabase
      .from("long_term_rentals")
      .select("*")
      .eq("id", rentalId)
      .single()

    if (error || !rental) {
      throw new Error("Rental not found")
    }

    const v2Client = getSmsActivateV2Client()

    try {
      const status = await v2Client.getRentStatus(rental.rent_id)
      const newMessages = status.messages.filter(
        (msg) => !rental.messages.some((existing: any) => existing.timestamp === msg.timestamp),
      )

      if (newMessages.length > 0) {
        const allMessages = [...(rental.messages || []), ...newMessages]
        await this.supabase.from("long_term_rentals").update({ messages: allMessages }).eq("id", rentalId)

        return newMessages
      }

      return []
    } catch (error) {
      console.error("[Rent API] Error checking messages:", error)
      return []
    }
  }

  /**
   * Extend rental period (if supported)
   */
  async extendRental(rentalId: string, additionalHours: number): Promise<void> {
    const { data: rental, error } = await this.supabase
      .from("long_term_rentals")
      .select("*")
      .eq("id", rentalId)
      .single()

    if (error || !rental) {
      throw new Error("Rental not found")
    }

    // Calculate new end time
    const currentEndTime = new Date(rental.end_time)
    currentEndTime.setHours(currentEndTime.getHours() + additionalHours)

    await this.supabase
      .from("long_term_rentals")
      .update({
        rent_time_hours: rental.rent_time_hours + additionalHours,
        end_time: currentEndTime.toISOString(),
      })
      .eq("id", rentalId)
  }

  /**
   * Cancel long-term rental
   */
  async cancelRental(rentalId: string): Promise<void> {
    await this.supabase.from("long_term_rentals").update({ status: "cancelled" }).eq("id", rentalId)
  }

  /**
   * Get user's long-term rentals
   */
  async getUserRentals(userId: string): Promise<LongTermRental[]> {
    const { data, error } = await this.supabase
      .from("long_term_rentals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })

    if (error) throw error

    return (
      data?.map((d) => ({
        id: d.id,
        userId: d.user_id,
        serviceId: d.service_id,
        countryId: d.country_id,
        phoneNumber: d.phone_number,
        rentId: d.rent_id,
        provider: d.provider,
        rentTimeHours: d.rent_time_hours,
        price: d.price,
        status: d.status,
        messages: d.messages || [],
        startTime: d.start_time,
        endTime: d.end_time,
      })) || []
    )
  }
}

// Singleton
let rentApiClientInstance: RentApiClient | null = null

export function getRentApiClient(): RentApiClient {
  if (!rentApiClientInstance) {
    rentApiClientInstance = new RentApiClient()
  }
  return rentApiClientInstance
}
