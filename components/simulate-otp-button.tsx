"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

interface SimulateOTPButtonProps {
  rentalId: string
}

export function SimulateOTPButton({ rentalId }: SimulateOTPButtonProps) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleSimulate = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/rentals/simulate-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rentalId }),
      })

      if (!response.ok) throw new Error("Failed to simulate OTP")

      router.refresh()
    } catch (error) {
      console.error("[v0] Error:", error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Button onClick={handleSimulate} disabled={isLoading} variant="outline" size="sm" className="bg-transparent">
      {isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Đang tạo...
        </>
      ) : (
        "Demo: Nhận OTP ngay"
      )}
    </Button>
  )
}
