import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { generatePaymentCode, generateTransferContent, calculateFee, generateVietQRUrl } from "@/lib/payment"
import { depositSchema, validateAndSanitize } from "@/lib/security/api-validation"

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const validation = validateAndSanitize(depositSchema, body)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { payment_method_id, amount } = validation.data

    const cookieStore = await cookies()
    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get: (name: string) => cookieStore.get(name)?.value,
        set: () => {},
        remove: () => {},
      },
    })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get payment method details
    const { data: paymentMethod, error: pmError } = await supabase
      .from("payment_methods")
      .select("*")
      .eq("id", payment_method_id)
      .eq("is_active", true)
      .single()

    if (pmError || !paymentMethod) {
      return NextResponse.json({ error: "Payment method not found or inactive" }, { status: 404 })
    }

    // Validate amount
    if (amount < paymentMethod.min_amount) {
      return NextResponse.json({ error: `Minimum amount is ${paymentMethod.min_amount}` }, { status: 400 })
    }

    if (paymentMethod.max_amount && amount > paymentMethod.max_amount) {
      return NextResponse.json({ error: `Maximum amount is ${paymentMethod.max_amount}` }, { status: 400 })
    }

    // Calculate fee
    const fee = calculateFee(amount, paymentMethod)
    const totalAmount = amount + fee

    // Generate payment code and transfer content
    const paymentCode = generatePaymentCode(user.id)
    const transferContent = generateTransferContent(paymentCode, amount)

    // Generate payment data based on method type
    let paymentData: any = {}

    if (paymentMethod.provider === "vietqr" && paymentMethod.bank_code && paymentMethod.account_number) {
      const qrUrl = generateVietQRUrl(
        paymentMethod.bank_code,
        paymentMethod.account_number,
        paymentMethod.account_name || "OTP RENTAL",
        amount,
        paymentCode,
      )
      paymentData = {
        qr_url: qrUrl,
        bank_code: paymentMethod.bank_code,
        account_number: paymentMethod.account_number,
        account_name: paymentMethod.account_name,
      }
    }

    // Create deposit record
    const { data: deposit, error: depositError } = await supabase
      .from("deposits")
      .insert({
        user_id: user.id,
        payment_method_id,
        amount,
        fee,
        total_amount: totalAmount,
        status: "pending",
        payment_code: paymentCode,
        transfer_content: transferContent,
        payment_data: paymentData,
      })
      .select()
      .single()

    if (depositError) {
      console.error("[v0] Error creating deposit:", depositError)
      return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 })
    }

    return NextResponse.json({ success: true, deposit })
  } catch (error) {
    console.error("[v0] Error in deposit creation:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
