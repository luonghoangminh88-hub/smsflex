import zxcvbn from "zxcvbn"

export interface PasswordValidationResult {
  valid: boolean
  score: number // 0-4
  feedback: string[]
  error?: string
}

export function validatePasswordStrength(password: string): PasswordValidationResult {
  const minLength = 12
  const requirements = {
    hasUpperCase: /[A-Z]/.test(password),
    hasLowerCase: /[a-z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>_\-+=[\]\\|~`]/.test(password),
  }

  const feedback: string[] = []

  // Length check
  if (password.length < minLength) {
    return {
      valid: false,
      score: 0,
      feedback: [`Mật khẩu phải có ít nhất ${minLength} ký tự`],
      error: `Mật khẩu quá ngắn (tối thiểu ${minLength} ký tự)`,
    }
  }

  // Complexity checks
  if (!requirements.hasUpperCase) {
    feedback.push("Thêm ít nhất 1 chữ in hoa (A-Z)")
  }
  if (!requirements.hasLowerCase) {
    feedback.push("Thêm ít nhất 1 chữ thường (a-z)")
  }
  if (!requirements.hasNumbers) {
    feedback.push("Thêm ít nhất 1 chữ số (0-9)")
  }
  if (!requirements.hasSpecialChar) {
    feedback.push("Thêm ít nhất 1 ký tự đặc biệt (!@#$%^&*...)")
  }

  if (feedback.length > 0) {
    return {
      valid: false,
      score: 1,
      feedback,
      error: "Mật khẩu không đủ phức tạp",
    }
  }

  // Use zxcvbn for advanced strength checking
  const strengthResult = zxcvbn(password)

  if (strengthResult.score < 3) {
    return {
      valid: false,
      score: strengthResult.score,
      feedback:
        strengthResult.feedback.suggestions.length > 0
          ? strengthResult.feedback.suggestions
          : ["Mật khẩu này quá phổ biến hoặc dễ đoán"],
      error: "Mật khẩu không đủ mạnh",
    }
  }

  return {
    valid: true,
    score: strengthResult.score,
    feedback: ["Mật khẩu mạnh"],
  }
}

export function getPasswordStrengthLabel(score: number): string {
  const labels = ["Rất yếu", "Yếu", "Trung bình", "Mạnh", "Rất mạnh"]
  return labels[score] || "Không xác định"
}

export function getPasswordStrengthColor(score: number): string {
  const colors = ["red", "orange", "yellow", "lightgreen", "green"]
  return colors[score] || "gray"
}

// Common passwords list (simplified - use a full list in production)
const commonPasswords = new Set([
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "1234567",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "111111",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "passw0rd",
  "shadow",
  "123123",
  "654321",
  "superman",
  "qazwsx",
  "michael",
  "football",
])

export function isCommonPassword(password: string): boolean {
  return commonPasswords.has(password.toLowerCase())
}
