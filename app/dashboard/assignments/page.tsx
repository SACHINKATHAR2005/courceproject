'use client';

import Link from 'next/link';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import { useStudentData } from '@/lib/hooks/use-student-data';
import { StudentResources } from '@/components/student-resources';

export default function StudentAssignmentsPage() {
    const { ready, currentUser, courses, myEnrollments, assignments } = useStudentData();
    if (!ready) return <div className="mx-auto max-w-7xl animate-pulse px-4 py-10"><div className="h-12 rounded-xl bg-slate-200" /></div>;
    if (!currentUser) return <div className="mx-auto max-w-md px-4 py-20 text-center"><Link href="/login" className="font-semibold text-[#18375f]">Sign in to view assignments</Link></div>;
    return <main className="min-h-screen bg-[#f6f8fb]"><div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Dashboard</Link><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Coursework</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-950"><ClipboardList className="h-6 w-6 text-[#18375f]" />Assignments & Notes</h1><p className="mt-2 text-sm text-slate-500">Everything shared with the courses you are enrolled in.</p></div><StudentResources courses={courses} enrollments={myEnrollments} assignments={assignments} /></div></main>;
}
