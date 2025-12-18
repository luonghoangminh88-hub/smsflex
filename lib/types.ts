export type UserRole = "user" | "admin"

export interface Profile {
  id: string
  full_name: string | null
  phone_number: string | null
  email: string
  balance: number
  role: UserRole
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Service {
  id: string
  name: string
  code: string
  icon_url: string | null
  is_active: boolean
  is_experimental?: boolean
  created_at: string
}

export interface Country {
  id: string
  name: string
  code: string
  flag_url: string | null
  is_active: boolean
  created_at: string
}

export interface ServicePrice {
  id: string
  service_id: string
  country_id: string
  price: number
  stock_count: number
  is_available: boolean
  created_at: string
  updated_at: string
  service?: Service
  country?: Country
}

export type RentalStatus = "waiting" | "active" | "completed" | "cancelled" | "expired"
export type Provider = "sms-activate" | "5sim"

export interface PhoneRental {
  id: string
  user_id: string
  service_id: string
  country_id: string
  phone_number: string
  activation_id: string | null
  price: number
  status: RentalStatus
  otp_code: string | null
  provider?: Provider
  expires_at: string | null
  created_at: string
  updated_at: string
  service?: Service
  country?: Country
}

export type TransactionType = "deposit" | "withdrawal" | "rental_purchase" | "refund"
export type TransactionStatus = "pending" | "completed" | "failed"

export interface Transaction {
  id: string
  user_id: string
  type: TransactionType
  amount: number
  balance_before: number
  balance_after: number
  description: string | null
  rental_id: string | null
  status: TransactionStatus
  created_at: string
}
