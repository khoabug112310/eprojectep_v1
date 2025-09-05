import api from './api'

export interface VNPayPaymentRequest {
  amount: number
  orderInfo: string
  orderType: string
  locale?: 'vn' | 'en'
  returnUrl?: string
  ipAddr?: string
  bookingId: string
  showtimeId: number
  seats: Array<{
    seatId: string
    seatType: string
    price: number
  }>
}

export interface VNPayPaymentResponse {
  success: boolean
  paymentUrl?: string
  transactionId?: string
  message?: string
  error?: string
}

export interface VNPayReturnData {
  vnp_Amount: string
  vnp_BankCode: string
  vnp_BankTranNo: string
  vnp_CardType: string
  vnp_OrderInfo: string
  vnp_PayDate: string
  vnp_ResponseCode: string
  vnp_TmnCode: string
  vnp_TransactionNo: string
  vnp_TransactionStatus: string
  vnp_TxnRef: string
  vnp_SecureHash: string
}

export interface PaymentStatusResponse {
  success: boolean
  transactionStatus: 'SUCCESS' | 'FAILED' | 'PENDING' | 'CANCELLED'
  amount: number
  transactionId: string
  bookingId: string
  paymentDate?: string
  bankCode?: string
  message?: string
}

class VNPayService {
  private baseUrl = '/api/payment/vnpay'

  /**
   * Create VNPay payment URL
   */
  async createPaymentUrl(paymentData: VNPayPaymentRequest): Promise<VNPayPaymentResponse> {
    try {
      const response = await api.post(`${this.baseUrl}/create`, {
        ...paymentData,
        locale: paymentData.locale || 'vn',
        returnUrl: paymentData.returnUrl || `${window.location.origin}/payment/return`,
        ipAddr: paymentData.ipAddr || this.getClientIP()
      })

      return {
        success: true,
        paymentUrl: response.data.paymentUrl,
        transactionId: response.data.transactionId,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('VNPay payment creation error:', error)
      return {
        success: false,
        error: error.response?.data?.message || 'Không thể tạo giao dịch thanh toán'
      }
    }
  }

  /**
   * Verify payment return from VNPay
   */
  async verifyPaymentReturn(returnData: URLSearchParams): Promise<PaymentStatusResponse> {
    try {
      const params: Record<string, string> = {}
      returnData.forEach((value, key) => {
        params[key] = value
      })

      const response = await api.post(`${this.baseUrl}/return`, params)

      return {
        success: response.data.success,
        transactionStatus: response.data.transactionStatus,
        amount: response.data.amount,
        transactionId: response.data.transactionId,
        bookingId: response.data.bookingId,
        paymentDate: response.data.paymentDate,
        bankCode: response.data.bankCode,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('VNPay payment verification error:', error)
      return {
        success: false,
        transactionStatus: 'FAILED',
        amount: 0,
        transactionId: '',
        bookingId: '',
        message: error.response?.data?.message || 'Không thể xác thực giao dịch'
      }
    }
  }

  /**
   * Query transaction status
   */
  async queryTransactionStatus(transactionId: string): Promise<PaymentStatusResponse> {
    try {
      const response = await api.get(`${this.baseUrl}/query/${transactionId}`)

      return {
        success: true,
        transactionStatus: response.data.transactionStatus,
        amount: response.data.amount,
        transactionId: response.data.transactionId,
        bookingId: response.data.bookingId,
        paymentDate: response.data.paymentDate,
        bankCode: response.data.bankCode,
        message: response.data.message
      }
    } catch (error: any) {
      console.error('VNPay transaction query error:', error)
      return {
        success: false,
        transactionStatus: 'FAILED',
        amount: 0,
        transactionId: '',
        bookingId: '',
        message: error.response?.data?.message || 'Không thể truy vấn trạng thái giao dịch'
      }
    }
  }

  /**
   * Get supported bank list
   */
  async getSupportedBanks(): Promise<Array<{ code: string; name: string; logo?: string }>> {
    try {
      const response = await api.get(`${this.baseUrl}/banks`)
      return response.data.banks || []
    } catch (error) {
      console.error('Error fetching supported banks:', error)
      return this.getDefaultBanks()
    }
  }

  /**
   * Format amount for VNPay (VND, no decimals)
   */
  formatAmount(amount: number): number {
    return Math.round(amount)
  }

  /**
   * Format VNPay amount back to readable format
   */
  parseAmount(vnpAmount: string): number {
    return parseInt(vnpAmount) / 100 // VNPay sends amount * 100
  }

  /**
   * Generate order info string
   */
  generateOrderInfo(bookingId: string, movieTitle: string, theaterName: string): string {
    return `CineBook - ${movieTitle} - ${theaterName} - Booking ${bookingId}`
  }

  /**
   * Get client IP (placeholder for actual implementation)
   */
  private getClientIP(): string {
    // In a real implementation, you'd get this from the server
    // or use a service like ipapi.co
    return '127.0.0.1'
  }

  /**
   * Get default bank list
   */
  private getDefaultBanks() {
    return [
      { code: 'VNPAYQR', name: 'Thanh toán qua ứng dụng hỗ trợ VNPAYQR' },
      { code: 'VNBANK', name: 'Ngân hàng nội địa' },
      { code: 'INTCARD', name: 'Thẻ thanh toán quốc tế' },
      { code: 'VIETCOMBANK', name: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
      { code: 'VIETINBANK', name: 'Ngân hàng TMCP Công Thương Việt Nam' },
      { code: 'BIDV', name: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
      { code: 'AGRIBANK', name: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn' },
      { code: 'TPB', name: 'Ngân hàng TMCP Tiên Phong' },
      { code: 'SACOMBANK', name: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
      { code: 'HDBank', name: 'Ngân hàng TMCP Phát triển Thành phố Hồ Chí Minh' },
      { code: 'DONGABANK', name: 'Ngân hàng TMCP Đông Á' },
      { code: 'TPBANK', name: 'Ngân hàng TMCP Tiên Phong' },
      { code: 'OJB', name: 'Ngân hàng TMCP Đại Dương' },
      { code: 'MSBANK', name: 'Ngân hàng TMCP Hàng Hải' },
      { code: 'NAMABANK', name: 'Ngân hàng TMCP Nam Á' },
      { code: 'IVB', name: 'Ngân hàng TNHH Indovina' },
      { code: 'SHB', name: 'Ngân hàng TMCP Sài Gòn - Hà Nội' }
    ]
  }

  /**
   * Check if return URL contains valid VNPay parameters
   */
  isValidVNPayReturn(params: URLSearchParams): boolean {
    const requiredParams = ['vnp_TxnRef', 'vnp_ResponseCode', 'vnp_SecureHash']
    return requiredParams.every(param => params.has(param))
  }

  /**
   * Parse VNPay response code to user-friendly message
   */
  getResponseMessage(responseCode: string): string {
    const messages: Record<string, string> = {
      '00': 'Giao dịch thành công',
      '07': 'Trừ tiền thành công. Giao dịch bị nghi ngờ (liên quan tới lừa đảo, giao dịch bất thường).',
      '09': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng chưa đăng ký dịch vụ InternetBanking tại ngân hàng.',
      '10': 'Giao dịch không thành công do: Khách hàng xác thực thông tin thẻ/tài khoản không đúng quá 3 lần',
      '11': 'Giao dịch không thành công do: Đã hết hạn chờ thanh toán. Xin quý khách vui lòng thực hiện lại giao dịch.',
      '12': 'Giao dịch không thành công do: Thẻ/Tài khoản của khách hàng bị khóa.',
      '13': 'Giao dịch không thành công do Quý khách nhập sai mật khẩu xác thực giao dịch (OTP).',
      '24': 'Giao dịch không thành công do: Khách hàng hủy giao dịch',
      '51': 'Giao dịch không thành công do: Tài khoản của quý khách không đủ số dư để thực hiện giao dịch.',
      '65': 'Giao dịch không thành công do: Tài khoản của Quý khách đã vượt quá hạn mức giao dịch trong ngày.',
      '75': 'Ngân hàng thanh toán đang bảo trì.',
      '79': 'Giao dịch không thành công do: KH nhập sai mật khẩu thanh toán quá số lần quy định.',
      '99': 'Các lỗi khác (lỗi còn lại, không có trong danh sách mã lỗi đã liệt kê)'
    }

    return messages[responseCode] || 'Lỗi không xác định'
  }
}

export default new VNPayService()