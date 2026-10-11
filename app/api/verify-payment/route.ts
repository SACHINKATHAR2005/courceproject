import { NextResponse } from 'next/server';

// This legacy endpoint has been retired. Use /api/payments/verify instead.
export async function POST() {
    return NextResponse.json(
        { error: 'This endpoint is no longer available. Use /api/payments/verify.' },
        { status: 410 },
    );
}
