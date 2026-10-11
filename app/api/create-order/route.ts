import { NextResponse } from 'next/server';

// This legacy endpoint has been retired. Use /api/payments/create-order instead.
export async function POST() {
    return NextResponse.json(
        { error: 'This endpoint is no longer available. Use /api/payments/create-order.' },
        { status: 410 },
    );
}
