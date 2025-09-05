// Payment Form Component for CineBook Booking Process
// Handles dummy payment processing with realistic UI and validation

import React, { useState, useEffect, useCallback } from 'react';
import { usePayment, PaymentMethod, CreditCardInfo, PaymentRequest, PaymentResponse } from '../../services/PaymentService';

interface PaymentFormProps {
  amount: number;
  currency?: string;
  bookingId: string;
  customerInfo: {
    name: string;
    email: string;
    phone?: string;
  };
  onPaymentSuccess: (response: PaymentResponse) => void;
  onPaymentError: (error: string) => void;
  onCancel?: () => void;
  className?: string;
}

interface FormErrors {
  paymentMethod?: string;
  cardNumber?: string;
  expiryMonth?: string;
  expiryYear?: string;
  cvv?: string;
  cardholderName?: string;
}

export function PaymentForm({
  amount,
  currency = 'VND',
  bookingId,
  customerInfo,
  onPaymentSuccess,
  onPaymentError,
  onCancel,
  className = ''
}: PaymentFormProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [cardInfo, setCardInfo] = useState<CreditCardInfo>({
    cardNumber: '',
    expiryMonth: '',
    expiryYear: '',
    cvv: '',
    cardholderName: ''
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showTestCards, setShowTestCards] = useState(false);

  const {
    processPayment,
    getPaymentMethods,
    formatAmount,
    validateAmount
  } = usePayment();

  const paymentMethods = getPaymentMethods();

  useEffect(() => {
    // Pre-select first payment method
    if (paymentMethods.length > 0 && !selectedMethod) {
      setSelectedMethod(paymentMethods[0]);
    }
  }, [paymentMethods, selectedMethod]);

  // Validate card number format
  const validateCardNumber = (cardNumber: string): boolean => {
    const cleaned = cardNumber.replace(/\s/g, '');
    return /^\d{13,19}$/.test(cleaned);
  };

  // Format card number with spaces
  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  // Handle card number input
  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 19) {
      setCardInfo(prev => ({ ...prev, cardNumber: value }));
      if (errors.cardNumber) {
        setErrors(prev => ({ ...prev, cardNumber: undefined }));
      }
    }
  };

  // Handle expiry month change
  const handleExpiryMonthChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCardInfo(prev => ({ ...prev, expiryMonth: e.target.value }));
    if (errors.expiryMonth) {
      setErrors(prev => ({ ...prev, expiryMonth: undefined }));
    }
  };

  // Handle expiry year change
  const handleExpiryYearChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setCardInfo(prev => ({ ...prev, expiryYear: e.target.value }));
    if (errors.expiryYear) {
      setErrors(prev => ({ ...prev, expiryYear: undefined }));
    }
  };

  // Handle CVV change
  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setCardInfo(prev => ({ ...prev, cvv: value }));
      if (errors.cvv) {
        setErrors(prev => ({ ...prev, cvv: undefined }));
      }
    }
  };

  // Handle cardholder name change
  const handleCardholderNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCardInfo(prev => ({ ...prev, cardholderName: e.target.value }));
    if (errors.cardholderName) {
      setErrors(prev => ({ ...prev, cardholderName: undefined }));
    }
  };

  // Validate form
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!selectedMethod) {
      newErrors.paymentMethod = 'Please select a payment method';
    }

    // Validate card info for credit/debit cards
    if (selectedMethod && (selectedMethod.type === 'credit_card' || selectedMethod.type === 'debit_card')) {
      if (!cardInfo.cardNumber) {
        newErrors.cardNumber = 'Card number is required';
      } else if (!validateCardNumber(cardInfo.cardNumber)) {
        newErrors.cardNumber = 'Invalid card number format';
      }

      if (!cardInfo.expiryMonth) {
        newErrors.expiryMonth = 'Expiry month is required';
      }

      if (!cardInfo.expiryYear) {
        newErrors.expiryYear = 'Expiry year is required';
      }

      if (!cardInfo.cvv) {
        newErrors.cvv = 'CVV is required';
      } else if (cardInfo.cvv.length < 3) {
        newErrors.cvv = 'CVV must be at least 3 digits';
      }

      if (!cardInfo.cardholderName) {
        newErrors.cardholderName = 'Cardholder name is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm() || !selectedMethod) {
      return;
    }

    // Validate amount
    const amountValidation = validateAmount(amount);
    if (!amountValidation.valid) {
      onPaymentError(amountValidation.error || 'Invalid amount');
      return;
    }

    setIsProcessing(true);

    try {
      const paymentRequest: PaymentRequest = {
        amount,
        currency,
        bookingId,
        paymentMethod: selectedMethod,
        customerInfo,
        cardInfo: (selectedMethod.type === 'credit_card' || selectedMethod.type === 'debit_card') 
          ? cardInfo 
          : undefined,
        metadata: {
          userAgent: navigator.userAgent,
          timestamp: Date.now()
        }
      };

      const response = await processPayment(paymentRequest);

      if (response.success) {
        onPaymentSuccess(response);
      } else {
        onPaymentError(response.message);
      }
    } catch (error) {
      onPaymentError(error instanceof Error ? error.message : 'Payment failed');
    } finally {
      setIsProcessing(false);
    }
  };

  // Fill test card data
  const fillTestCard = (cardNumber: string) => {
    setCardInfo({
      cardNumber,
      expiryMonth: '12',
      expiryYear: '2025',
      cvv: '123',
      cardholderName: 'Test User'
    });
    setShowTestCards(false);
  };

  // Generate years for expiry dropdown
  const getExpiryYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = 0; i < 10; i++) {
      years.push(currentYear + i);
    }
    return years;
  };

  const needsCardInfo = selectedMethod && (selectedMethod.type === 'credit_card' || selectedMethod.type === 'debit_card');

  return (
    <div className={`payment-form ${className}`}>
      <form onSubmit={handleSubmit} className="payment-form__form">
        {/* Payment Amount */}
        <div className="payment-form__amount">
          <h3>Payment Amount</h3>
          <div className="amount-display">
            {formatAmount(amount, currency)}
          </div>
        </div>

        {/* Payment Methods */}
        <div className="payment-form__methods">
          <h3>Payment Method</h3>
          <div className="payment-methods-grid">
            {paymentMethods.map(method => (
              <button
                key={method.id}
                type="button"
                className={`payment-method ${selectedMethod?.id === method.id ? 'payment-method--selected' : ''}`}
                onClick={() => setSelectedMethod(method)}
              >
                <span className="payment-method__icon">{method.icon}</span>
                <span className="payment-method__name">{method.name}</span>
              </button>
            ))}
          </div>
          {errors.paymentMethod && (
            <div className="error-message">{errors.paymentMethod}</div>
          )}
        </div>

        {/* Card Information (for credit/debit cards) */}
        {needsCardInfo && (
          <div className="payment-form__card-info">
            <div className="card-info-header">
              <h3>Card Information</h3>
              {process.env.NODE_ENV === 'development' && (
                <button
                  type="button"
                  className="test-cards-toggle"
                  onClick={() => setShowTestCards(!showTestCards)}
                >
                  🧪 Test Cards
                </button>
              )}
            </div>

            {showTestCards && (
              <div className="test-cards">
                <h4>Test Card Numbers:</h4>
                <div className="test-card-list">
                  <button type="button" onClick={() => fillTestCard('4111111111111111')}>
                    4111 1111 1111 1111 (Success)
                  </button>
                  <button type="button" onClick={() => fillTestCard('5555555555554444')}>
                    5555 5555 5555 4444 (Success)
                  </button>
                  <button type="button" onClick={() => fillTestCard('4000000000000002')}>
                    4000 0000 0000 0002 (Declined)
                  </button>
                  <button type="button" onClick={() => fillTestCard('4000000000000119')}>
                    4000 0000 0000 0119 (Insufficient Funds)
                  </button>
                </div>
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cardNumber">Card Number</label>
                <input
                  id="cardNumber"
                  type="text"
                  value={formatCardNumber(cardInfo.cardNumber)}
                  onChange={handleCardNumberChange}
                  placeholder="1234 5678 9012 3456"
                  className={errors.cardNumber ? 'error' : ''}
                  autoComplete="cc-number"
                />
                {errors.cardNumber && (
                  <div className="error-message">{errors.cardNumber}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="expiryMonth">Expiry Month</label>
                <select
                  id="expiryMonth"
                  value={cardInfo.expiryMonth}
                  onChange={handleExpiryMonthChange}
                  className={errors.expiryMonth ? 'error' : ''}
                  autoComplete="cc-exp-month"
                >
                  <option value="">Month</option>
                  {Array.from({ length: 12 }, (_, i) => {
                    const month = (i + 1).toString().padStart(2, '0');
                    return (
                      <option key={month} value={month}>
                        {month}
                      </option>
                    );
                  })}
                </select>
                {errors.expiryMonth && (
                  <div className="error-message">{errors.expiryMonth}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="expiryYear">Expiry Year</label>
                <select
                  id="expiryYear"
                  value={cardInfo.expiryYear}
                  onChange={handleExpiryYearChange}
                  className={errors.expiryYear ? 'error' : ''}
                  autoComplete="cc-exp-year"
                >
                  <option value="">Year</option>
                  {getExpiryYears().map(year => (
                    <option key={year} value={year}>
                      {year}
                    </option>
                  ))}
                </select>
                {errors.expiryYear && (
                  <div className="error-message">{errors.expiryYear}</div>
                )}
              </div>

              <div className="form-group">
                <label htmlFor="cvv">CVV</label>
                <input
                  id="cvv"
                  type="text"
                  value={cardInfo.cvv}
                  onChange={handleCvvChange}
                  placeholder="123"
                  className={errors.cvv ? 'error' : ''}
                  autoComplete="cc-csc"
                />
                {errors.cvv && (
                  <div className="error-message">{errors.cvv}</div>
                )}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="cardholderName">Cardholder Name</label>
                <input
                  id="cardholderName"
                  type="text"
                  value={cardInfo.cardholderName}
                  onChange={handleCardholderNameChange}
                  placeholder="John Doe"
                  className={errors.cardholderName ? 'error' : ''}
                  autoComplete="cc-name"
                />
                {errors.cardholderName && (
                  <div className="error-message">{errors.cardholderName}</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Customer Information Display */}
        <div className="payment-form__customer">
          <h3>Customer Information</h3>
          <div className="customer-info">
            <div className="info-item">
              <label>Name:</label>
              <span>{customerInfo.name}</span>
            </div>
            <div className="info-item">
              <label>Email:</label>
              <span>{customerInfo.email}</span>
            </div>
            {customerInfo.phone && (
              <div className="info-item">
                <label>Phone:</label>
                <span>{customerInfo.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Payment Processing Info */}
        {selectedMethod && (
          <div className="payment-form__info">
            <div className="processing-time">
              <span>🕒 Processing time: ~{Math.ceil(selectedMethod.processingTime / 1000)} seconds</span>
            </div>
            <div className="security-notice">
              <span>🔒 This is a dummy payment system for demo purposes only</span>
            </div>
          </div>
        )}

        {/* Form Actions */}
        <div className="payment-form__actions">
          {onCancel && (
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onCancel}
              disabled={isProcessing}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isProcessing || !selectedMethod}
          >
            {isProcessing ? (
              <>
                <span className="loading-spinner"></span>
                Processing Payment...
              </>
            ) : (
              `Pay ${formatAmount(amount, currency)}`
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

export default PaymentForm;