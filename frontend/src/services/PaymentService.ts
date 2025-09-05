// Dummy Payment Processing Service for CineBook
// Simulates real payment gateway functionality for development and demo purposes

export interface PaymentMethod {
  id: string;
  type: 'credit_card' | 'debit_card' | 'momo' | 'vnpay' | 'banking';
  name: string;
  icon: string;
  enabled: boolean;
  processingTime: number; // milliseconds
}

export interface CreditCardInfo {
  cardNumber: string;
  expiryMonth: string;
  expiryYear: string;
  cvv: string;
  cardholderName: string;
}

export interface PaymentRequest {
  amount: number;
  currency: string;
  bookingId: string;
  paymentMethod: PaymentMethod;
  cardInfo?: CreditCardInfo;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  metadata?: Record<string, any>;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  paymentId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  message: string;
  errorCode?: string;
  processingTime: number;
  timestamp: number;
  receiptUrl?: string;
}

export interface PaymentStatus {
  paymentId: string;
  status: PaymentResponse['status'];
  amount: number;
  currency: string;
  transactionId: string;
  createdAt: number;
  completedAt?: number;
  failureReason?: string;
}

class PaymentService {
  private static instance: PaymentService;
  private payments: Map<string, PaymentStatus>;
  private methods: PaymentMethod[];

  private constructor() {
    this.payments = new Map();
    this.methods = this.initializePaymentMethods();
  }

  public static getInstance(): PaymentService {
    if (!PaymentService.instance) {
      PaymentService.instance = new PaymentService();
    }
    return PaymentService.instance;
  }

  // Initialize available payment methods
  private initializePaymentMethods(): PaymentMethod[] {
    return [
      {
        id: 'visa',
        type: 'credit_card',
        name: 'Visa Credit Card',
        icon: '💳',
        enabled: true,
        processingTime: 2000
      },
      {
        id: 'mastercard',
        type: 'credit_card',
        name: 'Mastercard',
        icon: '💳',
        enabled: true,
        processingTime: 1800
      },
      {
        id: 'momo',
        type: 'momo',
        name: 'MoMo Wallet',
        icon: '📱',
        enabled: true,
        processingTime: 1500
      },
      {
        id: 'vnpay',
        type: 'vnpay',
        name: 'VNPay',
        icon: '🏦',
        enabled: true,
        processingTime: 3000
      },
      {
        id: 'banking',
        type: 'banking',
        name: 'Internet Banking',
        icon: '🏪',
        enabled: true,
        processingTime: 5000
      }
    ];
  }

  // Get available payment methods
  public getPaymentMethods(): PaymentMethod[] {
    return this.methods.filter(method => method.enabled);
  }

  // Validate credit card information
  private validateCreditCard(cardInfo: CreditCardInfo): { valid: boolean; error?: string } {
    // Card number validation (dummy - accepts specific test numbers)
    const testCardNumbers = [
      '4111111111111111', // Visa test
      '5555555555554444', // Mastercard test
      '4000000000000002', // Declined test card
      '4000000000000119', // Insufficient funds test
    ];

    if (!cardInfo.cardNumber || cardInfo.cardNumber.length < 13) {
      return { valid: false, error: 'Invalid card number' };
    }

    if (!cardInfo.expiryMonth || !cardInfo.expiryYear) {
      return { valid: false, error: 'Invalid expiry date' };
    }

    if (!cardInfo.cvv || cardInfo.cvv.length < 3) {
      return { valid: false, error: 'Invalid CVV' };
    }

    if (!cardInfo.cardholderName) {
      return { valid: false, error: 'Cardholder name is required' };
    }

    // Check expiry date
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth() + 1;
    
    const expiryYear = parseInt(cardInfo.expiryYear);
    const expiryMonth = parseInt(cardInfo.expiryMonth);

    if (expiryYear < currentYear || (expiryYear === currentYear && expiryMonth < currentMonth)) {
      return { valid: false, error: 'Card has expired' };
    }

    return { valid: true };
  }

  // Simulate payment processing
  public async processPayment(request: PaymentRequest): Promise<PaymentResponse> {
    const paymentId = this.generatePaymentId();
    const transactionId = this.generateTransactionId();

    // Create payment status
    const paymentStatus: PaymentStatus = {
      paymentId,
      status: 'pending',
      amount: request.amount,
      currency: request.currency,
      transactionId,
      createdAt: Date.now()
    };

    this.payments.set(paymentId, paymentStatus);

    // Update status to processing
    paymentStatus.status = 'processing';

    try {
      // Validate payment method
      const method = this.methods.find(m => m.id === request.paymentMethod.id);
      if (!method) {
        throw new Error('Invalid payment method');
      }

      // Validate card info for credit/debit cards
      if (method.type === 'credit_card' || method.type === 'debit_card') {
        if (!request.cardInfo) {
          throw new Error('Card information is required');
        }

        const validation = this.validateCreditCard(request.cardInfo);
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid card information');
        }

        // Simulate specific card scenarios
        if (request.cardInfo.cardNumber === '4000000000000002') {
          throw new Error('Transaction declined by bank');
        }
        if (request.cardInfo.cardNumber === '4000000000000119') {
          throw new Error('Insufficient funds');
        }
      }

      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, method.processingTime));

      // Simulate random failure (5% chance)
      if (Math.random() < 0.05) {
        throw new Error('Payment gateway timeout');
      }

      // Success scenario
      paymentStatus.status = 'completed';
      paymentStatus.completedAt = Date.now();

      const response: PaymentResponse = {
        success: true,
        transactionId,
        paymentId,
        status: 'completed',
        amount: request.amount,
        currency: request.currency,
        message: 'Payment processed successfully',
        processingTime: method.processingTime,
        timestamp: Date.now(),
        receiptUrl: this.generateReceiptUrl(paymentId)
      };

      console.log('Payment successful:', response);
      return response;

    } catch (error) {
      // Failure scenario
      paymentStatus.status = 'failed';
      paymentStatus.failureReason = error instanceof Error ? error.message : 'Unknown error';

      const response: PaymentResponse = {
        success: false,
        transactionId,
        paymentId,
        status: 'failed',
        amount: request.amount,
        currency: request.currency,
        message: error instanceof Error ? error.message : 'Payment failed',
        errorCode: this.getErrorCode(error instanceof Error ? error.message : 'Unknown error'),
        processingTime: request.paymentMethod.processingTime,
        timestamp: Date.now()
      };

      console.error('Payment failed:', response);
      return response;
    }
  }

  // Get payment status
  public getPaymentStatus(paymentId: string): PaymentStatus | null {
    return this.payments.get(paymentId) || null;
  }

  // Cancel payment (if still processing)
  public async cancelPayment(paymentId: string): Promise<boolean> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      return false;
    }

    if (payment.status === 'processing' || payment.status === 'pending') {
      payment.status = 'cancelled';
      return true;
    }

    return false;
  }

  // Refund payment (dummy implementation)
  public async refundPayment(paymentId: string, amount?: number): Promise<PaymentResponse> {
    const payment = this.payments.get(paymentId);
    if (!payment) {
      throw new Error('Payment not found');
    }

    if (payment.status !== 'completed') {
      throw new Error('Cannot refund uncompleted payment');
    }

    const refundAmount = amount || payment.amount;
    if (refundAmount > payment.amount) {
      throw new Error('Refund amount cannot exceed original payment');
    }

    // Simulate refund processing
    await new Promise(resolve => setTimeout(resolve, 2000));

    const refundId = this.generateTransactionId();
    
    return {
      success: true,
      transactionId: refundId,
      paymentId: `refund_${paymentId}`,
      status: 'completed',
      amount: refundAmount,
      currency: payment.currency,
      message: 'Refund processed successfully',
      processingTime: 2000,
      timestamp: Date.now()
    };
  }

  // Get test card numbers for development
  public getTestCardNumbers(): { [key: string]: string } {
    return {
      'visa_success': '4111111111111111',
      'mastercard_success': '5555555555554444',
      'declined': '4000000000000002',
      'insufficient_funds': '4000000000000119'
    };
  }

  // Get payment history
  public getPaymentHistory(): PaymentStatus[] {
    return Array.from(this.payments.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  // Clear payment history (for testing)
  public clearPaymentHistory(): void {
    this.payments.clear();
  }

  // Generate unique payment ID
  private generatePaymentId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `pay_${timestamp}_${random}`.toUpperCase();
  }

  // Generate unique transaction ID
  private generateTransactionId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 9);
    return `txn_${timestamp}_${random}`.toUpperCase();
  }

  // Generate receipt URL
  private generateReceiptUrl(paymentId: string): string {
    return `/api/payments/${paymentId}/receipt`;
  }

  // Map error messages to error codes
  private getErrorCode(message: string): string {
    const errorMap: { [key: string]: string } = {
      'Invalid card number': 'INVALID_CARD',
      'Invalid expiry date': 'INVALID_EXPIRY',
      'Invalid CVV': 'INVALID_CVV',
      'Card has expired': 'CARD_EXPIRED',
      'Transaction declined by bank': 'DECLINED',
      'Insufficient funds': 'INSUFFICIENT_FUNDS',
      'Payment gateway timeout': 'GATEWAY_TIMEOUT',
      'Invalid payment method': 'INVALID_METHOD'
    };

    return errorMap[message] || 'UNKNOWN_ERROR';
  }

  // Format amount for display
  public formatAmount(amount: number, currency: string = 'VND'): string {
    if (currency === 'VND') {
      return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        minimumFractionDigits: 0
      }).format(amount);
    }

    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency
    }).format(amount);
  }

  // Validate payment amount
  public validateAmount(amount: number): { valid: boolean; error?: string } {
    if (amount <= 0) {
      return { valid: false, error: 'Amount must be greater than 0' };
    }

    if (amount > 50000000) { // 50 million VND limit
      return { valid: false, error: 'Amount exceeds maximum limit' };
    }

    return { valid: true };
  }
}

// Export singleton instance
export const paymentService = PaymentService.getInstance();

// React Hook for payment processing
export function usePayment() {
  const processPayment = async (request: PaymentRequest): Promise<PaymentResponse> => {
    return paymentService.processPayment(request);
  };

  const getPaymentStatus = (paymentId: string): PaymentStatus | null => {
    return paymentService.getPaymentStatus(paymentId);
  };

  const cancelPayment = async (paymentId: string): Promise<boolean> => {
    return paymentService.cancelPayment(paymentId);
  };

  const refundPayment = async (paymentId: string, amount?: number): Promise<PaymentResponse> => {
    return paymentService.refundPayment(paymentId, amount);
  };

  const getPaymentMethods = (): PaymentMethod[] => {
    return paymentService.getPaymentMethods();
  };

  const formatAmount = (amount: number, currency?: string): string => {
    return paymentService.formatAmount(amount, currency);
  };

  const validateAmount = (amount: number) => {
    return paymentService.validateAmount(amount);
  };

  return {
    processPayment,
    getPaymentStatus,
    cancelPayment,
    refundPayment,
    getPaymentMethods,
    formatAmount,
    validateAmount
  };
}

export default paymentService;