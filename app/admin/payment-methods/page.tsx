"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2, Save, Pencil, CreditCard, AlertCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { createClient } from "@/lib/supabase/client"

interface PaymentMethod {
  id: string
  name: string
  type: string
  provider: string
  account_number: string | null
  account_name: string | null
  bank_code: string | null
  logo_url: string | null
  instructions: string | null
  is_active: boolean
  min_amount: number
  max_amount: number
  fee_percentage: number
  fee_fixed: number
  display_order: number
}

export default function AdminPaymentMethodsPage() {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({})
  const { toast } = useToast()
  const supabase = createClient()

  useEffect(() => {
    fetchPaymentMethods()
  }, [])

  const fetchPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from("payment_methods")
        .select("*")
        .order("display_order", { ascending: true })

      if (error) throw error
      setPaymentMethods(data || [])
    } catch (error) {
      console.error("[v0] Error fetching payment methods:", error)
      toast({
        title: "Lỗi",
        description: "Không thể tải danh sách phương thức thanh toán",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleEdit = (method: PaymentMethod) => {
    setEditingId(method.id)
    setFormData(method)
  }

  const handleSave = async () => {
    if (!editingId) return

    try {
      const { error } = await supabase.from("payment_methods").update(formData).eq("id", editingId)

      if (error) throw error

      toast({
        title: "Thành công",
        description: "Đã cập nhật phương thức thanh toán",
      })

      setEditingId(null)
      fetchPaymentMethods()
    } catch (error) {
      console.error("[v0] Error updating payment method:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật phương thức thanh toán",
        variant: "destructive",
      })
    }
  }

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase.from("payment_methods").update({ is_active: !currentStatus }).eq("id", id)

      if (error) throw error

      toast({
        title: "Thành công",
        description: `Đã ${!currentStatus ? "kích hoạt" : "tắt"} phương thức thanh toán`,
      })

      fetchPaymentMethods()
    } catch (error) {
      console.error("[v0] Error toggling payment method:", error)
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật trạng thái",
        variant: "destructive",
      })
    }
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
      <div>
        <h1 className="text-3xl font-bold">Phương thức thanh toán</h1>
        <p className="text-muted-foreground mt-2">Quản lý cấu hình ngân hàng và cổng thanh toán</p>
      </div>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Quan trọng:</strong> Cập nhật thông tin tài khoản ngân hàng thật để nhận thanh toán từ khách hàng. Đảm
          bảo tất cả thông tin chính xác trước khi kích hoạt.
        </AlertDescription>
      </Alert>

      <div className="grid gap-6">
        {paymentMethods.map((method) => (
          <Card key={method.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CreditCard className="h-5 w-5" />
                  <div>
                    <CardTitle>{method.name}</CardTitle>
                    <CardDescription>
                      {method.provider.toUpperCase()} • {method.type}
                    </CardDescription>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={method.is_active}
                    onCheckedChange={() => handleToggleActive(method.id, method.is_active)}
                  />
                  <Button variant="outline" size="sm" onClick={() => handleEdit(method)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {editingId === method.id ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tên phương thức</Label>
                      <Input
                        value={formData.name || ""}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Provider</Label>
                      <Input
                        value={formData.provider || ""}
                        onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
                      />
                    </div>
                  </div>

                  {method.provider === "vietqr" && (
                    <div className="grid grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label>Mã ngân hàng</Label>
                        <Input
                          placeholder="MB, VCB, TCB..."
                          value={formData.bank_code || ""}
                          onChange={(e) => setFormData({ ...formData, bank_code: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Số tài khoản</Label>
                        <Input
                          placeholder="0123456789"
                          value={formData.account_number || ""}
                          onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Tên chủ tài khoản</Label>
                        <Input
                          placeholder="NGUYEN VAN A"
                          value={formData.account_name || ""}
                          onChange={(e) => setFormData({ ...formData, account_name: e.target.value })}
                        />
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Hướng dẫn thanh toán</Label>
                    <Textarea
                      rows={3}
                      value={formData.instructions || ""}
                      onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div className="space-y-2">
                      <Label>Số tiền tối thiểu</Label>
                      <Input
                        type="number"
                        value={formData.min_amount || 0}
                        onChange={(e) => setFormData({ ...formData, min_amount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Số tiền tối đa</Label>
                      <Input
                        type="number"
                        value={formData.max_amount || 0}
                        onChange={(e) => setFormData({ ...formData, max_amount: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phí % (VD: 1.5 cho 1.5%)</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={formData.fee_percentage || 0}
                        onChange={(e) => setFormData({ ...formData, fee_percentage: Number(e.target.value) })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Phí cố định (VNĐ)</Label>
                      <Input
                        type="number"
                        value={formData.fee_fixed || 0}
                        onChange={(e) => setFormData({ ...formData, fee_fixed: Number(e.target.value) })}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button onClick={handleSave}>
                      <Save className="mr-2 h-4 w-4" />
                      Lưu thay đổi
                    </Button>
                    <Button variant="outline" onClick={() => setEditingId(null)}>
                      Hủy
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  {method.provider === "vietqr" && (
                    <div className="grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-muted-foreground">Ngân hàng</p>
                        <p className="font-medium">{method.bank_code || "Chưa cấu hình"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Số tài khoản</p>
                        <p className="font-medium">{method.account_number || "Chưa cấu hình"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Tên chủ tài khoản</p>
                        <p className="font-medium">{method.account_name || "Chưa cấu hình"}</p>
                      </div>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Giới hạn số tiền</p>
                    <p className="font-medium">
                      {(method.min_amount ?? 0).toLocaleString("vi-VN")}đ -{" "}
                      {(method.max_amount ?? 0).toLocaleString("vi-VN")}đ
                    </p>
                  </div>
                  {method.instructions && (
                    <div>
                      <p className="text-muted-foreground">Hướng dẫn</p>
                      <p className="font-medium">{method.instructions}</p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
