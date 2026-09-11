interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    name: string;
    description: string;
    order_id: string;
    handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
    prefill?: { name?: string; email?: string; contact?: string };
    theme?: { color: string };
    modal?: { ondismiss?: () => void };
}

declare global {
    interface Window {
        Razorpay?: new (options: RazorpayCheckoutOptions) => { open: () => void };
    }
}

function loadRazorpay(): Promise<void> {
    if (window.Razorpay) return Promise.resolve();
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://checkout.razorpay.com/v1/checkout.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Razorpay checkout could not load.'));
        document.body.appendChild(script);
    });
}

export async function enrollInCourse(courseId: string, fee: number, student: { fullName: string; email: string; phone?: string }) {
    if (fee <= 0) {
        const response = await fetch('/api/enrollments', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ courseId }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || 'Enrollment failed.');
        return;
    }

    const orderResponse = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
    });
    const order = await orderResponse.json();
    if (!orderResponse.ok) throw new Error(order.error || 'Could not start payment.');

    await loadRazorpay();
    const RazorpayCheckout = window.Razorpay;
    if (!RazorpayCheckout) throw new Error('Razorpay checkout is unavailable.');

    await new Promise<void>((resolve, reject) => {
        const checkout = new RazorpayCheckout({
            key: order.keyId,
            amount: order.amount,
            currency: order.currency,
            name: 'LearnHub Certify',
            description: order.courseTitle,
            order_id: order.orderId,
            prefill: { name: student.fullName, email: student.email, contact: student.phone },
            theme: { color: '#f59e0b' },
            handler: async (response) => {
                try {
                    const verifyResponse = await fetch('/api/payments/verify', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ courseId, ...response }),
                    });
                    const result = await verifyResponse.json();
                    if (!verifyResponse.ok) throw new Error(result.error || 'Payment verification failed.');
                    resolve();
                } catch (error) {
                    reject(error);
                }
            },
            modal: { ondismiss: () => reject(new Error('Payment was cancelled.')) },
        });
        checkout.open();
    });
}
