import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { RefundPolicyForm } from "@/components/admin/refund-policy-form"

export default async function RefundPoliciesPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single()

  if (profile?.role !== "admin") {
    redirect("/dashboard")
  }

  const { data: policies } = await supabase
    .from("refund_policies")
    .select("*")
    .order("refund_percentage", { ascending: false })

  const { data: refundHistory } = await supabase
    .from("refund_history")
    .select("*, profiles(full_name, email)")
    .order("created_at", { ascending: false })
    .limit(50)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Chính sách hoàn tiền</h1>
        <p className="text-muted-foreground">Quản lý các chính sách hoàn tiền tự động</p>
      </div>

      {/* Current Policies */}
      <Card>
        <CardHeader>
          <CardTitle>Chính sách hiện tại</CardTitle>
          <CardDescription>Các chính sách hoàn tiền đang áp dụng</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {policies?.map((policy) => (
              <div key={policy.id} className="flex items-center justify-between border rounded-lg p-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold">{policy.name}</h3>
                    <Badge variant={policy.is_active ? "default" : "secondary"}>
                      {policy.is_active ? "Đang áp dụng" : "Tạm dừng"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mb-2">{policy.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>Điều kiện: {getConditionText(policy.condition_type)}</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-primary">{policy.refund_percentage}%</div>
                  <p className="text-xs text-muted-foreground">Hoàn lại</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Add New Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Thêm chính sách mới</CardTitle>
          <CardDescription>Tạo chính sách hoàn tiền tùy chỉnh</CardDescription>
        </CardHeader>
        <CardContent>
          <RefundPolicyForm />
        </CardContent>
      </Card>

      {/* Refund History */}
      <Card>
        <CardHeader>
          <CardTitle>Lịch sử hoàn tiền</CardTitle>
          <CardDescription>50 giao dịch hoàn tiền gần nhất</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {refundHistory?.map((refund: any) => (
              <div key={refund.id} className="flex items-center justify-between border-b pb-3 last:border-0">
                <div className="flex-1">
                  <p className="font-medium">{refund.profiles?.full_name || "Unknown"}</p>
                  <p className="text-sm text-muted-foreground">{refund.reason}</p>
                  <p className="text-xs text-muted-foreground">{new Date(refund.created_at).toLocaleString("vi-VN")}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">+{refund.refund_amount.toLocaleString("vi-VN")}đ</p>
                  <p className="text-xs text-muted-foreground">{refund.refund_percentage}% hoàn</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function getConditionText(type: string): string {
  const map: Record<string, string> = {
    no_otp: "Chưa nhận OTP",
    partial_otp: "Đã nhận OTP",
    expired: "Hết hạn",
    custom: "Tùy chỉnh",
  }
  return map[type] || type
}
