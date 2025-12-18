import {
  MessageCircle,
  Send,
  Mail,
  ShoppingCart,
  CreditCard,
  Car,
  Music,
  Gamepad2,
  Video,
  Users,
  Building2,
  Smartphone,
  Tv,
  Bot,
  Sparkles,
} from "lucide-react"

// Service icon mapping with multiple fallback strategies
export const getServiceLogo = (serviceName: string): string => {
  const normalized = serviceName.toLowerCase().replace(/\s+/g, "").replace(/[/\\]/g, "")

  // Map of reliable logo URLs
  const logoUrls: Record<string, string> = {
    telegram: "/images/icons8-telegram-app-50.png",
    whatsapp: "/images/icons8-whatsapp-50.png",
    facebook: "/images/icons8-facebook-50.png",
    instagram: "/images/icons8-instagram-50.png",
    twitter: "/images/icons8-twitter-circled-50.png",
    twitterx: "/images/icons8-x-50.png",
    x: "/images/icons8-x-50.png",
    tiktok: "/images/icons8-tiktok-50.png",
    wechat: "/images/icons8-wechat-50.png",
    weixin: "/images/icons8-wechat-50.png",
    viber: "/images/icons8-viber-50.png",
    google: "/images/icons8-gmail-50.png",
    gmail: "/images/icons8-gmail-50.png",

    zalo: "/images/zalo.jpg",

    grab: "/images/grab-logo.png",
    xanhsm: "/images/xanh-sm.webp",
    xanhsmtaxi: "/images/xanh-sm.webp",

    fptplay: "/images/fpt-play.webp",
    netflix: "/images/netflix-logo.jpg",

    claude: "/images/icons8-claude-ai-48.png",
    claudeai: "/images/icons8-claude-ai-48.png",
    chatgpt: "/images/icons8-chatgpt-50.png",
    openai: "/images/icons8-chatgpt-50.png",
    gemini: "/images/gemini-ai-48.png",
    geminiai: "/images/gemini-ai-48.png",

    shopee: "/images/icons8-shopee-48.png",
    lazada: "/images/icons8-lazada-100.png",

    // Fallback to Clearbit for other services
    microsoft: "https://logo.clearbit.com/microsoft.com",
    amazon: "https://logo.clearbit.com/amazon.com",
    apple: "https://logo.clearbit.com/apple.com",
    discord: "https://logo.clearbit.com/discord.com",
    snapchat: "https://logo.clearbit.com/snapchat.com",
    linkedin: "https://logo.clearbit.com/linkedin.com",
    uber: "https://logo.clearbit.com/uber.com",
    spotify: "https://logo.clearbit.com/spotify.com",
    airbnb: "https://logo.clearbit.com/airbnb.com",
    alibaba: "https://logo.clearbit.com/alibaba.com",
    line: "https://logo.clearbit.com/line.me",
    qq: "https://logo.clearbit.com/qq.com",
    baidu: "https://logo.clearbit.com/baidu.com",
    taobao: "https://logo.clearbit.com/taobao.com",
    alipay: "https://logo.clearbit.com/alipay.com",
    wework: "https://logo.clearbit.com/wework.com",
    zoom: "https://logo.clearbit.com/zoom.us",
    skype: "https://logo.clearbit.com/skype.com",
    slack: "https://logo.clearbit.com/slack.com",
    reddit: "https://logo.clearbit.com/reddit.com",
    pinterest: "https://logo.clearbit.com/pinterest.com",
    tumblr: "https://logo.clearbit.com/tumblr.com",
    twitch: "https://logo.clearbit.com/twitch.tv",
    paypal: "https://logo.clearbit.com/paypal.com",
    ebay: "https://logo.clearbit.com/ebay.com",
    steam: "https://logo.clearbit.com/steampowered.com",
    epic: "https://logo.clearbit.com/epicgames.com",
    epicgames: "https://logo.clearbit.com/epicgames.com",
    blizzard: "https://logo.clearbit.com/blizzard.com",
    riot: "https://logo.clearbit.com/riotgames.com",
    riotgames: "https://logo.clearbit.com/riotgames.com",
    shopify: "https://logo.clearbit.com/shopify.com",
    etsy: "https://logo.clearbit.com/etsy.com",
    zillow: "https://logo.clearbit.com/zillow.com",
    airasia: "https://logo.clearbit.com/airasia.com",
    gojek: "https://logo.clearbit.com/gojek.com",
    binance: "https://logo.clearbit.com/binance.com",
    coinbase: "https://logo.clearbit.com/coinbase.com",
    kraken: "https://logo.clearbit.com/kraken.com",
    okx: "https://logo.clearbit.com/okx.com",
    yahoo: "https://logo.clearbit.com/yahoo.com",
    outlook: "https://logo.clearbit.com/outlook.com",
    yandex: "https://logo.clearbit.com/yandex.com",
    mailru: "https://logo.clearbit.com/mail.ru",
  }

  if (logoUrls[normalized]) {
    return logoUrls[normalized]
  }

  // Fallback to placeholder with service name
  return `/placeholder.svg?height=32&width=32&query=${encodeURIComponent(serviceName + " logo")}`
}

export const getCountryFlag = (countryCode: string): string => {
  const flags: Record<string, string> = {
    // Asia
    vn: "🇻🇳",
    cn: "🇨🇳",
    jp: "🇯🇵",
    kr: "🇰🇷",
    th: "🇹🇭",
    id: "🇮🇩",
    ph: "🇵🇭",
    my: "🇲🇾",
    sg: "🇸🇬",
    in: "🇮🇳",
    kh: "🇰🇭",
    la: "🇱🇦",
    mm: "🇲🇲",
    bd: "🇧🇩",
    pk: "🇵🇰",
    lk: "🇱🇰",
    np: "🇳🇵",
    mn: "🇲🇳",
    kz: "🇰🇿",
    uz: "🇺🇿",

    // Americas
    us: "🇺🇸",
    ca: "🇨🇦",
    br: "🇧🇷",
    mx: "🇲🇽",
    ar: "🇦🇷",
    cl: "🇨🇱",
    co: "🇨🇴",
    pe: "🇵🇪",
    ve: "🇻🇪",
    ec: "🇪🇨",

    // Europe
    gb: "🇬🇧",
    uk: "🇬🇧",
    de: "🇩🇪",
    fr: "🇫🇷",
    es: "🇪🇸",
    it: "🇮🇹",
    nl: "🇳🇱",
    be: "🇧🇪",
    se: "🇸🇪",
    no: "🇳🇴",
    dk: "🇩🇰",
    fi: "🇫🇮",
    pl: "🇵🇱",
    ua: "🇺🇦",
    pt: "🇵🇹",
    gr: "🇬🇷",
    cz: "🇨🇿",
    ro: "🇷🇴",
    hu: "🇭🇺",
    at: "🇦🇹",
    ch: "🇨🇭",
    ru: "🇷🇺",
    tr: "🇹🇷",
    ie: "🇮🇪",
    bg: "🇧🇬",
    hr: "🇭🇷",
    rs: "🇷🇸",
    sk: "🇸🇰",
    si: "🇸🇮",
    lt: "🇱🇹",
    lv: "🇱🇻",
    ee: "🇪🇪",

    // Middle East & Africa
    sa: "🇸🇦",
    ae: "🇦🇪",
    eg: "🇪🇬",
    za: "🇿🇦",
    ng: "🇳🇬",
    ke: "🇰🇪",
    il: "🇮🇱",
    qa: "🇶🇦",
    kw: "🇰🇼",
    om: "🇴🇲",
    bh: "🇧🇭",
    jo: "🇯🇴",
    lb: "🇱🇧",
    ma: "🇲🇦",
    tn: "🇹🇳",
    dz: "🇩🇿",

    // Oceania
    au: "🇦🇺",
    nz: "🇳🇿",
  }

  return flags[countryCode.toLowerCase()] || "🌐"
}

export const getCountryFlagUrl = (countryCode: string): string => {
  return `https://flagcdn.com/w40/${countryCode.toLowerCase()}.png`
}

export const getServiceIcon = (serviceName: string) => {
  const normalized = serviceName.toLowerCase().replace(/\s+/g, "")

  const iconMap: Record<string, typeof MessageCircle> = {
    telegram: Send,
    whatsapp: MessageCircle,
    facebook: Users,
    instagram: Users,
    twitter: MessageCircle,
    twitterx: MessageCircle,
    x: MessageCircle,
    discord: MessageCircle,
    viber: MessageCircle,
    wechat: MessageCircle,
    zalo: MessageCircle,
    line: MessageCircle,
    google: Mail,
    microsoft: Mail,
    yahoo: Mail,
    outlook: Mail,
    amazon: ShoppingCart,
    ebay: ShoppingCart,
    shopee: ShoppingCart,
    lazada: ShoppingCart,
    alibaba: ShoppingCart,
    taobao: ShoppingCart,
    shopify: ShoppingCart,
    etsy: ShoppingCart,
    paypal: CreditCard,
    alipay: CreditCard,
    stripe: CreditCard,
    uber: Car,
    grab: Car,
    xanhsm: Car,
    xanhsmtaxi: Car,
    gojek: Car,
    spotify: Music,
    netflix: Tv,
    fptplay: Tv,
    steam: Gamepad2,
    epic: Gamepad2,
    epicgames: Gamepad2,
    zoom: Video,
    skype: Video,
    linkedin: Building2,
    claude: Bot,
    claudeai: Bot,
    chatgpt: Bot,
    openai: Bot,
    gemini: Sparkles,
    geminiai: Sparkles,
  }

  return iconMap[normalized] || Smartphone
}
