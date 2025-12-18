import crypto from "crypto"

export interface VNPayConfig {
  tmnCode: string
  hashSecret: string
  url: string
  returnUrl: string
}

export interface VNPayPaymentParams {
  amount: number
  orderId: string
  orderInfo: string
  ipAddr: string
  locale?: string
}

export class VNPayService {
  private config: VNPayConfig

  constructor(config: VNPayConfig) {
    this.config = config
  }

  createPaymentUrl(params: VNPayPaymentParams): string {
    const date = new Date()
    const createDate = this.formatDate(date)
    const expireDate = this.formatDate(new Date(date.getTime() + 15 * 60 * 1000)) // 15 minutes

    let vnpParams: Record<string, string> = {
      vnp_Version: "2.1.0",
      vnp_Command: "pay",
      vnp_TmnCode: this.config.tmnCode,
      vnp_Amount: (params.amount * 100).toString(), // VNPay uses cents
      vnp_CurrCode: "VND",
      vnp_TxnRef: params.orderId,
      vnp_OrderInfo: params.orderInfo,
      vnp_OrderType: "other",
      vnp_Locale: params.locale || "vn",
      vnp_ReturnUrl: this.config.returnUrl,
      vnp_IpAddr: params.ipAddr,
      vnp_CreateDate: createDate,
      vnp_ExpireDate: expireDate,
    }

    // Sort params alphabetically
    vnpParams = Object.keys(vnpParams)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = vnpParams[key]
          return acc
        },
        {} as Record<string, string>,
      )

    const signData = new URLSearchParams(vnpParams).toString()
    const hmac = crypto.createHmac("sha512", this.config.hashSecret)
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")

    vnpParams.vnp_SecureHash = signed

    return this.config.url + "?" + new URLSearchParams(vnpParams).toString()
  }

  verifyReturnUrl(queryParams: Record<string, string>): { isValid: boolean; data: Record<string, string> } {
    const vnpSecureHash = queryParams.vnp_SecureHash
    delete queryParams.vnp_SecureHash
    delete queryParams.vnp_SecureHashType

    // Sort params
    const sortedParams = Object.keys(queryParams)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = queryParams[key]
          return acc
        },
        {} as Record<string, string>,
      )

    const signData = new URLSearchParams(sortedParams).toString()
    const hmac = crypto.createHmac("sha512", this.config.hashSecret)
    const signed = hmac.update(Buffer.from(signData, "utf-8")).digest("hex")

    return {
      isValid: signed === vnpSecureHash,
      data: queryParams,
    }
  }

  private formatDate(date: Date): string {
    const pad = (n: number) => (n < 10 ? "0" + n : n)
    return (
      date.getFullYear().toString() +
      pad(date.getMonth() + 1) +
      pad(date.getDate()) +
      pad(date.getHours()) +
      pad(date.getMinutes()) +
      pad(date.getSeconds())
    )
  }
}

export function getVNPayService(): VNPayService {
  return new VNPayService({
    tmnCode: process.env.VNPAY_TMN_CODE || "",
    hashSecret: process.env.VNPAY_HASH_SECRET || "",
    url: process.env.VNPAY_URL || "https://sandbox.vnpayment.vn/paymentv2/vpcpay.html",
    returnUrl: process.env.VNPAY_RETURN_URL || "http://localhost:3000/api/payment/vnpay/callback",
  })
}
