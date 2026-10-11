import nodemailer from 'nodemailer';

function getMailFrom() {
    const address = process.env.MAIL_FROM_ADDRESS || process.env.MAIL_FROM;
    if (!address) return undefined;
    return process.env.MAIL_FROM_ADDRESS
        ? `${process.env.MAIL_FROM_NAME || 'LearnHub'} <${address}>`
        : address;
}

function escapeHtml(value: string) {
    return value.replace(/[&<>'"]/g, (c) => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;',
    }[c] || c));
}

export interface ReceiptData {
    toEmail: string;
    studentName: string;
    courseTitle: string;
    baseFee: number;        // in rupees
    processingFee: number;  // in rupees
    totalFee: number;       // in rupees
    razorpayPaymentId: string;
    razorpayOrderId: string;
    paidAt: string;         // ISO string
}

export async function sendPaymentReceiptEmail(data: ReceiptData): Promise<void> {
    const host = process.env.SMTP_HOST;
    const user = process.env.SMTP_USER;
    const password = process.env.SMTP_PASSWORD;
    const from = getMailFrom();
    if (!host || !user || !password || !from) return; // silently skip if email not configured

    const mailer = nodemailer.createTransport({
        host,
        port: Number(process.env.SMTP_PORT || 587),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user, pass: password },
    });

    const safeName = escapeHtml(data.studentName);
    const safeCourse = escapeHtml(data.courseTitle);
    const paidDate = new Date(data.paidAt).toLocaleString('en-IN', { dateStyle: 'long', timeStyle: 'short' });

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: Arial, sans-serif; background: #f8fafc; padding: 32px; color: #0f172a;">
  <div style="max-width: 520px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.07);">
    <div style="background: #1e3a5f; padding: 28px 32px;">
      <h1 style="margin: 0; color: #b08d57; font-size: 22px; font-weight: 700;">LearnHub Certify</h1>
      <p style="margin: 4px 0 0; color: #94a3b8; font-size: 13px;">Payment Receipt</p>
    </div>
    <div style="padding: 32px;">
      <p style="font-size: 15px; margin: 0 0 20px;">Hi <strong>${safeName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; margin: 0 0 24px;">Your payment was successful and you are now enrolled in:</p>

      <div style="background: #f1f5f9; border-radius: 8px; padding: 18px 20px; margin-bottom: 24px;">
        <p style="font-size: 16px; font-weight: 700; margin: 0 0 4px; color: #0f172a;">${safeCourse}</p>
        <p style="font-size: 12px; color: #64748b; margin: 0;">Course enrollment confirmed</p>
      </div>

      <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-bottom: 24px;">
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #475569;">Course fee</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600;">&#8377;${data.baseFee.toFixed(2)}</td>
        </tr>
        <tr style="border-bottom: 1px solid #e2e8f0;">
          <td style="padding: 10px 0; color: #475569;">Platform fee (2.36%)</td>
          <td style="padding: 10px 0; text-align: right; font-weight: 600;">&#8377;${data.processingFee.toFixed(2)}</td>
        </tr>
        <tr>
          <td style="padding: 14px 0 4px; font-weight: 700; font-size: 15px;">Total paid</td>
          <td style="padding: 14px 0 4px; text-align: right; font-weight: 700; font-size: 15px; color: #15803d;">&#8377;${data.totalFee.toFixed(2)}</td>
        </tr>
      </table>

      <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 16px; font-size: 12px; color: #64748b; margin-bottom: 24px;">
        <p style="margin: 0 0 4px;"><strong>Payment ID:</strong> ${escapeHtml(data.razorpayPaymentId)}</p>
        <p style="margin: 0 0 4px;"><strong>Order ID:</strong> ${escapeHtml(data.razorpayOrderId)}</p>
        <p style="margin: 0;"><strong>Date:</strong> ${paidDate}</p>
      </div>

      <p style="font-size: 13px; color: #475569; margin: 0;">Please keep this email as your payment receipt. If you have any questions, contact support.</p>
    </div>
    <div style="background: #f1f5f9; padding: 18px 32px; text-align: center; font-size: 11px; color: #94a3b8;">
      &copy; ${new Date().getFullYear()} LearnHub Certify. All rights reserved.
    </div>
  </div>
</body>
</html>`;

    const text = `Hi ${data.studentName},

Payment Receipt - LearnHub Certify

Course: ${data.courseTitle}

Course fee:        ₹${data.baseFee.toFixed(2)}
Platform fee (2.36%): ₹${data.processingFee.toFixed(2)}
Total paid:        ₹${data.totalFee.toFixed(2)}

Payment ID: ${data.razorpayPaymentId}
Order ID: ${data.razorpayOrderId}
Date: ${paidDate}

Please keep this email as your payment receipt.
`;

    await mailer.sendMail({
        from,
        to: data.toEmail,
        subject: `Payment Receipt — ${data.courseTitle} | LearnHub`,
        text,
        html,
    });
}
