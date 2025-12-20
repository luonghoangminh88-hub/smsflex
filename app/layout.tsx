import type React from "react"
import type { Metadata } from "next"
import { Be_Vietnam_Pro, Inter } from "next/font/google"
import { Analytics } from "@vercel/analytics/next"
import { Toaster } from "@/components/ui/toaster"
import "./globals.css"

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["vietnamese", "latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-be-vietnam-pro",
  display: "swap",
})

const inter = Inter({
  subsets: ["vietnamese", "latin"],
  variable: "--font-inter",
  display: "swap",
})

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
      <body className={`${beVietnamPro.variable} ${inter.variable} font-sans antialiased`}>
        {children}
        <Analytics />
        <Toaster />
      </body>
    </html>
  )
}
