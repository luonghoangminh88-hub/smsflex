/**
 * Country code mapping for SMS providers
 * Maps internal country codes to provider-specific codes
 */

export interface CountryMapping {
  internal: string
  iso2: string // ISO 3166-1 alpha-2
  smsActivate: number // SMS-Activate uses numeric codes
  fiveSim: string // 5sim uses lowercase country names
  displayName: string
}

export const COUNTRY_MAPPINGS: CountryMapping[] = [
  // Popular countries in database
  { internal: "vn", iso2: "VN", smsActivate: 10, fiveSim: "vietnam", displayName: "Vietnam" },
  { internal: "cn", iso2: "CN", smsActivate: 3, fiveSim: "china", displayName: "China" },
  { internal: "in", iso2: "IN", smsActivate: 22, fiveSim: "india", displayName: "India" },
  { internal: "id", iso2: "ID", smsActivate: 6, fiveSim: "indonesia", displayName: "Indonesia" },
  { internal: "my", iso2: "MY", smsActivate: 7, fiveSim: "malaysia", displayName: "Malaysia" },
  { internal: "ph", iso2: "PH", smsActivate: 4, fiveSim: "philippines", displayName: "Philippines" },
  { internal: "sg", iso2: "SG", smsActivate: 18, fiveSim: "singapore", displayName: "Singapore" },
  { internal: "th", iso2: "TH", smsActivate: 52, fiveSim: "thailand", displayName: "Thailand" },
  { internal: "uk", iso2: "GB", smsActivate: 16, fiveSim: "england", displayName: "United Kingdom" },
  { internal: "us", iso2: "US", smsActivate: 12, fiveSim: "usa", displayName: "United States" },

  // Additional countries
  { internal: "ru", iso2: "RU", smsActivate: 0, fiveSim: "russia", displayName: "Russia" },
  { internal: "ua", iso2: "UA", smsActivate: 1, fiveSim: "ukraine", displayName: "Ukraine" },
  { internal: "kz", iso2: "KZ", smsActivate: 2, fiveSim: "kazakhstan", displayName: "Kazakhstan" },
  { internal: "mm", iso2: "MM", smsActivate: 5, fiveSim: "myanmar", displayName: "Myanmar" },
  { internal: "ke", iso2: "KE", smsActivate: 8, fiveSim: "kenya", displayName: "Kenya" },
  { internal: "tz", iso2: "TZ", smsActivate: 9, fiveSim: "tanzania", displayName: "Tanzania" },
  { internal: "ng", iso2: "NG", smsActivate: 11, fiveSim: "nigeria", displayName: "Nigeria" },
  { internal: "eg", iso2: "EG", smsActivate: 21, fiveSim: "egypt", displayName: "Egypt" },
  { internal: "za", iso2: "ZA", smsActivate: 31, fiveSim: "southafrica", displayName: "South Africa" },
  { internal: "ro", iso2: "RO", smsActivate: 32, fiveSim: "romania", displayName: "Romania" },
  { internal: "co", iso2: "CO", smsActivate: 33, fiveSim: "colombia", displayName: "Colombia" },
  { internal: "ee", iso2: "EE", smsActivate: 34, fiveSim: "estonia", displayName: "Estonia" },
  { internal: "az", iso2: "AZ", smsActivate: 35, fiveSim: "azerbaijan", displayName: "Azerbaijan" },
  { internal: "ca", iso2: "CA", smsActivate: 36, fiveSim: "canada", displayName: "Canada" },
  { internal: "ma", iso2: "MA", smsActivate: 37, fiveSim: "morocco", displayName: "Morocco" },
  { internal: "gh", iso2: "GH", smsActivate: 38, fiveSim: "ghana", displayName: "Ghana" },
  { internal: "ar", iso2: "AR", smsActivate: 39, fiveSim: "argentina", displayName: "Argentina" },
  { internal: "uz", iso2: "UZ", smsActivate: 40, fiveSim: "uzbekistan", displayName: "Uzbekistan" },
  { internal: "cm", iso2: "CM", smsActivate: 41, fiveSim: "cameroon", displayName: "Cameroon" },
  { internal: "td", iso2: "TD", smsActivate: 42, fiveSim: "chad", displayName: "Chad" },
  { internal: "de", iso2: "DE", smsActivate: 43, fiveSim: "germany", displayName: "Germany" },
  { internal: "lt", iso2: "LT", smsActivate: 44, fiveSim: "lithuania", displayName: "Lithuania" },
  { internal: "hr", iso2: "HR", smsActivate: 45, fiveSim: "croatia", displayName: "Croatia" },
  { internal: "se", iso2: "SE", smsActivate: 46, fiveSim: "sweden", displayName: "Sweden" },
  { internal: "iq", iso2: "IQ", smsActivate: 47, fiveSim: "iraq", displayName: "Iraq" },
  { internal: "nl", iso2: "NL", smsActivate: 48, fiveSim: "netherlands", displayName: "Netherlands" },
  { internal: "lv", iso2: "LV", smsActivate: 49, fiveSim: "latvia", displayName: "Latvia" },
  { internal: "at", iso2: "AT", smsActivate: 50, fiveSim: "austria", displayName: "Austria" },
  { internal: "by", iso2: "BY", smsActivate: 51, fiveSim: "belarus", displayName: "Belarus" },
  { internal: "sa", iso2: "SA", smsActivate: 53, fiveSim: "saudiarabia", displayName: "Saudi Arabia" },
  { internal: "mx", iso2: "MX", smsActivate: 54, fiveSim: "mexico", displayName: "Mexico" },
  { internal: "tw", iso2: "TW", smsActivate: 55, fiveSim: "taiwan", displayName: "Taiwan" },
  { internal: "es", iso2: "ES", smsActivate: 56, fiveSim: "spain", displayName: "Spain" },
  { internal: "ir", iso2: "IR", smsActivate: 57, fiveSim: "iran", displayName: "Iran" },
  { internal: "dz", iso2: "DZ", smsActivate: 58, fiveSim: "algeria", displayName: "Algeria" },
  { internal: "si", iso2: "SI", smsActivate: 59, fiveSim: "slovenia", displayName: "Slovenia" },
  { internal: "bd", iso2: "BD", smsActivate: 60, fiveSim: "bangladesh", displayName: "Bangladesh" },
  { internal: "sn", iso2: "SN", smsActivate: 61, fiveSim: "senegal", displayName: "Senegal" },
  { internal: "tr", iso2: "TR", smsActivate: 62, fiveSim: "turkey", displayName: "Turkey" },
  { internal: "cz", iso2: "CZ", smsActivate: 63, fiveSim: "czech", displayName: "Czech Republic" },
  { internal: "lk", iso2: "LK", smsActivate: 64, fiveSim: "srilanka", displayName: "Sri Lanka" },
  { internal: "pe", iso2: "PE", smsActivate: 65, fiveSim: "peru", displayName: "Peru" },
  { internal: "pk", iso2: "PK", smsActivate: 66, fiveSim: "pakistan", displayName: "Pakistan" },
  { internal: "il", iso2: "IL", smsActivate: 67, fiveSim: "israel", displayName: "Israel" },
  { internal: "fi", iso2: "FI", smsActivate: 68, fiveSim: "finland", displayName: "Finland" },
  { internal: "pl", iso2: "PL", smsActivate: 69, fiveSim: "poland", displayName: "Poland" },
  { internal: "gb", iso2: "GB", smsActivate: 16, fiveSim: "england", displayName: "United Kingdom" },
  { internal: "hk", iso2: "HK", smsActivate: 14, fiveSim: "hongkong", displayName: "Hong Kong" },
  { internal: "la", iso2: "LA", smsActivate: 25, fiveSim: "laos", displayName: "Laos" },
  { internal: "br", iso2: "BR", smsActivate: 73, fiveSim: "brazil", displayName: "Brazil" },
]

export function getCountryMapping(internalCode: string): CountryMapping | undefined {
  return COUNTRY_MAPPINGS.find((m) => m.internal === internalCode)
}

export function getSmsActivateCountryCode(internalCode: string): number | undefined {
  return getCountryMapping(internalCode)?.smsActivate
}

export function getFiveSimCountryCode(internalCode: string): string | undefined {
  return getCountryMapping(internalCode)?.fiveSim
}

export function getCountryDisplayName(internalCode: string): string {
  return getCountryMapping(internalCode)?.displayName || internalCode.toUpperCase()
}
