"use client"

import { Button } from "@/components/ui/button"
import { Globe } from "lucide-react"
import { useState, useEffect } from "react"
import type { Locale } from "@/lib/i18n"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"

export function LanguageSwitcher() {
  const [locale, setLocale] = useState<Locale>("vi")

  useEffect(() => {
    const saved = localStorage.getItem("locale") as Locale
    if (saved) setLocale(saved)
  }, [])

  const handleChange = (newLocale: Locale) => {
    setLocale(newLocale)
    localStorage.setItem("locale", newLocale)
    window.dispatchEvent(new CustomEvent("localeChange", { detail: newLocale }))
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-9 w-9">
          <Globe className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => handleChange("vi")} className={locale === "vi" ? "bg-accent" : ""}>
          <span className="mr-2">🇻🇳</span>
          Tiếng Việt
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleChange("en")} className={locale === "en" ? "bg-accent" : ""}>
          <span className="mr-2">🇬🇧</span>
          English
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
