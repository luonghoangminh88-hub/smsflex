/**
 * Service ID Mapping between SMS providers
 * Maps internal service codes to provider-specific codes
 */

export interface ServiceMapping {
  internal: string
  smsActivate: string
  fiveSim: string
  displayName: string
  isExperimental?: boolean // Uses "other" service code, may not always receive OTP
  fallbackService?: string // Alternative service to use if provider doesn't support
}

// These will use "other" service code which receives ALL SMS
const EXPERIMENTAL_SERVICES = [
  "zalo",
  "grab",
  "xanhsm",
  "fptplay",
  "shopee",
  "lazada",
  "chatgpt",
  "claude",
  "gemini",
  "netflix",
]

// Comprehensive service mapping table
export const SERVICE_MAPPINGS: ServiceMapping[] = [
  // Social Media & Messaging (Officially Supported)
  { internal: "telegram", smsActivate: "tg", fiveSim: "telegram", displayName: "Telegram" },
  { internal: "whatsapp", smsActivate: "wa", fiveSim: "whatsapp", displayName: "WhatsApp" },
  { internal: "facebook", smsActivate: "fb", fiveSim: "facebook", displayName: "Facebook" },
  { internal: "instagram", smsActivate: "ig", fiveSim: "instagram", displayName: "Instagram" },
  { internal: "tiktok", smsActivate: "tt", fiveSim: "tiktok", displayName: "TikTok" },
  { internal: "viber", smsActivate: "vi", fiveSim: "viber", displayName: "Viber" },
  { internal: "wechat", smsActivate: "we", fiveSim: "wechat", displayName: "WeChat" },
  { internal: "discord", smsActivate: "ds", fiveSim: "discord", displayName: "Discord" },
  { internal: "snapchat", smsActivate: "ot", fiveSim: "snapchat", displayName: "Snapchat" },
  { internal: "twitter", smsActivate: "tw", fiveSim: "twitter", displayName: "Twitter/X" },

  {
    internal: "zalo",
    smsActivate: "ot", // "ot" = other/any service
    fiveSim: "other",
    displayName: "Zalo",
    isExperimental: true,
  },

  // E-commerce & Payment (Mix of supported and experimental)
  { internal: "amazon", smsActivate: "am", fiveSim: "amazon", displayName: "Amazon" },
  { internal: "ebay", smsActivate: "eb", fiveSim: "ebay", displayName: "eBay" },
  { internal: "paypal", smsActivate: "pp", fiveSim: "paypal", displayName: "PayPal" },
  { internal: "alipay", smsActivate: "al", fiveSim: "alipay", displayName: "Alipay" },

  {
    internal: "shopee",
    smsActivate: "ot",
    fiveSim: "other",
    displayName: "Shopee",
    isExperimental: true,
  },
  {
    internal: "lazada",
    smsActivate: "ot",
    fiveSim: "other",
    displayName: "Lazada",
    isExperimental: true,
  },

  // Ride Sharing & Delivery (Experimental)
  {
    internal: "grab",
    smsActivate: "ot",
    fiveSim: "other",
    displayName: "Grab",
    isExperimental: true,
  },
  {
    internal: "xanhsm",
    smsActivate: "ot",
    fiveSim: "other",
    displayName: "Xanh SM Taxi",
    isExperimental: true,
  },
  { internal: "uber", smsActivate: "ub", fiveSim: "uber", displayName: "Uber" },
  { internal: "gojek", smsActivate: "gj", fiveSim: "gojek", displayName: "Gojek" },

  // Streaming & Entertainment (Experimental)
  {
    internal: "netflix",
    smsActivate: "ot",
    fiveSim: "other",
    displayName: "Netflix",
    isExperimental: true,
  },
  {
    internal: "fptplay",
    smsActivate: "ot",
    fiveSim: "other",
    displayName: "FPT Play",
    isExperimental: true,
  },

  // AI Services (Experimental)
  {
    internal: "chatgpt",
    smsActivate: "ot",
    fiveSim: "other",
    displayName: "ChatGPT",
    isExperimental: true,
  },
  {
    internal: "claude",
    smsActivate: "ot",
    fiveSim: "other",
    displayName: "Claude AI",
    isExperimental: true,
  },
  {
    internal: "gemini",
    smsActivate: "ot",
    fiveSim: "other",
    displayName: "Gemini AI",
    isExperimental: true,
  },

  // Tech & Others (Officially Supported)
  { internal: "google", smsActivate: "go", fiveSim: "google", displayName: "Google" },
  { internal: "microsoft", smsActivate: "mm", fiveSim: "microsoft", displayName: "Microsoft" },
  { internal: "yahoo", smsActivate: "ya", fiveSim: "yahoo", displayName: "Yahoo" },
  { internal: "linkedin", smsActivate: "li", fiveSim: "linkedin", displayName: "LinkedIn" },
]

export function getServiceMapping(internalCode: string): ServiceMapping | undefined {
  return SERVICE_MAPPINGS.find((m) => m.internal === internalCode)
}

export function getSmsActivateCode(internalCode: string): string | undefined {
  return getServiceMapping(internalCode)?.smsActivate
}

export function getFiveSimCode(internalCode: string): string | undefined {
  return getServiceMapping(internalCode)?.fiveSim
}

export function getInternalCodeFromSmsActivate(smsActivateCode: string): string | undefined {
  return SERVICE_MAPPINGS.find((m) => m.smsActivate === smsActivateCode)?.internal
}

export function getInternalCodeFromFiveSim(fiveSimCode: string): string | undefined {
  return SERVICE_MAPPINGS.find((m) => m.fiveSim === fiveSimCode)?.internal
}

export function isExperimentalService(internalCode: string): boolean {
  return getServiceMapping(internalCode)?.isExperimental === true
}

export function getExperimentalServices(): ServiceMapping[] {
  return SERVICE_MAPPINGS.filter((m) => m.isExperimental)
}
