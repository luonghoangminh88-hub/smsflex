/**
 * Enhanced SMS-Activate Error Handling
 * Handles all error codes from SMS-Activate API documentation
 */

export enum SmsActivateErrorCode {
  // Balance and Access Errors
  NO_BALANCE = "NO_BALANCE",
  BAD_KEY = "BAD_KEY",
  BANNED = "BANNED",

  // Service Availability Errors
  NO_NUMBERS = "NO_NUMBERS",
  NO_ACTIVATION = "NO_ACTIVATION",
  WRONG_SERVICE = "WRONG_SERVICE",
  WRONG_EXCEPTION_PHONE = "WRONG_EXCEPTION_PHONE",

  // Request Errors
  BAD_ACTION = "BAD_ACTION",
  BAD_SERVICE = "BAD_SERVICE",
  WRONG_ACTIVATION_ID = "WRONG_ACTIVATION_ID",
  ALREADY_FINISH = "ALREADY_FINISH",
  ALREADY_CANCEL = "ALREADY_CANCEL",

  // Rate Limiting
  SQL_ERROR = "SQL_ERROR",

  // Status Errors
  STATUS_WAIT_CODE = "STATUS_WAIT_CODE",
  STATUS_WAIT_RETRY = "STATUS_WAIT_RETRY",
  STATUS_CANCEL = "STATUS_CANCEL",

  // Generic
  UNKNOWN_ERROR = "UNKNOWN_ERROR",
}

export class SmsActivateError extends Error {
  public readonly code: SmsActivateErrorCode
  public readonly isRetryable: boolean
  public readonly userMessage: string

  constructor(code: SmsActivateErrorCode, message: string, isRetryable = false) {
    super(message)
    this.name = "SmsActivateError"
    this.code = code
    this.isRetryable = isRetryable
    this.userMessage = this.getUserFriendlyMessage(code)
  }

  private getUserFriendlyMessage(code: SmsActivateErrorCode): string {
    const messages: Record<SmsActivateErrorCode, string> = {
      [SmsActivateErrorCode.NO_BALANCE]: "Hệ thống tạm thời không thể xử lý yêu cầu. Vui lòng thử lại sau.",
      [SmsActivateErrorCode.BAD_KEY]: "Lỗi cấu hình hệ thống. Vui lòng liên hệ quản trị viên.",
      [SmsActivateErrorCode.BANNED]: "Tài khoản hệ thống bị khóa. Vui lòng liên hệ quản trị viên.",
      [SmsActivateErrorCode.NO_NUMBERS]:
        "Hiện không có số điện thoại khả dụng cho dịch vụ này. Vui lòng thử lại sau hoặc chọn dịch vụ khác.",
      [SmsActivateErrorCode.NO_ACTIVATION]: "Không tìm thấy yêu cầu thuê số. Vui lòng thử lại.",
      [SmsActivateErrorCode.WRONG_SERVICE]: "Dịch vụ không hợp lệ. Vui lòng chọn dịch vụ khác.",
      [SmsActivateErrorCode.WRONG_EXCEPTION_PHONE]: "Số điện thoại không phù hợp. Vui lòng thử lại.",
      [SmsActivateErrorCode.BAD_ACTION]: "Yêu cầu không hợp lệ. Vui lòng thử lại.",
      [SmsActivateErrorCode.BAD_SERVICE]: "Dịch vụ không được hỗ trợ.",
      [SmsActivateErrorCode.WRONG_ACTIVATION_ID]: "Mã kích hoạt không hợp lệ.",
      [SmsActivateErrorCode.ALREADY_FINISH]: "Yêu cầu này đã được hoàn thành.",
      [SmsActivateErrorCode.ALREADY_CANCEL]: "Yêu cầu này đã bị hủy.",
      [SmsActivateErrorCode.SQL_ERROR]: "Lỗi hệ thống. Vui lòng thử lại sau.",
      [SmsActivateErrorCode.STATUS_WAIT_CODE]: "Đang chờ mã OTP...",
      [SmsActivateErrorCode.STATUS_WAIT_RETRY]: "Đang thử lại...",
      [SmsActivateErrorCode.STATUS_CANCEL]: "Yêu cầu đã bị hủy.",
      [SmsActivateErrorCode.UNKNOWN_ERROR]: "Lỗi không xác định. Vui lòng thử lại sau.",
    }

    return messages[code] || messages[SmsActivateErrorCode.UNKNOWN_ERROR]
  }

  static fromResponse(response: string): SmsActivateError {
    const errorCode = response.toUpperCase()

    // Check if it's a known error code
    if (Object.values(SmsActivateErrorCode).includes(errorCode as SmsActivateErrorCode)) {
      const code = errorCode as SmsActivateErrorCode
      const isRetryable = [
        SmsActivateErrorCode.NO_NUMBERS,
        SmsActivateErrorCode.SQL_ERROR,
        SmsActivateErrorCode.STATUS_WAIT_CODE,
        SmsActivateErrorCode.STATUS_WAIT_RETRY,
      ].includes(code)

      return new SmsActivateError(code, response, isRetryable)
    }

    // Unknown error
    return new SmsActivateError(SmsActivateErrorCode.UNKNOWN_ERROR, response, false)
  }
}

export function isTemporaryError(error: SmsActivateError): boolean {
  return [
    SmsActivateErrorCode.NO_NUMBERS,
    SmsActivateErrorCode.SQL_ERROR,
    SmsActivateErrorCode.STATUS_WAIT_CODE,
  ].includes(error.code)
}

export function shouldRetry(error: SmsActivateError, attemptCount: number): boolean {
  const MAX_RETRIES = 3
  return error.isRetryable && attemptCount < MAX_RETRIES
}

export function getRetryDelay(attemptCount: number): number {
  // Exponential backoff: 1s, 2s, 4s, 8s, etc.
  return Math.min(1000 * Math.pow(2, attemptCount), 10000)
}
