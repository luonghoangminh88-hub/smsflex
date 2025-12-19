import { createClient } from "@supabase/supabase-js"
import { ImapClient } from "./imap-client"
import { BankEmailParser } from "./bank-parser"

export interface ProcessingResult {
  totalProcessed: number
  successCount: number
  errorCount: number
  manualReviewCount: number
  errors: string[]
}

export class AutoPaymentProcessor {
  private supabase

  constructor() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      throw new Error(
        "Missing Supabase credentials. Please check NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env",
      )
    }

    this.supabase = createClient(supabaseUrl, supabaseKey)
  }

  async processEmails(): Promise<ProcessingResult> {
    console.log("[v0] Starting auto-payment email processing...")

    const result: ProcessingResult = {
      totalProcessed: 0,
      successCount: 0,
      errorCount: 0,
      manualReviewCount: 0,
      errors: [],
    }

    try {
      const emailUser = process.env.EMAIL_USER
      const emailPassword = process.env.EMAIL_PASSWORD
      const emailHost = process.env.EMAIL_HOST || "imap.gmail.com"
      const emailPort = Number.parseInt(process.env.EMAIL_PORT || "993")

      if (!emailUser || !emailPassword) {
        const errorMsg =
          "Email credentials not configured. Please set EMAIL_USER and EMAIL_PASSWORD in environment variables."
        console.error(`[v0] ${errorMsg}`)
        result.errors.push(errorMsg)
        return result
      }

      console.log(`[v0] Connecting to ${emailHost}:${emailPort} as ${emailUser}`)

      // Initialize IMAP client
      const imapClient = new ImapClient({
        user: emailUser,
        password: emailPassword,
        host: emailHost,
        port: emailPort,
        tls: true,
        authTimeout: 15000, // 15 seconds
        connTimeout: 15000,
      })

      const { data: activePaymentMethods } = await this.supabase
        .from("payment_methods")
        .select("bank_code")
        .eq("is_active", true)
        .not("bank_code", "is", null)

      // Map bank codes to email addresses
      const bankCodeToEmail: Record<string, string> = {
        VCB: "VCBDigibank@info.vietcombank.com.vn",
        MB: "mbebanking@mbbank.com.vn",
        ACB: "acb-notification@acb.com.vn",
        VCCB: "support@timo.vn", // Timo
        TPB: "ebanking@tpb.com.vn",
      }

      const bankEmails: string[] = []
      if (activePaymentMethods) {
        for (const pm of activePaymentMethods) {
          if (pm.bank_code && bankCodeToEmail[pm.bank_code]) {
            bankEmails.push(bankCodeToEmail[pm.bank_code])
          }
        }
      }

      // Fallback to all supported banks if none configured
      if (bankEmails.length === 0) {
        bankEmails.push(...Object.values(bankCodeToEmail))
      }

      console.log("[v0] Monitoring bank emails:", bankEmails)

      let emails: any[] = []
      try {
        emails = await imapClient.fetchUnseenEmails(bankEmails)
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : "Unknown IMAP error"
        console.error(`[v0] Failed to fetch emails: ${errorMsg}`)
        result.errors.push(`Email fetch failed: ${errorMsg}`)

        // Return early but with detailed error info
        return result
      }

      console.log(`[v0] Found ${emails.length} unseen emails`)

      // Process each email
      for (const email of emails) {
        result.totalProcessed++

        const emailText = email.text || email.html || ""
        console.log(`[v0] Processing email from: ${email.from}, subject: ${email.subject}`)
        console.log(`[v0] Email text length: ${emailText.length} characters`)
        console.log(`[v0] Email preview (first 500 chars):`, emailText.substring(0, 500))

        const transaction = BankEmailParser.parse(email.from, emailText)

        if (!transaction) {
          result.errorCount++
          const errorMsg = `Failed to parse email from "${email.from}"`
          console.error(`[v0] ${errorMsg}`)
          console.error(`[v0] Email subject: ${email.subject}`)
          console.error(`[v0] Email text preview:`, emailText.substring(0, 1000))
          result.errors.push(errorMsg)

          await this.supabase.from("bank_transactions").insert({
            transaction_id: `FAILED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            amount: 0,
            content: email.subject || "No subject",
            sender_info: email.from,
            bank_name: "Unknown",
            email_subject: email.subject,
            email_from: email.from,
            email_date: email.date,
            email_body: emailText.substring(0, 5000), // Store first 5000 chars for analysis
            status: "parse_failed",
            error_message: "Failed to parse email content - check email_body for raw content",
          })

          continue
        }

        console.log("[v0] Parsed transaction:", transaction)

        const { data: existing } = await this.supabase
          .from("bank_transactions")
          .select("id")
          .eq("transaction_id", transaction.transactionId)
          .single()

        if (existing) {
          console.log(`[v0] Transaction ${transaction.transactionId} already processed`)
          continue
        }

        const { data: bankTx, error: insertError } = await this.supabase
          .from("bank_transactions")
          .insert({
            transaction_id: transaction.transactionId,
            amount: transaction.amount,
            content: transaction.content,
            sender_info: transaction.senderInfo,
            bank_name: transaction.bankName,
            email_subject: email.subject,
            email_from: email.from,
            email_date: email.date,
            status: "pending",
          })
          .select()
          .single()

        if (insertError) {
          result.errorCount++
          result.errors.push(`Failed to save transaction: ${insertError.message}`)
          continue
        }

        const { data: deposit } = await this.supabase
          .from("deposits")
          .select("*, profiles!inner(*)")
          .eq("status", "pending")
          .eq("payment_code", transaction.content)
          .single()

        if (deposit) {
          // Verify amount matches
          if (Math.abs(deposit.amount - transaction.amount) < 100) {
            // Allow 100 VND tolerance
            const processed = await this.completeDeposit(bankTx.id, deposit.id, deposit.user_id)

            if (processed.success) {
              result.successCount++
              console.log(`[v0] Successfully processed deposit ${deposit.id}`)
            } else {
              result.errorCount++
              result.errors.push(processed.error || "Failed to complete deposit")
            }
          } else {
            // Amount mismatch - manual review
            await this.supabase
              .from("bank_transactions")
              .update({
                status: "manual_review",
                error_message: `Amount mismatch: expected ${deposit.amount}, got ${transaction.amount}`,
              })
              .eq("id", bankTx.id)

            result.manualReviewCount++
          }
        } else {
          // No matching deposit found - manual review
          await this.supabase
            .from("bank_transactions")
            .update({
              status: "manual_review",
              error_message: "No matching deposit found",
            })
            .eq("id", bankTx.id)

          result.manualReviewCount++
        }
      }

      console.log("[v0] Processing complete:", result)
      return result
    } catch (error) {
      console.error("[v0] Error in auto-payment processor:", error)
      result.errors.push(error instanceof Error ? error.message : "Unknown error")
      return result
    }
  }

  private async completeDeposit(
    bankTxId: string,
    depositId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { data: deposit } = await this.supabase.from("deposits").select("amount").eq("id", depositId).single()

      if (!deposit) {
        return { success: false, error: "Deposit not found" }
      }

      const { error: balanceError } = await this.supabase.rpc("atomic_balance_update", {
        p_user_id: userId,
        p_amount: deposit.amount,
        p_transaction_type: "deposit",
        p_description: "Nạp tiền tự động qua chuyển khoản",
        p_rental_id: null,
      })

      if (balanceError) {
        console.error("[v0] Balance update error:", balanceError)
        return { success: false, error: balanceError.message }
      }

      const { error: depositError } = await this.supabase
        .from("deposits")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", depositId)

      if (depositError) {
        console.error("[v0] Deposit update error:", depositError)
        return { success: false, error: depositError.message }
      }

      await this.supabase
        .from("bank_transactions")
        .update({
          status: "success",
          user_id: userId,
          deposit_id: depositId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", bankTxId)

      await this.supabase.from("notifications").insert({
        user_id: userId,
        type: "deposit_approved",
        title: "Nạp tiền thành công",
        message: `Tài khoản của bạn đã được cộng ${deposit.amount.toLocaleString("vi-VN")}đ`,
        metadata: { deposit_id: depositId, amount: deposit.amount },
        is_read: false,
      })

      console.log(`[v0] Successfully completed deposit ${depositId} for user ${userId}`)
      return { success: true }
    } catch (error) {
      console.error("[v0] Error completing deposit:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
