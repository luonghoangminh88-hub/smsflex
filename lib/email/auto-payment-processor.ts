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
      // Initialize IMAP client
      const imapClient = new ImapClient({
        user: process.env.BANK_EMAIL_USER || "hocluongvan88@gmail.com",
        password: process.env.BANK_EMAIL_PASSWORD || "acuiscrpwrvjztqr",
        host: process.env.BANK_EMAIL_HOST || "imap.gmail.com",
        port: Number.parseInt(process.env.BANK_EMAIL_PORT || "993"),
        tls: true,
      })

      // Fetch unseen emails from banks
      const bankEmails = BankEmailParser.getSupportedBankEmails()
      console.log("[v0] Supported bank emails:", bankEmails)

      const emails = await imapClient.fetchUnseenEmails(bankEmails)

      console.log(`[v0] Found ${emails.length} unseen emails`)

      // Process each email
      for (const email of emails) {
        result.totalProcessed++

        const emailText = email.text || email.html || ""
        console.log(`[v0] Processing email from: ${email.from}, subject: ${email.subject}`)

        const transaction = BankEmailParser.parse(email.from, emailText)

        if (!transaction) {
          result.errorCount++
          const errorMsg = `Failed to parse email from ${email.from} - subject: ${email.subject}`
          console.error(`[v0] ${errorMsg}`)
          result.errors.push(errorMsg)

          await this.supabase.from("bank_transactions").insert({
            transaction_id: `FAILED_${Date.now()}`,
            amount: 0,
            content: email.subject,
            sender_info: email.from,
            bank_name: "Unknown",
            email_subject: email.subject,
            email_from: email.from,
            email_date: email.date,
            status: "parse_failed",
            error_message: "Failed to parse email content",
          })

          continue
        }

        console.log("[v0] Successfully parsed transaction:", transaction)

        // Check if transaction already exists
        const { data: existing } = await this.supabase
          .from("bank_transactions")
          .select("id")
          .eq("transaction_id", transaction.transactionId)
          .single()

        if (existing) {
          console.log(`[v0] Transaction ${transaction.transactionId} already processed`)
          continue
        }

        // Save to bank_transactions table
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

        // Try to process automatically if user_id found
        if (transaction.userId) {
          const processed = await this.processTransaction(bankTx.id, transaction.userId, transaction.amount)

          if (processed.success) {
            result.successCount++
          } else if (processed.needsReview) {
            result.manualReviewCount++
          } else {
            result.errorCount++
            result.errors.push(processed.error || "Unknown error")
          }
        } else {
          // No user ID found - needs manual review
          await this.supabase.from("bank_transactions").update({ status: "manual_review" }).eq("id", bankTx.id)

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

  private async processTransaction(
    bankTxId: string,
    userId: string,
    amount: number,
  ): Promise<{ success: boolean; needsReview: boolean; error?: string }> {
    try {
      // Find user by ID in content (assuming it's stored somewhere identifiable)
      // For now, we'll search in profiles
      const { data: user } = await this.supabase.from("profiles").select("id, balance").eq("id", userId).single()

      if (!user) {
        // User not found - needs manual review
        await this.supabase
          .from("bank_transactions")
          .update({
            status: "manual_review",
            error_message: "User not found",
          })
          .eq("id", bankTxId)

        return { success: false, needsReview: true }
      }

      // Create deposit record
      const { data: deposit, error: depositError } = await this.supabase
        .from("deposits")
        .insert({
          user_id: user.id,
          amount: amount,
          total_amount: amount,
          fee: 0,
          status: "completed",
          payment_data: { auto_processed: true },
        })
        .select()
        .single()

      if (depositError) {
        await this.supabase
          .from("bank_transactions")
          .update({
            status: "error",
            error_message: depositError.message,
          })
          .eq("id", bankTxId)

        return { success: false, needsReview: false, error: depositError.message }
      }

      // Update user balance using atomic function
      const { error: balanceError } = await this.supabase.rpc("atomic_balance_update", {
        p_user_id: user.id,
        p_amount: amount,
        p_transaction_type: "deposit",
        p_description: "Nạp tiền tự động qua email",
        p_rental_id: null,
      })

      if (balanceError) {
        // Rollback deposit
        await this.supabase.from("deposits").update({ status: "failed" }).eq("id", deposit.id)

        await this.supabase
          .from("bank_transactions")
          .update({
            status: "error",
            error_message: balanceError.message,
          })
          .eq("id", bankTxId)

        return { success: false, needsReview: false, error: balanceError.message }
      }

      // Update bank transaction as success
      await this.supabase
        .from("bank_transactions")
        .update({
          status: "success",
          user_id: user.id,
          deposit_id: deposit.id,
          processed_at: new Date().toISOString(),
        })
        .eq("id", bankTxId)

      // Send notification to user
      await this.supabase.from("notifications").insert({
        user_id: user.id,
        type: "deposit",
        title: "Nạp tiền thành công",
        message: `Tài khoản của bạn đã được cộng ${amount.toLocaleString("vi-VN")}đ`,
        metadata: { deposit_id: deposit.id, amount },
      })

      return { success: true, needsReview: false }
    } catch (error) {
      console.error("[v0] Error processing transaction:", error)
      return {
        success: false,
        needsReview: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
