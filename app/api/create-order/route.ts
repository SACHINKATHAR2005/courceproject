import { NextResponse } from 'next/server';
import Razorpay from 'razorpay';

export async function POST(request: Request) {
  try {
    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keyId || !keySecret) {
      return NextResponse.json(
        { error: 'Razorpay credentials are not configured on the server.' },
        { status: 500 }
      );
    }

    let body: { amount?: number; currency?: string; receipt?: string } = {};
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const { amount, currency = 'INR', receipt } = body;

    // Minimum amount validation: 100 paise (1 INR)
    if (typeof amount !== 'number' || isNaN(amount) || amount < 100) {
      return NextResponse.json(
        { error: 'Invalid amount. Minimum amount is 100 paise (₹1.00).' },
        { status: 400 }
      );
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const safeReceipt = (receipt || `rcpt_${Date.now()}`).slice(0, 40);

    const order = await razorpay.orders.create({
      amount: Math.round(amount),
      currency: currency.toUpperCase(),
      receipt: safeReceipt,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: unknown) {
    console.error('Razorpay create-order error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create Razorpay order.';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
