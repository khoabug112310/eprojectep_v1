// Payment Status Component for CineBook
// Displays payment processing status and results

import React, { useState, useEffect } from 'react';
import { PaymentResponse, PaymentStatus as PaymentStatusType, usePayment } from '../../services/PaymentService';

interface PaymentStatusProps {
  paymentResponse?: PaymentResponse;
  paymentId?: string;
  onRetry?: () => void;
  onContinue?: () => void;
  onCancel?: () => void;
  className?: string;
}

interface StatusDisplayConfig {
  icon: string;
  color: string;
  title: string;
  description: string;
  showActions: boolean;
}

export function PaymentStatus({
  paymentResponse,
  paymentId,
  onRetry,
  onContinue,
  onCancel,
  className = ''
}: PaymentStatusProps) {
  const [status, setStatus] = useState<PaymentStatusType | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { getPaymentStatus, formatAmount } = usePayment();

  useEffect(() => {
    if (paymentId && !paymentResponse) {
      // Fetch payment status if only ID provided
      const fetchStatus = () => {
        const paymentStatus = getPaymentStatus(paymentId);
        setStatus(paymentStatus);
      };

      fetchStatus();
      
      // Poll for status updates if payment is processing
      const statusPolling = setInterval(() => {
        const paymentStatus = getPaymentStatus(paymentId);
        setStatus(paymentStatus);
        
        if (paymentStatus && ['completed', 'failed', 'cancelled'].includes(paymentStatus.status)) {
          clearInterval(statusPolling);
        }
      }, 1000);

      return () => clearInterval(statusPolling);
    }
  }, [paymentId, paymentResponse, getPaymentStatus]);

  // Get status configuration
  const getStatusConfig = (): StatusDisplayConfig => {
    const currentStatus = paymentResponse?.status || status?.status;

    switch (currentStatus) {
      case 'pending':
        return {
          icon: '⏳',
          color: 'orange',
          title: 'Payment Pending',
          description: 'Your payment is being initialized...',
          showActions: false
        };

      case 'processing':
        return {
          icon: '⚡',
          color: 'blue',
          title: 'Processing Payment',
          description: 'Please wait while we process your payment. This may take a few moments.',
          showActions: false
        };

      case 'completed':
        return {
          icon: '✅',
          color: 'green',
          title: 'Payment Successful!',
          description: 'Your payment has been processed successfully. Your booking is confirmed.',
          showActions: true
        };

      case 'failed':
        return {
          icon: '❌',
          color: 'red',
          title: 'Payment Failed',
          description: paymentResponse?.message || status?.failureReason || 'Your payment could not be processed.',
          showActions: true
        };

      case 'cancelled':
        return {
          icon: '🚫',
          color: 'gray',
          title: 'Payment Cancelled',
          description: 'The payment process was cancelled.',
          showActions: true
        };

      default:
        return {
          icon: '❓',
          color: 'gray',
          title: 'Unknown Status',
          description: 'Payment status is unknown.',
          showActions: false
        };
    }
  };

  const statusConfig = getStatusConfig();
  const currentPayment = paymentResponse || status;

  if (!currentPayment) {
    return (
      <div className={`payment-status payment-status--loading ${className}`}>
        <div className="payment-status__content">
          <div className="loading-spinner"></div>
          <h2>Loading payment information...</h2>
        </div>
      </div>
    );
  }

  const isSuccess = currentPayment.status === 'completed';
  const isFailed = currentPayment.status === 'failed';
  const isProcessing = currentPayment.status === 'processing' || currentPayment.status === 'pending';

  return (
    <div className={`payment-status payment-status--${statusConfig.color} ${className}`}>
      <div className="payment-status__content">
        {/* Status Icon and Title */}
        <div className="payment-status__header">
          <div className={`status-icon status-icon--${statusConfig.color}`}>
            {isProcessing ? (
              <div className="loading-spinner"></div>
            ) : (
              <span>{statusConfig.icon}</span>
            )}
          </div>
          <h2 className="status-title">{statusConfig.title}</h2>
          <p className="status-description">{statusConfig.description}</p>
        </div>

        {/* Payment Details */}
        <div className="payment-status__details">
          <div className="detail-card">
            <h3>Payment Information</h3>
            <div className="detail-grid">
              <div className="detail-item">
                <label>Amount:</label>
                <span className="amount">
                  {formatAmount(currentPayment.amount, 'currency' in currentPayment ? currentPayment.currency : 'VND')}
                </span>
              </div>
              
              {currentPayment.status && (
                <div className="detail-item">
                  <label>Status:</label>
                  <span className={`status-badge status-badge--${statusConfig.color}`}>
                    {currentPayment.status.charAt(0).toUpperCase() + currentPayment.status.slice(1)}
                  </span>
                </div>
              )}

              {'transactionId' in currentPayment && currentPayment.transactionId && (
                <div className="detail-item">
                  <label>Transaction ID:</label>
                  <span className="transaction-id">{currentPayment.transactionId}</span>
                </div>
              )}

              {'paymentId' in paymentResponse && paymentResponse.paymentId && (
                <div className="detail-item">
                  <label>Payment ID:</label>
                  <span className="payment-id">{paymentResponse.paymentId}</span>
                </div>
              )}

              <div className="detail-item">
                <label>Date & Time:</label>
                <span>
                  {new Date(
                    'timestamp' in currentPayment 
                      ? currentPayment.timestamp 
                      : currentPayment.createdAt
                  ).toLocaleString()}
                </span>
              </div>

              {'processingTime' in paymentResponse && paymentResponse.processingTime && (
                <div className="detail-item">
                  <label>Processing Time:</label>
                  <span>{(paymentResponse.processingTime / 1000).toFixed(1)}s</span>
                </div>
              )}
            </div>
          </div>

          {/* Error Details (for failed payments) */}
          {isFailed && 'errorCode' in paymentResponse && paymentResponse.errorCode && (
            <div className="detail-card error-details">
              <h3>Error Details</h3>
              <div className="error-info">
                <div className="error-code">Error Code: {paymentResponse.errorCode}</div>
                <div className="error-message">{paymentResponse.message}</div>
                
                {/* Helpful suggestions based on error code */}
                <div className="error-suggestions">
                  {paymentResponse.errorCode === 'INVALID_CARD' && (
                    <p>💡 Please check your card number and try again.</p>
                  )}
                  {paymentResponse.errorCode === 'CARD_EXPIRED' && (
                    <p>💡 Your card has expired. Please use a different card.</p>
                  )}
                  {paymentResponse.errorCode === 'INSUFFICIENT_FUNDS' && (
                    <p>💡 Insufficient funds. Please use a different payment method.</p>
                  )}
                  {paymentResponse.errorCode === 'DECLINED' && (
                    <p>💡 Transaction was declined by your bank. Please contact your bank or try a different card.</p>
                  )}
                  {paymentResponse.errorCode === 'GATEWAY_TIMEOUT' && (
                    <p>💡 Payment gateway timeout. Please try again in a few minutes.</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Receipt Link (for successful payments) */}
          {isSuccess && 'receiptUrl' in paymentResponse && paymentResponse.receiptUrl && (
            <div className="detail-card receipt-info">
              <h3>Receipt</h3>
              <a 
                href={paymentResponse.receiptUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="receipt-link"
              >
                📄 Download Receipt
              </a>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        {statusConfig.showActions && (
          <div className="payment-status__actions">
            {isSuccess && onContinue && (
              <button 
                className="btn btn-primary"
                onClick={onContinue}
              >
                Continue to Booking
              </button>
            )}

            {isFailed && onRetry && (
              <button 
                className="btn btn-primary"
                onClick={onRetry}
              >
                Try Again
              </button>
            )}

            {(isFailed || currentPayment.status === 'cancelled') && onCancel && (
              <button 
                className="btn btn-secondary"
                onClick={onCancel}
              >
                Cancel Booking
              </button>
            )}
          </div>
        )}

        {/* Processing Message */}
        {isProcessing && (
          <div className="processing-message">
            <div className="processing-dots">
              <span></span>
              <span></span>
              <span></span>
            </div>
            <p>Please do not refresh or close this page while payment is being processed.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default PaymentStatus;