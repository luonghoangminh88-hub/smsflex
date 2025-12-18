import { describe, it, expect } from "@jest/globals"

describe("API Security Tests", () => {
  describe("SQL Injection Protection", () => {
    const sqlInjectionPayloads = ["' OR '1'='1", "1; DROP TABLE users--", "admin'--", "' UNION SELECT * FROM users--"]

    it("should reject SQL injection attempts in email field", async () => {
      for (const payload of sqlInjectionPayloads) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: payload,
            password: "test123",
          }),
        })

        const data = await response.json()
        expect(response.status).toBe(400)
        expect(data.error).toBeTruthy()
      }
    })
  })

  describe("XSS Protection", () => {
    const xssPayloads = [
      "<script>alert('XSS')</script>",
      "<img src=x onerror=alert('XSS')>",
      "javascript:alert('XSS')",
      "<iframe src='javascript:alert(1)'>",
    ]

    it("should sanitize XSS attempts in input fields", async () => {
      for (const payload of xssPayloads) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/signup`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "test@example.com",
            password: "StrongP@ss123!",
            fullName: payload,
          }),
        })

        expect(response.status).toBe(400)
      }
    })
  })

  describe("CSRF Protection", () => {
    it("should reject requests without CSRF token", async () => {
      const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deposits/create`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          payment_method_id: "test-id",
          amount: 100000,
        }),
      })

      expect(response.status).toBe(403)
    })
  })

  describe("Input Validation", () => {
    it("should reject invalid email formats", async () => {
      const invalidEmails = ["notanemail", "missing@", "@nodomain.com", "spaces in@email.com"]

      for (const email of invalidEmails) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: "test123",
          }),
        })

        expect(response.status).toBe(400)
      }
    })

    it("should reject invalid amounts", async () => {
      const invalidAmounts = [-100, 0, 1000000000000, Number.NaN, "not a number"]

      for (const amount of invalidAmounts) {
        const response = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/deposits/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer test-token",
          },
          body: JSON.stringify({
            payment_method_id: "valid-uuid",
            amount,
          }),
        })

        expect(response.status).toBe(400)
      }
    })
  })
})
