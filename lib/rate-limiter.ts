import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export interface RateLimitConfig {
  max: number // Số lượng yêu cầu tối đa
  windowMs: number // Khoảng thời gian tính bằng milisec
}

export interface RateLimitResult {
  success: boolean
  limit: number
  remaining: number
  reset: number
}

const DEFAULT_LIMITS: Record<string, RateLimitConfig> = {
  deposit: { max: 5, windowMs: 60 * 60 * 1000 }, // 5 lần mỗi giờ
  rental: { max: 20, windowMs: 60 * 60 * 1000 }, // 20 lần mỗi giờ
  login: { max: 10, windowMs: 15 * 60 * 1000 }, // 10 lần mỗi 15 phút
  api: { max: 100, windowMs: 60 * 1000 }, // 100 lần mỗi phút
}

export async function checkRateLimit(
  identifier: string,
  action: keyof typeof DEFAULT_LIMITS,
): Promise<RateLimitResult> {
  // Đảm bảo identifier luôn là chuỗi để tránh lỗi .split()
  const safeIdentifier = String(identifier || "unknown");
  
  // Đảm bảo config luôn tồn tại, mặc định dùng 'api' nếu truyền sai action
  const config = DEFAULT_LIMITS[action] || DEFAULT_LIMITS.api;
  const now = Date.now();
  const windowStart = now - config.windowMs;

  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      },
    );

    const { data: requests } = await supabase
      .from("rate_limit_logs")
      .select("created_at")
      .eq("identifier", safeIdentifier)
      .eq("action", action)
      .gte("created_at", new Date(windowStart).toISOString())
      .order("created_at", { ascending: false });

    const requestCount = requests?.length || 0;
    const remaining = Math.max(0, config.max - requestCount);
    const reset = windowStart + config.windowMs;

    if (requestCount >= config.max) {
      return {
        success: false,
        limit: config.max,
        remaining: 0,
        reset,
      };
    }

    // Sửa lỗi .split: Kiểm tra định dạng chuỗi trước khi cắt lấy IP
    const ipAddress = safeIdentifier.includes(":") 
      ? safeIdentifier.split(":")[1] 
      : safeIdentifier;

    await supabase.from("rate_limit_logs").insert({
      identifier: safeIdentifier,
      action,
      ip_address: ipAddress || null,
    });

    return {
      success: true,
      limit: config.max,
      remaining: remaining - 1,
      reset,
    };
  } catch (error) {
    console.error("[Rate Limiter] Error:", error);
    return {
      success: true,
      limit: config.max,
      remaining: config.max,
      reset: now + config.windowMs,
    };
  }
}

export async function applyRateLimit(
  identifier: string,
  action: keyof typeof DEFAULT_LIMITS,
) {
  const result = await checkRateLimit(identifier, action);

  if (!result.success) {
    throw new Error(
      `Yêu cầu quá nhanh. Vui lòng thử lại lúc ${new Date(
        result.reset,
      ).toLocaleTimeString()}`,
    );
  }

  return result;
}

export async function clearRateLimit(
  identifier: string,
  action: string,
): Promise<void> {
  try {
    const cookieStore = await cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: () => {},
          remove: () => {},
        },
      },
    );

    await supabase
      .from("rate_limit_logs")
      .delete()
      .eq("identifier", String(identifier))
      .eq("action", action);
  } catch (error) {
    console.error("[Rate Limiter] Clear error:", error);
  }
}