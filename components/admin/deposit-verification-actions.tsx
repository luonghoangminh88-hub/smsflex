"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { useRouter } from "next/navigation"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

export function DepositVerificationActions({ depositId }: { depositId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const [adminNotes, setAdminNotes] = useState("")
  const [openDialog, setOpenDialog] = useState<"approve" | "reject" | null>(null)
  const router = useRouter()

  const handleVerification = async (action: "approve" | "reject") => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/admin/deposits/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deposit_id: depositId,
          action,
          admin_notes: adminNotes || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to verify deposit")
      }

      // Success - refresh page
      setOpenDialog(null)
      setAdminNotes("")
      router.refresh()
    } catch (error: any) {
      alert(error.message || "Có lỗi xảy ra khi xử lý yêu cầu")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex gap-2">
      {/* Approve Dialog */}
      <Dialog open={openDialog === "approve"} onOpenChange={(open) => setOpenDialog(open ? "approve" : null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="default" disabled={isLoading}>
            <CheckCircle2 className="h-4 w-4 mr-1" />
            Duyệt
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận duyệt nạp tiền</DialogTitle>
            <DialogDescription>Bạn có chắc chắn muốn duyệt yêu cầu nạp tiền này?</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="approve-notes">Ghi chú (tùy chọn)</Label>
              <Textarea
                id="approve-notes"
                placeholder="Thêm ghi chú nếu cần..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)} disabled={isLoading}>
              Hủy
            </Button>
            <Button onClick={() => handleVerification("approve")} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận duyệt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={openDialog === "reject"} onOpenChange={(open) => setOpenDialog(open ? "reject" : null)}>
        <DialogTrigger asChild>
          <Button size="sm" variant="destructive" disabled={isLoading}>
            <XCircle className="h-4 w-4 mr-1" />
            Từ chối
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Xác nhận từ chối nạp tiền</DialogTitle>
            <DialogDescription>Vui lòng cung cấp lý do từ chối để thông báo cho người dùng.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="reject-notes">Lý do từ chối *</Label>
              <Textarea
                id="reject-notes"
                placeholder="Ví dụ: Thông tin chuyển khoản không khớp..."
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenDialog(null)} disabled={isLoading}>
              Hủy
            </Button>
            <Button variant="destructive" onClick={() => handleVerification("reject")} disabled={isLoading}>
              {isLoading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Xác nhận từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
