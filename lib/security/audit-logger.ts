import { createClient } from "@/lib/supabase/server"

export interface AuditLogEntry {
  tableName: string
  recordId: string
  action: "INSERT" | "UPDATE" | "DELETE"
  userId?: string | null
  oldData?: any
  newData?: any
  changedFields?: string[]
  ipAddress?: string
  userAgent?: string
}

export async function logAuditTrail(entry: AuditLogEntry) {
  try {
    const supabase = await createClient()

    const { error } = await supabase.from("audit_trail").insert({
      table_name: entry.tableName,
      record_id: entry.recordId,
      action: entry.action,
      user_id: entry.userId,
      old_data: entry.oldData,
      new_data: entry.newData,
      changed_fields: entry.changedFields,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
    })

    if (error) {
      console.error("[Audit] Failed to log audit trail:", error)
    }
  } catch (error) {
    console.error("[Audit] Exception in audit logging:", error)
  }
}

export async function getAuditLogs(filters: {
  tableName?: string
  recordId?: string
  userId?: string
  action?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()

  let query = supabase.from("audit_trail").select("*", { count: "exact" }).order("created_at", { ascending: false })

  if (filters.tableName) {
    query = query.eq("table_name", filters.tableName)
  }

  if (filters.recordId) {
    query = query.eq("record_id", filters.recordId)
  }

  if (filters.userId) {
    query = query.eq("user_id", filters.userId)
  }

  if (filters.action) {
    query = query.eq("action", filters.action)
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate.toISOString())
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate.toISOString())
  }

  const limit = filters.limit || 50
  const offset = filters.offset || 0

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    logs: data || [],
    total: count || 0,
  }
}

export async function getSecurityLogs(filters: {
  userId?: string
  eventType?: string
  ipAddress?: string
  startDate?: Date
  endDate?: Date
  limit?: number
  offset?: number
}) {
  const supabase = await createClient()

  let query = supabase.from("security_logs").select("*", { count: "exact" }).order("created_at", { ascending: false })

  if (filters.userId) {
    query = query.eq("user_id", filters.userId)
  }

  if (filters.eventType) {
    query = query.eq("event_type", filters.eventType)
  }

  if (filters.ipAddress) {
    query = query.eq("ip_address", filters.ipAddress)
  }

  if (filters.startDate) {
    query = query.gte("created_at", filters.startDate.toISOString())
  }

  if (filters.endDate) {
    query = query.lte("created_at", filters.endDate.toISOString())
  }

  const limit = filters.limit || 50
  const offset = filters.offset || 0

  query = query.range(offset, offset + limit - 1)

  const { data, error, count } = await query

  if (error) {
    throw error
  }

  return {
    logs: data || [],
    total: count || 0,
  }
}
