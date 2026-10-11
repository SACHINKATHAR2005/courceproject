export const PAYMENT_PROCESSING_RATE = 0.0236; // 2.36% platform processing fee

export function getCoursePaymentBreakdown(baseFee: number) {
    const normalizedBase = Math.max(0, Number(baseFee) || 0);
    const processingFee = Math.round(normalizedBase * PAYMENT_PROCESSING_RATE * 100) / 100;
    return {
        baseFee: normalizedBase,
        processingFee,
        total: normalizedBase + processingFee,
    };
}
