"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Activity, Clock, TrendingUp, AlertTriangle, CheckCircle2, XCircle, RefreshCw } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ProviderHealth {
  provider: string
  status: "healthy" | "degraded" | "unavailable"
  success_rate: number
  avg_response_time_ms: number
  total_requests: number
  successful_requests: number
  failed_requests: number
  last_success_at: string | null
  last_failure_at: string | null
  last_checked_at: string
}

interface RecentRequest {
  id: string
  provider: string
  request_type: string
  success: boolean
  response_time_ms: number
  error_message: string | null
  created_at: string
}

export default function ProviderHealthPage() {
  const [healthData, setHealthData] = useState<ProviderHealth[]>([])
  const [recentRequests, setRecentRequests] = useState<RecentRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    fetchData()
    const interval = setInterval(fetchData, 30000) // Refresh every 30s
    return () => clearInterval(interval)
  }, [])

  const fetchData = async () => {
    try {
      const [healthRes, requestsRes] = await Promise.all([
        fetch("/api/admin/provider-health"),
        fetch("/api/admin/provider-health/requests?limit=20"),
      ])

      if (healthRes.ok) {
        const healthData = await healthRes.json()
        setHealthData(healthData.providers || [])
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        setRecentRequests(requestsData.requests || [])
      }
    } catch (error) {
      console.error("Error fetching provider health:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "healthy":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />
      case "degraded":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />
      case "unavailable":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Activity className="h-5 w-5" />
    }
  }

  const getStatusBadge = (status: string) => {
    const config = {
      healthy: { label: "Khỏe mạnh", variant: "default" as const },
      degraded: { label: "Suy giảm", variant: "secondary" as const },
      unavailable: { label: "Không khả dụng", variant: "destructive" as const },
    }
    return config[status as keyof typeof config] || config.healthy
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="p-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Provider Health Monitor</h1>
          <p className="text-muted-foreground mt-2">Theo dõi tình trạng và hiệu suất nhà cung cấp</p>
        </div>
        <Button onClick={handleRefresh} disabled={refreshing} variant="outline">
          <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
          Làm mới
        </Button>
      </div>

      {/* Provider Health Cards */}
      <div className="grid gap-6 md:grid-cols-2">
        {healthData.map((provider) => (
          <Card key={provider.provider} className="relative overflow-hidden">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {getStatusIcon(provider.status)}
                  <CardTitle className="capitalize">{provider.provider}</CardTitle>
                </div>
                <Badge variant={getStatusBadge(provider.status).variant}>{getStatusBadge(provider.status).label}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Success Rate */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Tỷ lệ thành công</span>
                  <span className="text-sm font-bold">{provider.success_rate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-800 rounded-full h-2.5">
                  <div
                    className={`h-2.5 rounded-full ${
                      provider.success_rate >= 95
                        ? "bg-green-500"
                        : provider.success_rate >= 80
                          ? "bg-yellow-500"
                          : "bg-red-500"
                    }`}
                    style={{ width: `${provider.success_rate}%` }}
                  />
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    Thời gian phản hồi TB
                  </p>
                  <p className="text-lg font-semibold">{provider.avg_response_time_ms}ms</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <TrendingUp className="h-3 w-3" />
                    Tổng requests
                  </p>
                  <p className="text-lg font-semibold">{provider.total_requests}</p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Thành công</p>
                  <p className="text-sm font-medium text-green-600 dark:text-green-400">
                    {provider.successful_requests}
                  </p>
                </div>

                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Thất bại</p>
                  <p className="text-sm font-medium text-red-600 dark:text-red-400">{provider.failed_requests}</p>
                </div>
              </div>

              {/* Last Activity */}
              <div className="pt-3 border-t space-y-1">
                {provider.last_success_at && (
                  <p className="text-xs text-muted-foreground">
                    Thành công gần nhất: {new Date(provider.last_success_at).toLocaleString("vi-VN")}
                  </p>
                )}
                {provider.last_failure_at && (
                  <p className="text-xs text-red-600 dark:text-red-400">
                    Lỗi gần nhất: {new Date(provider.last_failure_at).toLocaleString("vi-VN")}
                  </p>
                )}
                <p className="text-xs text-muted-foreground">
                  Kiểm tra lần cuối: {new Date(provider.last_checked_at).toLocaleString("vi-VN")}
                </p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Alerts */}
      {healthData.some((p) => p.status !== "healthy") && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            Một số provider đang gặp vấn đề. Hệ thống sẽ tự động failover sang provider khả dụng.
          </AlertDescription>
        </Alert>
      )}

      {/* Recent Requests */}
      <Card>
        <CardHeader>
          <CardTitle>Requests gần đây</CardTitle>
          <CardDescription>20 API requests mới nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentRequests.map((request) => (
              <div
                key={request.id}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  request.success ? "border-green-200 dark:border-green-900" : "border-red-200 dark:border-red-900"
                }`}
              >
                <div className="flex items-center gap-3">
                  {request.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-4 w-4 text-red-500 flex-shrink-0" />
                  )}
                  <div>
                    <p className="text-sm font-medium capitalize">
                      {request.provider} - {request.request_type.replace("_", " ")}
                    </p>
                    {request.error_message && (
                      <p className="text-xs text-red-600 dark:text-red-400">{request.error_message}</p>
                    )}
                    <p className="text-xs text-muted-foreground">
                      {new Date(request.created_at).toLocaleString("vi-VN")}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge variant={request.success ? "default" : "destructive"}>{request.response_time_ms}ms</Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
