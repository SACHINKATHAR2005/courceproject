import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const keySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!keySecret) {
      return NextResponse.json(
        { success: false, error: 'Razorpay secret key is not configured on the server.' },
        { status: 500 }
      );
    }

    let body: {
      order_id?: string;
      razorpay_order_id?: string;
      razorpay_payment_id?: string;
      payment_id?: string;
      razorpay_signature?: string;
      signature?: string;
    } = {};

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request body.' },
        { status: 400 }
      );
    }

    const orderId = body.razorpay_order_id || body.order_id;
    const paymentId = body.razorpay_payment_id || body.payment_id;
    const signature = body.razorpay_signature || body.signature;

    // Missing fields check
    if (!orderId || !paymentId || !signature) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required payment verification fields (order_id, razorpay_payment_id, razorpay_signature).',
        },
        { status: 400 }
      );
    }

    // HMAC-SHA256 signature verification
    const expectedSignature = crypto
      .createHmac('sha256', keySecret)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const expectedBuffer = Buffer.from(expectedSignature, 'utf8');
    const signatureBuffer = Buffer.from(signature, 'utf8');

    const isValid =
      expectedBuffer.length === signatureBuffer.length &&
      crypto.timingSafeEqual(expectedBuffer, signatureBuffer);

    if (!isValid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Payment verification failed: signature mismatch.',
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully.',
      order_id: orderId,
      payment_id: paymentId,
    });
  } catch (error: unknown) {
    console.error('Razorpay signature verification error:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Internal error during payment verification.';
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: 500 }
    );
  }
}
