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
            .select("id, status")
            .eq("transaction_id", transaction.transactionId)
            .single()

          if (existing) {
            // Only skip if transaction was successfully completed
            if (existing.status === "success" || existing.status === "completed") {
              console.log(`[v0] Transaction ${transaction.transactionId} already completed successfully, skipping`)
              continue
            } else {
              console.log(
                `[v0] Transaction ${transaction.transactionId} exists with status "${existing.status}", reprocessing...`,
              )
              // Delete the incomplete transaction so we can reprocess it
              await this.supabase.from("bank_transactions").delete().eq("id", existing.id)
            }
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
              status: "processing",
            })
            .select()
            .single()

          if (insertError) {
            result.errorCount++
            result.errors.push(`Failed to save transaction: ${insertError.message}`)
            continue
          }

          console.log(`[v0] Created bank transaction with status "processing": ${bankTx.id}`)

          let deposit: any = null
          let depositError: any = null

          // Strategy 1: If userId exists in transaction, match by user_id
          if (transaction.userId) {
            console.log(`[v0] Attempting to match deposit by user_id: ${transaction.userId}`)

            const { data, error } = await this.supabase
              .from("deposits")
              .select("*, profiles!inner(*)")
              .eq("status", "pending")
              .eq("user_id", transaction.userId)
              .order("created_at", { ascending: false })
              .limit(1)
              .maybeSingle()

            deposit = data
            depositError = error

            if (deposit) {
              console.log(`[v0] ✅ Found deposit by user_id: ${deposit.id}`)
            } else {
              console.log(`[v0] ⚠️ No pending deposit found for user_id: ${transaction.userId}`)
            }
          }

          // Strategy 2: If no userId or no match, try payment_code match
          if (!deposit && transaction.content) {
            console.log(`[v0] Attempting to match deposit by payment_code in content: ${transaction.content}`)

            // Extract all potential payment codes from the transaction content
            // Look for patterns like NAPTEN followed by hex characters
            const paymentCodeMatch = transaction.content.match(/NAPTEN[A-F0-9]{8,}/i)

            if (paymentCodeMatch) {
              const extractedCode = paymentCodeMatch[0]
              console.log(`[v0] Extracted payment code from content: ${extractedCode}`)

              // Try to find a deposit where the payment_code is the beginning of the extracted code
              const { data: deposits, error } = await this.supabase
                .from("deposits")
                .select("*, profiles!inner(*)")
                .eq("status", "pending")
                .order("created_at", { ascending: false })

              if (deposits && deposits.length > 0) {
                // Find the deposit whose payment_code matches the start of the extracted code
                deposit = deposits.find((d) => extractedCode.toUpperCase().startsWith(d.payment_code.toUpperCase()))

                if (deposit) {
                  console.log(`[v0] ✅ Found deposit by matching payment_code prefix: ${deposit.id}`)
                } else {
                  console.log(`[v0] ⚠️ No pending deposit found with matching payment_code`)
                }
              }
            } else {
              console.log(`[v0] ⚠️ No payment code pattern found in content`)
            }
          }

          // Handle orphan transaction if no deposit is found
          if (!deposit) {
            const orphanResult = await this.handleOrphanTransaction(bankTx.id, transaction.amount, transaction.content)
            if (orphanResult.success) {
              result.successCount++
              console.log(`[v0] ✅ Successfully handled orphan transaction ${bankTx.id}`)
            } else {
              result.errorCount++
              result.errors.push(orphanResult.error || "Failed to handle orphan transaction")
            }
            continue
          }

          if (deposit) {
            // Verify amount matches
            if (Math.abs(deposit.amount - transaction.amount) < 100) {
              // Allow 100 VND tolerance
              const processed = await this.completeDeposit(bankTx.id, deposit.id, deposit.user_id)

              if (processed.success) {
                result.successCount++
                console.log(`[v0] ✅ Successfully processed deposit ${deposit.id}`)
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
                  user_id: deposit.user_id,
                  deposit_id: deposit.id,
                })
                .eq("id", bankTx.id)

              result.manualReviewCount++
              console.log(`[v0] ⚠️ Amount mismatch for deposit ${deposit.id}`)
            }
          } else {
            // No matching deposit found - manual review
            await this.supabase
              .from("bank_transactions")
              .update({
                status: "manual_review",
                error_message: "No matching deposit found",
                user_id: transaction.userId || null,
              })
              .eq("id", bankTx.id)

            result.manualReviewCount++
            console.log(`[v0] ⚠️ No matching deposit found for transaction ${transaction.transactionId}`)
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
      console.log(`[v0] 🔄 Starting completeDeposit for deposit ${depositId}, user ${userId}`)

      const { data: deposit } = await this.supabase.from("deposits").select("amount").eq("id", depositId).single()

      if (!deposit) {
        console.error(`[v0] ❌ Deposit ${depositId} not found`)
        return { success: false, error: "Deposit not found" }
      }

      console.log(`[v0] 💰 Processing deposit amount: ${deposit.amount}`)

      const { data: balanceResult, error: balanceError } = await this.supabase.rpc("update_balance_atomic", {
        p_user_id: userId,
        p_amount: deposit.amount,
        p_transaction_type: "deposit",
        p_description: "Nạp tiền tự động qua chuyển khoản",
        p_rental_id: null,
      })

      if (balanceError) {
        console.error("[v0] ❌ Balance update error:", balanceError)
        return { success: false, error: balanceError.message }
      }

      console.log(`[v0] ✅ Balance updated successfully:`, balanceResult)

      const { error: depositError } = await this.supabase
        .from("deposits")
        .update({
          status: "completed",
          updated_at: new Date().toISOString(),
        })
        .eq("id", depositId)

      if (depositError) {
        console.error("[v0] ❌ Deposit update error:", depositError)
        return { success: false, error: depositError.message }
      }

      console.log(`[v0] ✅ Deposit status updated to completed`)

      await this.supabase
        .from("bank_transactions")
        .update({
          status: "success",
          user_id: userId,
          deposit_id: depositId,
          processed_at: new Date().toISOString(),
        })
        .eq("id", bankTxId)

      console.log(`[v0] ✅ Bank transaction status updated to success`)

      await this.supabase.from("notifications").insert({
        user_id: userId,
        type: "deposit_approved",
        title: "Nạp tiền thành công",
        message: `Tài khoản của bạn đã được cộng ${deposit.amount.toLocaleString("vi-VN")}đ`,
        metadata: { deposit_id: depositId, amount: deposit.amount },
        is_read: false,
      })

      console.log(`[v0] ✅ Notification sent to user`)
      console.log(`[v0] 🎉 Successfully completed deposit ${depositId} for user ${userId}`)
      return { success: true }
    } catch (error) {
      console.error("[v0] ❌ Error completing deposit:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }

  async handleOrphanTransaction(
    bankTxId: string,
    amount: number,
    content: string,
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`[v0] 🔄 Handling orphan transaction ${bankTxId} with amount ${amount}`)

      // Try to extract user ID from content
      const userIdMatch = content.match(/NAPTEN([A-F0-9]{8})[A-F0-9]*/i)

      if (!userIdMatch) {
        console.log(`[v0] ⚠️ Cannot extract user ID from content: ${content}`)
        return { success: false, error: "Cannot extract user ID from transaction content" }
      }

      const userIdPrefix = userIdMatch[1].toLowerCase()
      console.log(`[v0] Extracted user ID prefix: ${userIdPrefix}`)

      // Find user whose ID starts with this prefix
      const { data: profiles, error: profileError } = await this.supabase
        .from("profiles")
        .select("id, email, full_name")

      if (profileError || !profiles || profiles.length === 0) {
        console.log(`[v0] ⚠️ No profiles found in database`)
        return { success: false, error: "No users found in system" }
      }

      // Find matching user by ID prefix
      const matchingProfile = profiles.find((p) => p.id.replace(/-/g, "").toLowerCase().startsWith(userIdPrefix))

      if (!matchingProfile) {
        console.log(`[v0] ⚠️ No user found with ID prefix: ${userIdPrefix}`)
        return { success: false, error: `No user found matching ID prefix ${userIdPrefix}` }
      }

      console.log(`[v0] ✅ Found matching user: ${matchingProfile.email}`)

      // Create a deposit for this user
      const { data: newDeposit, error: depositError } = await this.supabase
        .from("deposits")
        .insert({
          user_id: matchingProfile.id,
          amount: amount,
          payment_method: "bank_transfer",
          payment_code: content.match(/NAPTEN[A-F0-9]{8,}/i)?.[0] || `AUTO_${Date.now()}`,
          status: "pending",
        })
        .select()
        .single()

      if (depositError || !newDeposit) {
        console.error(`[v0] ❌ Failed to create deposit:`, depositError)
        return { success: false, error: depositError?.message || "Failed to create deposit" }
      }

      console.log(`[v0] ✅ Created deposit ${newDeposit.id} for user ${matchingProfile.id}`)

      // Now complete the deposit
      return await this.completeDeposit(bankTxId, newDeposit.id, matchingProfile.id)
    } catch (error) {
      console.error("[v0] ❌ Error handling orphan transaction:", error)
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }
    }
  }
}
