import { Badge } from "@/components/ui/badge"
import type { RentalStatus as RentalStatusType } from "@/lib/types"

interface RentalStatusProps {
  status: RentalStatusType
}

export function RentalStatus({ status }: RentalStatusProps) {
  const statusConfig = {
    waiting: {
      label: "Đang chờ",
      variant: "secondary" as const,
      className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400 border-yellow-200",
    },
    active: {
      label: "Đang hoạt động",
      variant: "secondary" as const,
      className: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 border-blue-200",
    },
    completed: {
      label: "Hoàn thành",
      variant: "secondary" as const,
      className: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 border-green-200",
    },
    cancelled: {
      label: "Đã hủy",
      variant: "secondary" as const,
      className: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400 border-gray-200",
    },
    expired: {
      label: "Hết hạn",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 border-red-200",
    },
  }

  const config = statusConfig[status] || statusConfig.waiting

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  )
}
