"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export function RefundPolicyForm() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    refund_percentage: "",
    condition_type: "custom",
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/admin/refund-policies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          refund_percentage: Number.parseFloat(formData.refund_percentage),
        }),
      })

      if (!response.ok) throw new Error("Failed to create policy")

      toast.success("Đã tạo chính sách hoàn tiền mới")
      setFormData({ name: "", description: "", refund_percentage: "", condition_type: "custom" })
      router.refresh()
    } catch (error) {
      toast.error("Không thể tạo chính sách")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Tên chính sách</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="VD: Hoàn tiền đặc biệt cuối tuần"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Mô tả</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Mô tả điều kiện áp dụng"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="percentage">Phần trăm hoàn (%)</Label>
          <Input
            id="percentage"
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.refund_percentage}
            onChange={(e) => setFormData({ ...formData, refund_percentage: e.target.value })}
            placeholder="50"
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="condition">Điều kiện áp dụng</Label>
          <Select
            value={formData.condition_type}
            onValueChange={(value) => setFormData({ ...formData, condition_type: value })}
          >
            <SelectTrigger id="condition">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="no_otp">Chưa nhận OTP</SelectItem>
              <SelectItem value="partial_otp">Đã nhận OTP</SelectItem>
              <SelectItem value="expired">Hết hạn</SelectItem>
              <SelectItem value="custom">Tùy chỉnh</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Đang tạo..." : "Tạo chính sách"}
      </Button>
    </form>
  )
}
