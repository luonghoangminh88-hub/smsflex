"use client"

import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle, TrendingUp, Users, Info } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { getServiceLogo, getServiceIcon } from "@/lib/service-icons"
import { useState } from "react"

interface ServiceCardProps {
  name: string
  code: string
  iconUrl?: string | null
  isSelected: boolean
  successRate?: number
  activeUsers?: number
  isExperimental?: boolean
  onClick: () => void
}

export function ServiceCardEnhanced({
  name,
  code,
  iconUrl,
  isSelected,
  successRate = 98,
  activeUsers = 0,
  isExperimental = false,
  onClick,
}: ServiceCardProps) {
  const [imageError, setImageError] = useState(false)
  const FallbackIcon = getServiceIcon(name)

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] group relative ${
        isSelected ? "border-2 border-primary bg-primary/5 shadow-md" : "border hover:border-primary/50"
      }`}
      onClick={onClick}
    >
      {isSelected && (
        <div className="absolute -top-2 -right-2 z-10">
          <div className="bg-primary rounded-full p-1">
            <CheckCircle className="h-4 w-4 text-primary-foreground" />
          </div>
        </div>
      )}

      <CardContent className="p-4 space-y-3">
        {/* Service Icon & Name */}
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-blue-100 to-indigo-100 dark:from-blue-900/30 dark:to-indigo-900/30 flex items-center justify-center">
            {!imageError ? (
              <Image
                src={getServiceLogo(name) || iconUrl || "/placeholder.svg"}
                alt={name}
                width={24}
                height={24}
                className="rounded"
                onError={() => setImageError(true)}
                unoptimized
              />
            ) : (
              <FallbackIcon className="h-5 w-5 text-primary" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{name}</p>
            <p className="text-xs text-muted-foreground uppercase">{code}</p>
          </div>
        </div>

        {isExperimental && (
          <Badge variant="secondary" className="text-[10px] h-5 gap-1">
            <Info className="h-3 w-3" />
            Thử nghiệm
          </Badge>
        )}

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
            <TrendingUp className="h-3 w-3" />
            <span className="font-medium">{successRate}%</span>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Users className="h-3 w-3" />
            <span>{activeUsers}+ đang dùng</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
