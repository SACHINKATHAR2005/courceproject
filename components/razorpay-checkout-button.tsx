'use client';

import React, { useState } from 'react';
import { CreditCard, Loader2 } from 'lucide-react';
import type { RazorpayCheckoutOptions } from '@/lib/services/paymentService';

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

interface RazorpayFailedResponse {
  error?: {
    code?: string;
    description?: string;
    source?: string;
    step?: string;
    reason?: string;
    metadata?: {
      order_id?: string;
      payment_id?: string;
    };
  };
}

function loadRazorpayScript(): Promise<boolean> {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(false);
      return;
    }
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export interface RazorpayCheckoutButtonProps {
  amountPaise: number;
  currency?: string;
  name?: string;
  description?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  buttonText?: string;
  className?: string;
  onSuccess?: (data: { orderId: string; paymentId: string }) => void;
  onError?: (error: string) => void;
  onCancel?: () => void;
  disabled?: boolean;
}

export function RazorpayCheckoutButton({
  amountPaise,
  currency = 'INR',
  name = 'LearnHub',
  description = 'Course Enrollment Payment',
  prefill,
  buttonText,
  className,
  onSuccess,
  onError,
  onCancel,
  disabled = false,
}: RazorpayCheckoutButtonProps) {
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePayment = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      // 1. Load Razorpay script
      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded || !window.Razorpay) {
        throw new Error('Could not load Razorpay SDK. Please check your internet connection.');
      }

      // 2. Call backend /api/create-order
      const createOrderRes = await fetch('/api/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: amountPaise,
          currency,
          receipt: `rcpt_${Date.now()}`,
        }),
      });

      const orderData = await createOrderRes.json();

      if (!createOrderRes.ok || !orderData.order_id) {
        throw new Error(orderData.error || 'Failed to initialize payment order.');
      }

      const keyId =
        process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || 'rzp_test_TjVq1yIlS4dz9O';

      // 3. Open Razorpay Checkout modal
      const options: RazorpayCheckoutOptions = {
        key: keyId,
        amount: orderData.amount,
        currency: orderData.currency || 'INR',
        name,
        description,
        order_id: orderData.order_id,
        prefill: {
          name: prefill?.name || '',
          email: prefill?.email || '',
          contact: prefill?.contact || '',
        },
        theme: {
          color: '#f59e0b',
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
            if (onCancel) onCancel();
          },
        },
        handler: async (response: RazorpayResponse) => {
          try {
            // 4. Call backend /api/verify-payment to verify HMAC signature
            const verifyRes = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }),
            });

            const verifyData = await verifyRes.json();

            if (!verifyRes.ok || !verifyData.success) {
              throw new Error(verifyData.error || 'Payment signature verification failed.');
            }

            setLoading(false);
            if (onSuccess) {
              onSuccess({
                orderId: response.razorpay_order_id,
                paymentId: response.razorpay_payment_id,
              });
            }
          } catch (verifyErr: unknown) {
            setLoading(false);
            const msg = verifyErr instanceof Error ? verifyErr.message : 'Verification failed.';
            setErrorMessage(msg);
            if (onError) onError(msg);
          }
        },
      };

      const rzpInstance = new window.Razorpay(options);

      // Handle payment failure event
      if (rzpInstance.on) {
        rzpInstance.on('payment.failed', (failResponse: RazorpayFailedResponse) => {
          setLoading(false);
          const reason =
            failResponse.error?.description ||
            failResponse.error?.reason ||
            'Payment processing failed.';
          setErrorMessage(reason);
          if (onError) onError(reason);
        });
      }

      rzpInstance.open();
    } catch (err: unknown) {
      setLoading(false);
      const msg = err instanceof Error ? err.message : 'An error occurred during payment.';
      setErrorMessage(msg);
      if (onError) onError(msg);
    }
  };

  const defaultButtonLabel = `Pay ₹${(amountPaise / 100).toFixed(2)}`;

  return (
    <div className="flex flex-col gap-1.5">
      <button
        type="button"
        onClick={handlePayment}
        disabled={disabled || loading}
        className={
          className ||
          'inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer'
        }
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <CreditCard className="w-4 h-4" />
            <span>{buttonText || defaultButtonLabel}</span>
          </>
        )}
      </button>

      {errorMessage && (
        <p className="text-xs text-red-400 font-medium">{errorMessage}</p>
      )}
    </div>
  );
}
