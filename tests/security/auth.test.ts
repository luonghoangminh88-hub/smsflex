import { describe, it, expect } from "@jest/globals"

describe("Authentication Security Tests", () => {
  const testEmail = `test-${Date.now()}@example.com`
  const weakPassword = "weak"
  const strongPassword = "StrongP@ss123!"

  describe("Password Strength Validation", () => {
    it("should reject weak passwords", async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: testEmail,
          password: weakPassword,
          fullName: "Test User",
        }),
      })

      expect(response.status).toBe(400)
      const data = await response.json()
      expect(data.error).toContain("Mật khẩu")
    })

    it("should accept strong passwords", async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/signup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: `strong-${Date.now()}@example.com`,
          password: strongPassword,
          fullName: "Test User",
        }),
      })

      expect(response.status).not.toBe(400)
    })
  })

  describe("Rate Limiting", () => {
    it("should block after multiple failed login attempts", async () => {
      const attempts = []
      for (let i = 0; i < 6; i++) {
        attempts.push(
          fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              email: "attacker@example.com",
              password: "wrongpassword",
            }),
          }),
        )
      }

      const responses = await Promise.all(attempts)
      const lastResponse = responses[responses.length - 1]

      expect(lastResponse.status).toBe(429)
      const data = await lastResponse.json()
      expect(data.error).toContain("khóa")
    })
  })

  describe("Session Management", () => {
    it("should require authentication for protected routes", async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deposits/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method_id: "test",
          amount: 100000,
        }),
      })

      expect(response.status).toBe(401)
    })
  })
})
