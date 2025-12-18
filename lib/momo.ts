import crypto from "crypto"

export interface MoMoConfig {
  partnerCode: string
  accessKey: string
  secretKey: string
  endpoint: string
  redirectUrl: string
  ipnUrl: string
}

export interface MoMoPaymentParams {
  amount: number
  orderId: string
  orderInfo: string
  requestId: string
}

export class MoMoService {
  private config: MoMoConfig

  constructor(config: MoMoConfig) {
    this.config = config
  }

  async createPaymentUrl(params: MoMoPaymentParams): Promise<{ payUrl: string; deeplink: string } | null> {
    const requestId = params.requestId
    const orderId = params.orderId
    const amount = params.amount.toString()
    const orderInfo = params.orderInfo
    const redirectUrl = this.config.redirectUrl
    const ipnUrl = this.config.ipnUrl
    const requestType = "captureWallet"
    const extraData = ""

    const rawSignature = `accessKey=${this.config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${this.config.partnerCode}&redirectUrl=${redirectUrl}&requestId=${requestId}&requestType=${requestType}`

    const signature = crypto.createHmac("sha256", this.config.secretKey).update(rawSignature).digest("hex")

    const requestBody = {
      partnerCode: this.config.partnerCode,
      accessKey: this.config.accessKey,
      requestId,
      amount,
      orderId,
      orderInfo,
      redirectUrl,
      ipnUrl,
      extraData,
      requestType,
      signature,
      lang: "vi",
    }

    try {
      const response = await fetch(this.config.endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      })

      const data = await response.json()

      if (data.resultCode === 0) {
        return {
          payUrl: data.payUrl,
          deeplink: data.deeplink,
        }
      }

      console.error("[v0] MoMo payment creation failed:", data)
      return null
    } catch (error) {
      console.error("[v0] MoMo API error:", error)
      return null
    }
  }

  verifySignature(data: Record<string, string>): boolean {
    const { signature, ...params } = data

    const rawSignature = Object.keys(params)
      .sort()
      .map((key) => `${key}=${params[key]}`)
      .join("&")

    const expectedSignature = crypto.createHmac("sha256", this.config.secretKey).update(rawSignature).digest("hex")

    return signature === expectedSignature
  }
}

export function getMoMoService(): MoMoService {
  return new MoMoService({
    partnerCode: process.env.MOMO_PARTNER_CODE || "",
    accessKey: process.env.MOMO_ACCESS_KEY || "",
    secretKey: process.env.MOMO_SECRET_KEY || "",
    endpoint: process.env.MOMO_ENDPOINT || "https://test-payment.momo.vn/v2/gateway/api/create",
    redirectUrl: process.env.MOMO_REDIRECT_URL || "http://localhost:3000/api/payment/momo/callback",
    ipnUrl: process.env.MOMO_IPN_URL || "http://localhost:3000/api/payment/momo/ipn",
  })
}
