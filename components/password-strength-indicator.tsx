import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle } from "lucide-react"

interface PasswordStrengthIndicatorProps {
  password: string
}

export function PasswordStrengthIndicator({ password }: PasswordStrengthIndicatorProps) {
  if (!password) return null

  const checks = [
    { label: "Ít nhất 8 ký tự", valid: password.length >= 8 },
    { label: "Chứa chữ hoa", valid: /[A-Z]/.test(password) },
    { label: "Chứa chữ thường", valid: /[a-z]/.test(password) },
    { label: "Chứa số", valid: /\d/.test(password) },
    { label: "Chứa ký tự đặc biệt", valid: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password) },
  ]

  const validCount = checks.filter((c) => c.valid).length
  const strength = validCount <= 2 ? "weak" : validCount <= 4 ? "medium" : "strong"
  const strengthColor = strength === "weak" ? "bg-red-500" : strength === "medium" ? "bg-yellow-500" : "bg-green-500"
  const strengthText = strength === "weak" ? "Yếu" : strength === "medium" ? "Trung bình" : "Mạnh"
  const progress = (validCount / checks.length) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">Độ mạnh mật khẩu:</span>
        <span
          className={`font-medium ${strength === "weak" ? "text-red-500" : strength === "medium" ? "text-yellow-500" : "text-green-500"}`}
        >
          {strengthText}
        </span>
      </div>
      <Progress value={progress} className="h-2" indicatorClassName={strengthColor} />
      <div className="space-y-1">
        {checks.map((check, index) => (
          <div key={index} className="flex items-center gap-2 text-xs">
            {check.valid ? (
              <CheckCircle2 className="h-3 w-3 text-green-500" />
            ) : (
              <XCircle className="h-3 w-3 text-muted-foreground" />
            )}
            <span className={check.valid ? "text-green-600" : "text-muted-foreground"}>{check.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
