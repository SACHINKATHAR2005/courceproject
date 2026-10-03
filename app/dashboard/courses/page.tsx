'use client';

import Link from 'next/link';
import { ArrowLeft, BookOpen } from 'lucide-react';
import { useStudentData } from '@/lib/hooks/use-student-data';
import { StudentCourseList } from '@/components/student-course-list';

export default function MyCoursesPage() {
    const { ready, currentUser, courses, myEnrollments, assignments, mySubmissions } = useStudentData();
    if (!ready) return <div className="mx-auto max-w-7xl animate-pulse px-4 py-10"><div className="h-12 rounded-xl bg-slate-200" /></div>;
    if (!currentUser) return <div className="mx-auto max-w-md px-4 py-20 text-center"><Link href="/login" className="font-semibold text-[#18375f]">Sign in to view your courses</Link></div>;
    return <main className="min-h-screen bg-[#f6f8fb]"><div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10"><Link href="/dashboard" className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900"><ArrowLeft className="h-4 w-4" />Dashboard</Link><div className="flex items-end justify-between"><div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-emerald-700">Learning path</p><h1 className="mt-1 flex items-center gap-2 text-2xl font-bold text-slate-950"><BookOpen className="h-6 w-6 text-[#18375f]" />My Courses</h1><p className="mt-2 text-sm text-slate-500">Continue the courses you are enrolled in.</p></div><Link href="/courses" className="inline-flex items-center gap-2 rounded-lg bg-[#18375f] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#102a4a]">Explore courses</Link></div><StudentCourseList courses={courses} enrollments={myEnrollments} assignments={assignments} submissions={mySubmissions} /></div></main>;
}
