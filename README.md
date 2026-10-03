This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to see the result.

## Bulk student registration

Student accounts are created by an admin or instructor. Staff can open the Students tab in either staff dashboard and upload a CSV, XLSX, or XLS file containing `name`, `email`, and `initial_password` columns. Each successful import creates the student account and registration card, then places the initial credentials in the Supabase `email_queue` table. The queue claims and sends messages one by one through Nodemailer. Failed messages can be requeued with `POST /api/staff/email-queue/process` and the JSON body `{ "retryFailed": true }`.

Run the updated `supabase/schema.sql` in the Supabase SQL editor before using bulk import. It creates the queue table and prevents more than one certificate for the same student and course.

Configure these server-only variables in `.env.local` before importing students:

```env
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-smtp-username
SMTP_PASSWORD=your-smtp-password
MAIL_FROM_NAME=LearnHub
MAIL_FROM_ADDRESS=no-reply@your-verified-domain.com
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Gmail displays the authenticated Gmail account unless the branded sender is verified. Add the no-reply address in Gmail under **Settings -> Accounts and Import -> Send mail as**, complete verification, and configure matching SPF/DKIM records for the domain. Keep `SMTP_USER` as the authenticated Gmail account.

## Course curriculum files

The updated `supabase/schema.sql` creates a private `course-materials` Storage bucket and the `course_materials` metadata table. An instructor can upload one curriculum file per course from the course card in the Instructor Portal. Supported formats are PDF, Word, Excel, PowerPoint, text, and ZIP files up to 20 MB. Enrolled students receive one-hour signed download links from the course detail page; public visitors cannot access the file.

## Certificates and verification

Only the instructor who owns a completed course can issue certificates. The instructor can issue them individually or use **Issue course certificates** in the Students tab. A student must be enrolled and have a graded submission for every assignment in that course. Every certificate receives a unique `CERT-...` outward number and its QR code points to `/verify/{outwardNo}`.

Certificates are rendered as HTML, not uploaded as PDF files. Students can view them in their dashboard and use **Download HTML** to save a standalone `.html` file containing the certificate and embedded QR code. The same HTML view can be printed from the browser when a paper copy is needed.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
