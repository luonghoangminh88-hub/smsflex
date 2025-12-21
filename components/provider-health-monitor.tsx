"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertCircle, CheckCircle2, XCircle, Activity } from "lucide-react"

interface ProviderHealth {
  name: string
  status: "healthy" | "degraded" | "down"
  successRate: number
  avgResponseTime: number
  lastChecked: string
}

export function ProviderHealthMonitor() {
  const [providers, setProviders] = useState<ProviderHealth[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchHealth = async () => {
      try {
        const response = await fetch("/api/admin/provider-health")
        const data = await response.json()
        setProviders(data.providers || [])
      } catch (error) {
        console.error("[v0] Error fetching provider health:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchHealth()
    const interval = setInterval(fetchHealth, 30000) // Refresh every 30s

    return () => clearInterval(interval)
  }, [])

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Đang tải trạng thái...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {providers.map((provider) => (
        <Card key={provider.name} className="border-2">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    provider.status === "healthy"
                      ? "bg-green-100 dark:bg-green-950"
                      : provider.status === "degraded"
                        ? "bg-yellow-100 dark:bg-yellow-950"
                        : "bg-red-100 dark:bg-red-950"
                  }`}
                >
                  {provider.status === "healthy" && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                  {provider.status === "degraded" && <AlertCircle className="h-5 w-5 text-yellow-600" />}
                  {provider.status === "down" && <XCircle className="h-5 w-5 text-red-600" />}
                </div>
                <div>
                  <h3 className="font-bold">{provider.name}</h3>
                  <p className="text-xs text-muted-foreground">Cập nhật: {provider.lastChecked}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Tỷ lệ thành công</div>
                  <div className="font-bold text-lg">{(provider.successRate * 100).toFixed(1)}%</div>
                </div>
                <div className="text-right">
                  <div className="text-xs text-muted-foreground">Thời gian phản hồi</div>
                  <div className="font-bold text-lg">{provider.avgResponseTime}ms</div>
                </div>
                <Badge
                  variant={
                    provider.status === "healthy"
                      ? "default"
                      : provider.status === "degraded"
                        ? "secondary"
                        : "destructive"
                  }
                  className="gap-2"
                >
                  <Activity className="h-3 w-3" />
                  {provider.status === "healthy"
                    ? "Hoạt động tốt"
                    : provider.status === "degraded"
                      ? "Giảm hiệu suất"
                      : "Ngừng hoạt động"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
