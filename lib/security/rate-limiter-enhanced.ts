import { Redis } from "@upstash/redis"

const redis = Redis.fromEnv()

export interface RateLimitConfig {
  points: number // Number of requests
  duration: number // Duration in seconds
  blockDuration?: number // Block duration in seconds after limit exceeded
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
  blocked?: boolean
  blockUntil?: number
}

export class EnhancedRateLimiter {
  private config: RateLimitConfig

  constructor(config: RateLimitConfig) {
    this.config = config
  }

  async check(key: string): Promise<RateLimitResult> {
    const now = Date.now()
    const windowKey = `ratelimit:${key}`
    const blockKey = `blocked:${key}`

    // Check if blocked
    const blockUntil = await redis.get<number>(blockKey)
    if (blockUntil && blockUntil > now) {
      return {
        success: false,
        limit: this.config.points,
        remaining: 0,
        reset: blockUntil,
        blocked: true,
        blockUntil,
      }
    }

    // Get current count
    const current = (await redis.get<number>(windowKey)) || 0
    const reset = now + this.config.duration * 1000

    if (current >= this.config.points) {
      // Exceeded limit
      if (this.config.blockDuration) {
        // Block the key
        const blockUntilTime = now + this.config.blockDuration * 1000
        await redis.set(blockKey, blockUntilTime, {
          px: this.config.blockDuration * 1000,
        })
      }

      return {
        success: false,
        limit: this.config.points,
        remaining: 0,
        reset,
        blocked: Boolean(this.config.blockDuration),
        blockUntil: this.config.blockDuration ? now + this.config.blockDuration * 1000 : undefined,
      }
    }

    // Increment counter
    const newCount = current + 1
    await redis.set(windowKey, newCount, {
      px: this.config.duration * 1000,
    })

    return {
      success: true,
      limit: this.config.points,
      remaining: this.config.points - newCount,
      reset,
    }
  }

  async reset(key: string): Promise<void> {
    const windowKey = `ratelimit:${key}`
    const blockKey = `blocked:${key}`
    await redis.del(windowKey)
    await redis.del(blockKey)
  }
}

// Predefined rate limiters
export const loginRateLimiter = new EnhancedRateLimiter({
  points: 5, // 5 attempts
  duration: 900, // 15 minutes
  blockDuration: 1800, // Block for 30 minutes after exceeding
})

export const apiRateLimiter = new EnhancedRateLimiter({
  points: 100, // 100 requests
  duration: 60, // per minute
})

export const transactionRateLimiter = new EnhancedRateLimiter({
  points: 10, // 10 transactions
  duration: 60, // per minute
})

export const signupRateLimiter = new EnhancedRateLimiter({
  points: 3, // 3 signups
  duration: 3600, // per hour
  blockDuration: 86400, // Block for 24 hours
})
