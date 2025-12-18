"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CheckCircle, Clock } from "lucide-react"

interface CountryCardProps {
  name: string
  code: string
  flagEmoji?: string
  isSelected: boolean
  averageTime?: number
  stockCount?: number
  onClick: () => void
}

export function CountryCardEnhanced({
  name,
  code,
  flagEmoji,
  isSelected,
  averageTime = 30,
  stockCount = 0,
  onClick,
}: CountryCardProps) {
  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-lg hover:scale-[1.02] relative ${
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

      <CardContent className="p-4 space-y-2">
        {/* Flag & Name */}
        <div className="flex items-center gap-2">
          <span className="text-2xl">{flagEmoji || "🌐"}</span>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{name}</p>
            <p className="text-xs text-muted-foreground uppercase">{code}</p>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-3 w-3" />
            <span>~{averageTime}s</span>
          </div>
          {stockCount > 0 && (
            <Badge variant="secondary" className="text-xs h-5">
              {stockCount} số
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
