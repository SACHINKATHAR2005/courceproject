import { NextResponse } from 'next/server';

export async function POST() {
    return NextResponse.json(
        { error: 'Student accounts are created by an admin or instructor.' },
        { status: 403 },
    );
}
