import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "OTP Rental - Thuê SIM ảo nhận OTP nhanh trong 30 giây | Giá từ 2,000đ",
  description:
    "Giải pháp thuê SIM ảo số 1 Việt Nam. Hỗ trợ 200+ dịch vụ (Telegram, Facebook, Instagram, WhatsApp), 50+ quốc gia. Nhận OTP trong 30 giây, giá từ 2,000đ. Hoàn tiền tự động nếu không nhận được OTP.",
  keywords: "thuê sim ảo, nhận otp, số điện thoại ảo, otp rental, telegram otp, facebook otp, sim ảo việt nam",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="vi">
      <body className={`font-sans antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
