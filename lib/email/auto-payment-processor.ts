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

    if (!supabaseUrl) {
      throw new Error(
        "Missing SUPABASE_URL. Please check NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL in environment variables",
      )
    }

    if (!supabaseKey) {
      throw new Error(
        "Missing SUPABASE_SERVICE_ROLE_KEY in environment variables. This is required for auto-payment processing.",
      )
    }

    try {
      this.supabase = createClient(supabaseUrl, supabaseKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            apikey: supabaseKey,
          },
        },
      })
      console.log("[v0] AutoPaymentProcessor initialized with Supabase client")
      console.log("[v0] Supabase URL:", supabaseUrl)
    } catch (error) {
      console.error("[v0] Failed to create Supabase client:", error)
      throw new Error(`Failed to initialize Supabase: ${error instanceof Error ? error.message : "Unknown error"}`)
    }
  }

  private toVietnamTime(date: Date | string): string {
    const d = typeof date === "string" ? new Date(date) : date

    // Vietnam is UTC+7
    // We want to interpret the input date as Vietnam time and store it correctly
    const vietnamOffset = 7 * 60 * 60 * 1000 // 7 hours in milliseconds

    // If the date is already in UTC, add 7 hours to get Vietnam time
    const vietnamTime = new Date(d.getTime() + vietnamOffset)

    console.log("[v0] Original date (UTC):", d.toISOString())
    console.log("[v0] Vietnam time (UTC+7):", vietnamTime.toISOString())
    console.log("[v0] Vietnam local format:", vietnamTime.toLocaleString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" }))

    // Return ISO string which will be stored correctly in Supabase
    return vietnamTime.toISOString()
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
        result.errorCount++
        return result
      }

      console.log(`[v0] Connecting to ${emailHost}:${emailPort} as ${emailUser}`)

      // Initialize IMAP client
      let imapClient
      try {
        imapClient = new ImapClient({
          user: emailUser,
          password: emailPassword,
          host: emailHost,
          port: emailPort,
          tls: true,
          authTimeout: 15000,
          connTimeout: 15000,
        })
      } catch (error) {
        const errorMsg = `Failed to initialize IMAP client: ${error instanceof Error ? error.message : "Unknown error"}`
        console.error(`[v0] ${errorMsg}`)
        result.errors.push(errorMsg)
        return result
      }

      // Map bank codes to email addresses
      const bankCodeToEmail: Record<string, string> = {
        VCB: "VCBDigibank@info.vietcombank.com.vn",
        MB: "mbebanking@mbbank.com.vn",
        ACB: "acb-notification@acb.com.vn",
        VCCB: "support@timo.vn", // Timo
        TPB: "ebanking@tpb.com.vn",
      }

      const bankEmails: string[] = []
      let activePaymentMethods
      try {
        const { data, error } = await this.supabase
          .from("payment_methods")
          .select("bank_code")
          .eq("is_active", true)
          .not("bank_code", "is", null)

        if (error) {
          console.error("[v0] Failed to fetch payment methods:", error)
          result.errors.push(`Database error: ${error.message}`)
        }
        activePaymentMethods = data
      } catch (error) {
        const errorMsg = `Failed to query payment methods: ${error instanceof Error ? error.message : "Unknown error"}`
        console.error(`[v0] ${errorMsg}`)
        result.errors.push(errorMsg)
        activePaymentMethods = null
      }

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
        return result
      }

      console.log(`[v0] Found ${emails.length} unseen emails`)

      // Process each email
      for (const email of emails) {
        result.totalProcessed++

        const emailText = email.text || email.html || ""
        console.log(`[v0] Processing email from: ${email.from}, subject: ${email.subject}`)
        console.log(`[v0] Email date from header:`, email.date)
        console.log(`[v0] Email text length: ${emailText.length} characters`)

        // Parse email
        let transaction
        try {
          transaction = BankEmailParser.parse(email.from, emailText)
        } catch (parseError) {
          const errorMsg = `Parse error: ${parseError instanceof Error ? parseError.message : "Unknown error"}`
          console.error("[v0] Email parsing error:", errorMsg)
          console.error("[v0] Email preview:", emailText.substring(0, 500))
          result.errorCount++
          result.errors.push(errorMsg)

          try {
            await this.supabase.from("bank_transactions").insert({
              transaction_id: `PARSE_ERROR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              amount: 0,
              content: (email.subject || "No subject").substring(0, 500),
              sender_info: email.from,
              bank_name: "Unknown",
              email_subject: email.subject,
              email_from: email.from,
              email_date: this.toVietnamTime(email.date), // Convert email date to Vietnam timezone before storing
              email_body: emailText.substring(0, 5000),
              status: "parse_failed",
              error_message: errorMsg,
            })
          } catch (dbError) {
            console.error("[v0] Failed to save parse error to DB:", dbError)
          }
          continue
        }

        if (!transaction) {
          result.errorCount++
          const errorMsg = `Failed to parse email from "${email.from}". Subject: "${email.subject}"`
          console.error(`[v0] ${errorMsg}`)
          console.error("[v0] Email text preview for failed parse:", emailText.substring(0, 1000))
          result.errors.push(errorMsg)

          // Save parse error to DB
          try {
            await this.supabase.from("bank_transactions").insert({
              transaction_id: `UNMATCHED_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              amount: 0,
              content: (email.subject || "No subject").substring(0, 500),
              sender_info: email.from,
              bank_name: "Unknown",
              email_subject: email.subject,
              email_from: email.from,
              email_date: this.toVietnamTime(email.date), // Convert email date to Vietnam timezone before storing
              email_body: emailText.substring(0, 5000),
              status: "parse_failed",
              error_message: "Failed to parse email content - no matching bank pattern",
            })
          } catch (dbError) {
            console.error("[v0] Failed to save parse error to DB:", dbError)
          }

          continue
        }

        console.log("[v0] Parsed transaction:", transaction)

        // Database operations
        try {
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
              email_date: email.date.toISOString(), // Email date is already parsed correctly by IMAP
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
        } catch (dbError) {
          result.errorCount++
          const errorMsg = `Database error processing transaction: ${dbError instanceof Error ? dbError.message : "Unknown error"}`
          console.error(`[v0] ${errorMsg}`)
          result.errors.push(errorMsg)
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
