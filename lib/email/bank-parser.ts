export interface BankTransaction {
  transactionId: string
  amount: number
  content: string
  senderInfo?: string
  bankName: string
  userId?: string
}

interface BankParserConfig {
  name: string
  fromEmail: string
  patterns: {
    transactionId: RegExp
    amount: RegExp
    content: RegExp
    sender?: RegExp
  }
}

const BANK_CONFIGS: BankParserConfig[] = [
  {
    name: "Vietcombank",
    fromEmail: "VCBDigibank@info.vietcombank.com.vn",
    patterns: {
      transactionId: /(?:M[aã]\s*(?:giao\s*d[ịi]ch|GD)|GD|Transaction\s*ID|Ref(?:erence)?)[:\s]*([A-Z0-9]+)/i,
      amount: /(?:S[oố]\s*ti[eề]n[:\s]*)?[+]?\s*([\d,.]+)\s*(?:VND|đ|d)?/i,
      content:
        /(?:N[oô]i\s*dung(?:\s*(?:CK|chuy[eển]n\s*kho[aả]n))?|ND|Content|M[ôo]\s*t[ảa]|Di[eễ]n\s*gi[aả]i)[:\s]*(.+?)(?:\n|$|<br|;)/i,
      sender: /(?:T[uừ](?:\s*TK)?|Ng[ưu][oờ]i\s*chuy[eển]n|From)[:\s]*(.+?)(?:\n|$|<br|;)/i,
    },
  },
  {
    name: "MB Bank",
    fromEmail: "mbebanking@mbbank.com.vn",
    patterns: {
      transactionId: /(?:Ref(?:erence)?|M[aã]\s*(?:giao\s*d[ịi]ch|GD)|Transaction\s*ID|GD)[:\s]*([A-Z0-9]+)/i,
      amount: /(?:S[oố]\s*ti[eề]n[:\s]*)?[+]?\s*([\d,.]+)\s*(?:VND|đ|d)?/i,
      content:
        /(?:N[oô]i\s*dung(?:\s*(?:CK|chuy[eển]n\s*kho[aả]n))?|ND|M[ôo]\s*t[ảa]|Description|Content)[:\s]*(.+?)(?:\n|$|<br|;)/i,
      sender: /(?:TK\s*g[ửu]i|T[uừ](?:\s*TK)?|From|Ng[ưu][oờ]i\s*g[ửu]i)[:\s]*(.+?)(?:\n|$|<br|;)/i,
    },
  },
  {
    name: "ACB",
    fromEmail: "acb-notification@acb.com.vn",
    patterns: {
      transactionId: /(?:Trace|M[aã]\s*tham\s*chi[eế]u|Reference|M[aã]\s*GD|GD)[:\s]*([A-Z0-9]+)/i,
      amount: /[+]?\s*([\d,.]+)\s*(?:VND|đ|d)?/i,
      content: /(?:N[oô]i\s*dung|Di[eễ]n\s*gi[aả]i|Description|Content|M[ôo]\s*t[ảa])[:\s]*(.+?)(?:\n|$|<br|;)/i,
      sender: /(?:Ng[ưu][oờ]i\s*(?:chuy[eển]n|g[ửu]i)|T[uừ]|From)[:\s]*(.+?)(?:\n|$|<br|;)/i,
    },
  },
  {
    name: "Timo",
    fromEmail: "timo",
    patterns: {
      // Match full MBVCB code like: MBVCB.12225147306.5354BFTVG2RR99AD.NAPTEND43E5D4201371170
      transactionId: /MBVCB\.\d+(?:\.[A-Z0-9]+)+|NAPTEN[A-Z0-9]+/i,

      // Match amount like "tăng 10.000 VND" - fixed to capture numbers with dots/commas
      amount: /(?:t[aă]ng|nh[aậ]n|chuy[eển]n|gi[aả]m|c[oộ]ng)\s+([\d.,]+)\s*VND/i,

      // Match content from "Mô tả:" until "Cảm ơn" or "Trân trọng"
      content: /M[ôo]\s*t[aả][:\s]*(.+?)(?=C[aả]m\s*[oơ]n|Tr[aâ]n\s*tr[oọ]ng|$)/is,

      // Match sender like "CT tu 1055116973 LUONG VAN HOC"
      sender: /CT\s+tu\s+(\d+)\s+([A-Z\s]+?)(?=\s+toi|\s+tai|$)/i,
    },
  },
  {
    name: "TPBank",
    fromEmail: "ebanking@tpb.com.vn",
    patterns: {
      transactionId: /(?:Trans(?:action)?\s*(?:ID|Reference)|M[aã]\s*GD|Ref)[:\s]*([A-Z0-9]+)/i,
      amount: /[+]?\s*([\d,.]+)\s*(?:VND|đ)?/i,
      content: /(?:Content|Description|N[oô]i\s*dung)[:\s]*(.+?)(?:\n|$|<br|;)/i,
      sender: /(?:From|T[uừ])[:\s]*(.+?)(?:\n|$|<br|;)/i,
    },
  },
  {
    name: "VCB",
    fromEmail: "vcb@vcb.com.vn",
    patterns: {
      transactionId: /(?:FT\d+|M[aã]\s*GD[:\s]*[A-Z0-9]+)/i,
      amount: /[+]?\s*([\d,.]+)\s*(?:VND)?/i,
      content: /(?:ND|N[oô]i\s*dung)[:\s]*(.+?)(?:\n|<|;)/i,
      sender: /(?:TK\s*g[ửu]i|T[uừ])[:\s]*(.+?)(?:\n|<|;)/i,
    },
  },
]

export class BankEmailParser {
  static getSupportedBankEmails(): string[] {
    return BANK_CONFIGS.map((config) => config.fromEmail)
  }

  private static extractEmailAddress(from: string): string {
    const emailMatch = from.match(/<([^>]+)>/)
    return emailMatch ? emailMatch[1].toLowerCase() : from.toLowerCase()
  }

  static parse(emailFrom: string, emailText: string): BankTransaction | null {
    const actualEmail = this.extractEmailAddress(emailFrom)
    console.log("[v0] ===== Starting Bank Email Parse =====")
    console.log("[v0] Extracted email address:", actualEmail)
    console.log("[v0] Original email from:", emailFrom)

    const config = BANK_CONFIGS.find((c) => {
      const configEmail = c.fromEmail.toLowerCase()
      const fromEmail = actualEmail.toLowerCase()
      return fromEmail.includes(configEmail) || configEmail.includes(fromEmail)
    })

    if (!config) {
      console.log("[v0] No parser config found for:", actualEmail)
      console.log(
        "[v0] Supported emails:",
        BANK_CONFIGS.map((c) => c.fromEmail),
      )
      return null
    }

    try {
      console.log(`[v0] Using parser for: ${config.name}`)
      console.log("[v0] Email text length:", emailText.length)
      console.log("[v0] Email text preview (first 1000 chars):", emailText.substring(0, 1000))

      const timoDateMatch = emailText.match(/(\d{1,2})\/(\d{1,2})\/(\d{4})\s+(\d{1,2}):(\d{2})/i)
      if (timoDateMatch && config.name === "Timo") {
        const [_, day, month, year, hour, minute] = timoDateMatch
        console.log(`[v0] Found Timo transaction date: ${day}/${month}/${year} ${hour}:${minute} (Vietnam time)`)
      }

      const amountMatch = emailText.match(config.patterns.amount)
      if (!amountMatch) {
        console.log("[v0] ❌ Amount not found with pattern:", config.patterns.amount.toString())
        console.log("[v0] Searching for common amount patterns in text...")
        const allNumbers = emailText.match(/\d{3,}/g)
        console.log("[v0] All numbers found (first 10):", allNumbers?.slice(0, 10))
        return null
      }

      // Remove dots and commas, parse as integer
      const cleanAmount = amountMatch[1].replace(/[.,]/g, "")
      const amount = Number.parseFloat(cleanAmount)
      console.log("[v0] ✅ Found amount:", amount, "VND (from match:", amountMatch[0], ")")

      let content = ""

      // Strategy 1: Try to extract from "Mô tả:" section
      const moTaMatch = emailText.match(/M[ôo]\s*t[aả][:\s]*(.+?)(?=C[aả]m\s*[oơ]n|Tr[aâ]n\s*tr[oọ]ng|$)/is)
      if (moTaMatch && moTaMatch[1]) {
        content = moTaMatch[1].trim().replace(/\s+/g, " ")
        console.log("[v0] ✅ Found content from 'Mô tả' section:", content.substring(0, 200))
      }

      // Strategy 2: Try to find NAPTEN code specifically
      if (!content) {
        const naptenMatch = emailText.match(/NAPTEN[A-Z0-9]+/i)
        if (naptenMatch) {
          content = naptenMatch[0]
          console.log("[v0] ✅ Found NAPTEN code as content:", content)
        }
      }

      // Strategy 3: Use config pattern
      if (!content) {
        const contentMatch = emailText.match(config.patterns.content)
        if (contentMatch) {
          content = (contentMatch[1] || contentMatch[0]).trim()
          console.log("[v0] ✅ Found content from config pattern:", content.substring(0, 200))
        }
      }

      if (!content) {
        console.log("[v0] ⚠️ No content found, using fallback")
        content = `No content - ${config.name} transaction`
      }

      let transactionId = ""

      // Try full MBVCB format first
      const fullMbvcbMatch = emailText.match(/MBVCB\.\d+\.[A-Z0-9]+\.[A-Z0-9]+\.[A-Z0-9]+/i)
      if (fullMbvcbMatch) {
        transactionId = fullMbvcbMatch[0]
        console.log("[v0] ✅ Found full MBVCB transaction ID:", transactionId)
      } else {
        // Try shorter MBVCB format
        const mbvcbMatch = emailText.match(/MBVCB\.\d+\.[A-Z0-9]+/i)
        if (mbvcbMatch) {
          transactionId = mbvcbMatch[0]
          console.log("[v0] ✅ Found MBVCB transaction ID:", transactionId)
        } else {
          // Try NAPTEN code
          const naptenMatch = emailText.match(/NAPTEN[A-Z0-9]+/i)
          if (naptenMatch) {
            transactionId = naptenMatch[0]
            console.log("[v0] ✅ Found NAPTEN transaction ID:", transactionId)
          } else {
            // Use config pattern
            const transactionIdMatch = emailText.match(config.patterns.transactionId)
            if (transactionIdMatch) {
              transactionId = (transactionIdMatch[1] || transactionIdMatch[0]).trim()
              console.log("[v0] ✅ Found transaction ID from config pattern:", transactionId)
            } else {
              // Generate fallback ID
              transactionId = `${config.name.toUpperCase()}_${Date.now()}_${amount}`
              console.log("[v0] ⚠️ No transaction ID found, generated fallback:", transactionId)
            }
          }
        }
      }

      // Extract sender info (optional)
      let senderInfo: string | undefined
      if (config.patterns.sender) {
        const senderMatch = emailText.match(config.patterns.sender)
        if (senderMatch) {
          senderInfo = senderMatch.slice(1).join(" ").trim()
          console.log("[v0] ✅ Found sender info:", senderInfo)
        }
      }

      // Try to extract user ID from content
      const userId = this.extractUserId(content)
      if (userId) {
        console.log("[v0] ✅ Extracted user ID from content:", userId)
      } else {
        console.log("[v0] ⚠️ No user ID found in content")
      }

      const transaction = {
        transactionId,
        amount,
        content,
        senderInfo,
        bankName: config.name,
        userId,
      }

      console.log("[v0] ===== Parse Complete - SUCCESS =====")
      console.log("[v0] Transaction summary:", JSON.stringify(transaction, null, 2))

      return transaction
    } catch (error) {
      console.error("[v0] ===== Parse Complete - ERROR =====")
      console.error("[v0] Error parsing bank email:", error)
      return null
    }
  }

  private static extractUserId(content: string): string | undefined {
    const patterns = [
      /NAPTEN([A-Z0-9]{32})/i, // Match full UUID without hyphens (32 chars)
      /NAPTEN([A-Z0-9]{12})/i, // Match new format: 8 chars userId + 4 random
      /NAPTEN([A-Z0-9]+)/i,
      /NAP\s*TEN\s*([A-Z0-9]+)/i,
      /NAP\s*(\d+)/i,
      /DEPOSIT\s*(\d+)/i,
      /ID\s*(\d+)/i,
      /USER\s*(\d+)/i,
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match && match[1]) {
        console.log(`[v0] Extracted user ID "${match[1]}" using pattern: ${pattern.toString()}`)
        const extractedId = match[1]

        if (extractedId.length === 32 && /^[A-Z0-9]{32}$/i.test(extractedId)) {
          // Format: 8-4-4-4-12
          const formatted =
            `${extractedId.substring(0, 8)}-${extractedId.substring(8, 12)}-${extractedId.substring(12, 16)}-${extractedId.substring(16, 20)}-${extractedId.substring(20, 32)}`.toLowerCase()
          console.log(`[v0] Formatted UUID: ${formatted}`)
          return formatted
        } else if (extractedId.length === 12 && /^[A-Z0-9]{12}$/i.test(extractedId)) {
          const userIdPrefix = extractedId.substring(0, 8).toLowerCase()
          console.log(`[v0] Extracted user ID prefix from short code: ${userIdPrefix}`)
          // Return the prefix - processor will match profiles starting with this
          return userIdPrefix
        }
        return extractedId
      }
    }

    console.log("[v0] No user ID pattern matched in content:", content.substring(0, 100))
    return undefined
  }
}
