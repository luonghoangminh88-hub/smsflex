"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"

interface AutoRefreshClientProps {
  rentalId: string
  hasOtp: boolean
}

export function AutoRefreshClient({ rentalId, hasOtp }: AutoRefreshClientProps) {
  const router = useRouter()

  useEffect(() => {
    // Only auto-refresh if OTP hasn't been received yet
    if (hasOtp) return

    const interval = setInterval(() => {
      router.refresh()
    }, 5000) // Refresh every 5 seconds

    return () => clearInterval(interval)
  }, [hasOtp, router])

  return null
}
