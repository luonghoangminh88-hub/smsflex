"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Loader2, Save, SettingsIcon, DollarSign, TrendingUp, Zap, Percent } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface SystemSetting {
  id: string
  key: string
  value: any
  description: string
  category: string
}

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSetting[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profitMargin, setProfitMargin] = useState("")

  const [freePriceEnabled, setFreePriceEnabled] = useState(false)
  const [freePriceMaxDiscount, setFreePriceMaxDiscount] = useState("15")
  const [freePriceAutoSelect, setFreePriceAutoSelect] = useState(true)

  const { toast } = useToast()

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch("/api/admin/settings")
      if (!res.ok) throw new Error("Failed to fetch settings")
      const data = await res.json()
      setSettings(data.settings)

      const margin = data.settings.find((s: SystemSetting) => s.key === "profit_margin_percentage")
      if (margin) {
        setProfitMargin(String(margin.value))
      }

      const freePrice = data.settings.find((s: SystemSetting) => s.key === "freeprice_enabled")
      if (freePrice) {
        setFreePriceEnabled(freePrice.value === "true")
      }

      const maxDiscount = data.settings.find((s: SystemSetting) => s.key === "freeprice_max_discount")
      if (maxDiscount) {
        setFreePriceMaxDiscount(String(maxDiscount.value))
      }

      const autoSelect = data.settings.find((s: SystemSetting) => s.key === "freeprice_auto_select")
      if (autoSelect) {
        setFreePriceAutoSelect(autoSelect.value === "true")
      }
    } catch (error) {
      console.error("[v0] Error fetching settings:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải cài đặt",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSaveProfitMargin = async () => {
    const marginValue = Number(profitMargin)

    if (isNaN(marginValue) || marginValue < 10 || marginValue > 50) {
      toast({
        title: "Lỗi",
        description: "Tỷ lệ lợi nhuận phải từ 10% đến 50%",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          key: "profit_margin_percentage",
          value: marginValue,
        }),
      })

      if (!res.ok) throw new Error("Failed to update setting")

      toast({
        title: "Thành công",
        description: "Đã cập nhật tỷ lệ lợi nhuận. Hãy sync giá để áp dụng!",
      })

      fetchSettings()
    } catch (error) {
      console.error("[v0] Error saving profit margin:", error)
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSyncPrices = async () => {
    setSaving(true)
    try {
      const res = await fetch("/api/admin/sync-prices", {
        method: "POST",
      })

      if (!res.ok) throw new Error("Failed to sync prices")

      const data = await res.json()

      toast({
        title: "Đồng bộ thành công",
        description: `Đã cập nhật ${data.updated} và tạo mới ${data.created} giá với margin ${data.profitMarginPercentage}%. ${data.freePriceEnabled ? `FreePrice: ${data.freePriceCount} services` : ""}`,
      })
    } catch (error) {
      console.error("[v0] Error syncing prices:", error)
      toast({
        title: "Lỗi",
        description: "Không thể đồng bộ giá",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSaveFreePriceSettings = async () => {
    setSaving(true)
    try {
      await Promise.all([
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "freeprice_enabled",
            value: freePriceEnabled ? "true" : "false",
          }),
        }),
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "freeprice_max_discount",
            value: freePriceMaxDiscount,
          }),
        }),
        fetch("/api/admin/settings", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            key: "freeprice_auto_select",
            value: freePriceAutoSelect ? "true" : "false",
          }),
        }),
      ])

      toast({
        title: "Thành công",
        description: "Đã cập nhật cài đặt FreePrice. Hãy sync giá để áp dụng!",
      })

      fetchSettings()
    } catch (error) {
      console.error("[v0] Error saving FreePrice settings:", error)
      toast({
        title: "Lỗi",
        description: "Không thể lưu cài đặt",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  const currentMargin = Number(profitMargin) || 20
  const minMargin = settings.find((s) => s.key === "min_profit_margin")?.value || 10
  const maxMargin = settings.find((s) => s.key === "max_profit_margin")?.value || 50

  return (
    <div className="p-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Cài đặt hệ thống</h1>
        <p className="text-muted-foreground mt-2">Quản lý cấu hình và thông số hệ thống</p>
      </div>

      <Tabs defaultValue="pricing" className="space-y-6">
        <TabsList>
          <TabsTrigger value="pricing">
            <DollarSign className="mr-2 h-4 w-4" />
            Giá & Lợi nhuận
          </TabsTrigger>
          <TabsTrigger value="freeprice">
            <Zap className="mr-2 h-4 w-4" />
            FreePrice
          </TabsTrigger>
          <TabsTrigger value="all">
            <SettingsIcon className="mr-2 h-4 w-4" />
            Tất cả
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pricing" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Profit Margin Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Tỷ lệ lợi nhuận
                </CardTitle>
                <CardDescription>Cấu hình % lợi nhuận trên giá gốc từ nhà cung cấp</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <TrendingUp className="h-4 w-4" />
                  <AlertDescription>
                    Tỷ lệ hiện tại: <strong>{currentMargin}%</strong>
                    <br />
                    Ví dụ: Giá gốc 1,000đ → Giá bán{" "}
                    <strong>{(1000 * (1 + currentMargin / 100)).toLocaleString("vi-VN")}đ</strong>
                  </AlertDescription>
                </Alert>

                <div className="space-y-2">
                  <Label htmlFor="profit-margin">Tỷ lệ lợi nhuận (%)</Label>
                  <Input
                    id="profit-margin"
                    type="number"
                    min={minMargin}
                    max={maxMargin}
                    value={profitMargin}
                    onChange={(e) => setProfitMargin(e.target.value)}
                    placeholder="20"
                  />
                  <p className="text-xs text-muted-foreground">
                    Cho phép từ {minMargin}% đến {maxMargin}%
                  </p>
                </div>

                <Button onClick={handleSaveProfitMargin} disabled={saving} className="w-full">
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu cài đặt
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Price Sync */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <SettingsIcon className="h-5 w-5" />
                  Đồng bộ giá
                </CardTitle>
                <CardDescription>Cập nhật giá từ nhà cung cấp SMS-Activate</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <AlertDescription>
                    Sau khi thay đổi tỷ lệ lợi nhuận hoặc FreePrice, bạn cần đồng bộ lại giá để áp dụng cấu hình mới.
                  </AlertDescription>
                </Alert>

                <Button
                  onClick={handleSyncPrices}
                  disabled={saving}
                  variant="outline"
                  className="w-full bg-transparent"
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Đang đồng bộ...
                    </>
                  ) : (
                    <>
                      <TrendingUp className="mr-2 h-4 w-4" />
                      Đồng bộ giá ngay
                    </>
                  )}
                </Button>

                <p className="text-xs text-muted-foreground">
                  Thao tác này sẽ cập nhật giá và FreePrice cho tất cả dịch vụ
                </p>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="freeprice" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-yellow-500" />
                FreePrice - Giá động tối ưu
              </CardTitle>
              <CardDescription>Tự động chọn giá tốt nhất từ thị trường, tiết kiệm trung bình 15%</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <Percent className="h-4 w-4" />
                <AlertDescription>
                  FreePrice giúp mua số với giá thấp hơn thông qua cơ chế đấu giá động. Hệ thống tự động chọn giá tốt
                  nhất có sẵn.
                </AlertDescription>
              </Alert>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Bật FreePrice</Label>
                  <p className="text-sm text-muted-foreground">Sử dụng giá động để tiết kiệm chi phí</p>
                </div>
                <Switch checked={freePriceEnabled} onCheckedChange={setFreePriceEnabled} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-discount">Giảm giá tối đa (%)</Label>
                <Input
                  id="max-discount"
                  type="number"
                  min="5"
                  max="25"
                  value={freePriceMaxDiscount}
                  onChange={(e) => setFreePriceMaxDiscount(e.target.value)}
                  disabled={!freePriceEnabled}
                />
                <p className="text-xs text-muted-foreground">Phần trăm giảm giá tối đa được chấp nhận (5-25%)</p>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Tự động chọn giá tốt nhất</Label>
                  <p className="text-sm text-muted-foreground">Hệ thống tự chọn giá FreePrice tối ưu</p>
                </div>
                <Switch
                  checked={freePriceAutoSelect}
                  onCheckedChange={setFreePriceAutoSelect}
                  disabled={!freePriceEnabled}
                />
              </div>

              <Button onClick={handleSaveFreePriceSettings} disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Lưu cài đặt FreePrice
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          {/* All Settings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Tất cả cài đặt hệ thống</CardTitle>
              <CardDescription>Danh sách các thông số cấu hình</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {settings.map((setting) => (
                  <div key={setting.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                    <div className="space-y-1">
                      <p className="font-medium">{setting.key}</p>
                      <p className="text-sm text-muted-foreground">{setting.description}</p>
                      <p className="text-xs text-muted-foreground">Danh mục: {setting.category}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-lg">
                        {typeof setting.value === "object" && setting.value !== null
                          ? JSON.stringify(setting.value)
                          : String(setting.value)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
