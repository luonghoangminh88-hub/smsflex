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
      // Bắt được: "Mã giao dịch", "Mã GD", "Ma giao dich", "Ma GD", "GD", "Transaction ID"
      // VD: "Mã giao dịch: FT23123456789" hoặc "Ma GD: ABC123" hoặc "GD: 12345"
      transactionId: /(?:M[aã]\s*(?:giao\s*d[ịi]ch|GD)|GD|Transaction\s*ID|Ref(?:erence)?)[:\s]*([A-Z0-9]+)/i,

      // Bắt được nhiều format số tiền: "+1,000,000 VND", "1.000.000 VND", "+1000000", "So tien: 1.000.000"
      amount: /(?:S[oố]\s*ti[eề]n[:\s]*)?[+]?\s*([\d,.]+)\s*(?:VND|đ|d)?/i,

      // Bắt được: "Nội dung", "Noi dung", "ND", "Content", "Mo ta", "Dien giai"
      content:
        /(?:N[oô]i\s*dung(?:\s*(?:CK|chuy[eển]n\s*kho[aả]n))?|ND|Content|M[ôo]\s*t[ảa]|Di[eễ]n\s*gi[aả]i)[:\s]*(.+?)(?:\n|$|<br|;)/i,

      // Bắt được: "Từ", "Tu", "Người chuyển", "Nguoi chuyen", "From"
      sender: /(?:T[uừ](?:\s*TK)?|Ng[ưu][oờ]i\s*chuy[eển]n|From)[:\s]*(.+?)(?:\n|$|<br|;)/i,
    },
  },
  {
    name: "MB Bank",
    fromEmail: "mbebanking@mbbank.com.vn",
    patterns: {
      // MB Bank format: "Ref: MB123456789", "Mã giao dịch: 987654321", "Transaction ID: XXX"
      transactionId: /(?:Ref(?:erence)?|M[aã]\s*(?:giao\s*d[ịi]ch|GD)|Transaction\s*ID|GD)[:\s]*([A-Z0-9]+)/i,

      // MB Bank number format
      amount: /(?:S[oố]\s*ti[eề]n[:\s]*)?[+]?\s*([\d,.]+)\s*(?:VND|đ|d)?/i,

      // MB Bank content variations
      content:
        /(?:N[oô]i\s*dung(?:\s*(?:CK|chuy[eển]n\s*kho[aả]n))?|ND|M[ôo]\s*t[ảa]|Description|Content)[:\s]*(.+?)(?:\n|$|<br|;)/i,

      // MB Bank sender info
      sender: /(?:TK\s*g[ửu]i|T[uừ](?:\s*TK)?|From|Ng[ưu][oờ]i\s*g[ửu]i)[:\s]*(.+?)(?:\n|$|<br|;)/i,
    },
  },
  {
    name: "ACB",
    fromEmail: "acb-notification@acb.com.vn",
    patterns: {
      // ACB format: "Trace: ACB123456", "Mã tham chiếu: 123456789"
      transactionId: /(?:Trace|M[aã]\s*tham\s*chi[eế]u|Reference|M[aã]\s*GD|GD)[:\s]*([A-Z0-9]+)/i,

      // ACB number format
      amount: /[+]?\s*([\d,.]+)\s*(?:VND|đ|d)?/i,

      // ACB content
      content: /(?:N[oô]i\s*dung|Di[eễ]n\s*gi[aả]i|Description|Content|M[ôo]\s*t[ảa])[:\s]*(.+?)(?:\n|$|<br|;)/i,

      // ACB sender
      sender: /(?:Ng[ưu][oờ]i\s*(?:chuy[eển]n|g[ửu]i)|T[uừ]|From)[:\s]*(.+?)(?:\n|$|<br|;)/i,
    },
  },
  {
    name: "Timo",
    fromEmail: "support@timo.vn",
    patterns: {
      // Timo format: "Mã lệnh: BVCVCB-12207614650" with hyphens and mixed case
      transactionId: /(?:M[aã]\s*l[eệ]nh|M[aã]\s*GD|Transaction\s*ID|Ref(?:erence)?)[:\s]*([\w-]+)/i,

      amount: /(?:v[aà]o|nh[aậ]n|chuy[eể]n|Số\s*tiền)?\s*[+]?\s*([\d,.]+)\s*(?:VND|đ|d)/i,

      content: /NAPTENF\d+|(?:Description|Content|Message|N[oô]i\s*dung)[:\s]*(.+?)(?:\n|$|<br|;)/i,

      sender: /(?:From|T[uừ]|Ng[ưu][oờ]i\s*g[ửu]i|Số\s*dư\s*hiện\s*tại)[:\s]*(.+?)(?:\n|$|<br|;)/i,
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

  static parse(emailFrom: string, emailText: string): BankTransaction | null {
    const config = BANK_CONFIGS.find((c) => emailFrom.toLowerCase().includes(c.fromEmail.toLowerCase()))

    if (!config) {
      console.log("[v0] No parser config found for:", emailFrom)
      return null
    }

    try {
      console.log(`[v0] Parsing email from ${config.name}`)
      console.log("[v0] Email text preview:", emailText.substring(0, 800))

      // Extract transaction ID
      const transactionIdMatch = emailText.match(config.patterns.transactionId)
      if (!transactionIdMatch) {
        console.log("[v0] Transaction ID not found with pattern:", config.patterns.transactionId)
        console.log("[v0] Full email text:", emailText)
        return null
      }
      const transactionId = transactionIdMatch[1].trim()
      console.log("[v0] Found transaction ID:", transactionId)

      // Extract amount
      const amountMatch = emailText.match(config.patterns.amount)
      if (!amountMatch) {
        console.log("[v0] Amount not found with pattern:", config.patterns.amount)
        return null
      }
      const cleanAmount = amountMatch[1].replace(/[.,]/g, "")
      const amount = Number.parseFloat(cleanAmount)
      console.log("[v0] Found amount:", amount)

      // Extract content
      let content = ""
      const naptenMatch = emailText.match(/NAPTENF\d+/i)
      if (naptenMatch) {
        content = naptenMatch[0]
        console.log("[v0] Found NAPTENF code:", content)
      } else {
        const contentMatch = emailText.match(config.patterns.content)
        if (!contentMatch) {
          console.log("[v0] Content not found with pattern:", config.patterns.content)
          return null
        }
        content = contentMatch[1]?.trim() || contentMatch[0]?.trim()
        console.log("[v0] Found content:", content)
      }

      // Extract sender info (optional)
      let senderInfo: string | undefined
      if (config.patterns.sender) {
        const senderMatch = emailText.match(config.patterns.sender)
        if (senderMatch) {
          senderInfo = senderMatch[1].trim()
          console.log("[v0] Found sender:", senderInfo)
        }
      }

      // Try to extract user ID from content
      const userId = this.extractUserId(content)
      if (userId) {
        console.log("[v0] Extracted user ID:", userId)
      }

      return {
        transactionId,
        amount,
        content,
        senderInfo,
        bankName: config.name,
        userId,
      }
    } catch (error) {
      console.error("[v0] Error parsing bank email:", error)
      return null
    }
  }

  private static extractUserId(content: string): string | undefined {
    const patterns = [
      /NAPTENF(\d+)/i, // Full payment_code: NAPTENF123250174617584
      /NAP\s*(\d+)/i,
      /DEPOSIT\s*(\d+)/i,
      /ID\s*(\d+)/i,
      /USER\s*(\d+)/i,
      /TENF(\d+)/i, // Last part of payment code
    ]

    for (const pattern of patterns) {
      const match = content.match(pattern)
      if (match) {
        return match[1]
      }
    }

    return undefined
  }
}
