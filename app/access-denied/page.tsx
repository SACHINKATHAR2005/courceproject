import Link from 'next/link';

export default function AccessDeniedPage() {
    return (
        <main className="mx-auto max-w-xl px-6 py-24 text-center">
            <h1 className="text-3xl font-bold text-slate-900">Access Denied</h1>
            <p className="mt-3 text-slate-600">Your account is not authorized to access this area.</p>
            <Link href="/" className="mt-8 inline-block rounded-lg bg-slate-900 px-5 py-3 text-sm font-semibold text-white">
                Return Home
            </Link>
        </main>
    );
}
