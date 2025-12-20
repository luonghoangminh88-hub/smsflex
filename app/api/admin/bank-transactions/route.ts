import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { AutoPaymentProcessor } from "@/lib/email/auto-payment-processor"

export async function POST(request: Request) {
  try {
    const { transactionId } = await request.json()

    if (!transactionId) {
      return NextResponse.json({ error: "Transaction ID required" }, { status: 400 })
    }

    const supabase = createAdminClient()

    // Get the transaction
    const { data: transaction, error: txError } = await supabase
      .from("bank_transactions")
      .select("*")
      .eq("id", transactionId)
      .single()

    if (txError || !transaction) {
      return NextResponse.json({ error: "Transaction not found" }, { status: 404 })
    }

    // Initialize processor
    const processor = new AutoPaymentProcessor()

    // Try to handle as orphan transaction
    const result = await processor.handleOrphanTransaction(transaction.id, transaction.amount, transaction.content)

    if (result.success) {
      return NextResponse.json({ success: true, message: "Transaction processed successfully" })
    } else {
      return NextResponse.json({ success: false, error: result.error }, { status: 400 })
    }
  } catch (error) {
    console.error("[v0] Error retrying transaction:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to retry transaction" },
      { status: 500 },
    )
  }
}
