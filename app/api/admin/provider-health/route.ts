import { NextResponse } from "next/server"
import { checkAdminAuth } from "@/lib/auth/admin-check"
import { getCircuitBreaker } from "@/lib/circuit-breaker"

export async function GET(request: Request) {
  const authCheck = await checkAdminAuth()
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const circuitBreaker = getCircuitBreaker()
    const health = await circuitBreaker.getAllProviderHealth()

    return NextResponse.json({ health })
  } catch (error: any) {
    console.error("[Provider Health] Error fetching health:", error)
    return NextResponse.json({ error: "Failed to fetch provider health" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  const authCheck = await checkAdminAuth()
  if (!authCheck.authorized) {
    return NextResponse.json({ error: authCheck.error }, { status: authCheck.status })
  }

  try {
    const body = await request.json()
    const { provider, action } = body

    if (!provider || !["sms-activate", "5sim"].includes(provider)) {
      return NextResponse.json({ error: "Invalid provider" }, { status: 400 })
    }

    const circuitBreaker = getCircuitBreaker()

    if (action === "reset") {
      await circuitBreaker.resetCircuit(provider)
      return NextResponse.json({ success: true, message: `Circuit reset for ${provider}` })
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 })
  } catch (error: any) {
    console.error("[Provider Health] Error updating health:", error)
    return NextResponse.json({ error: "Failed to update provider health" }, { status: 500 })
  }
}
