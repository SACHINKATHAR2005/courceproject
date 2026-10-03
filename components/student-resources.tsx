'use client';

import { useEffect, useState } from 'react';
import { BookOpen, Download, FileText, ClipboardList, Loader2 } from 'lucide-react';
import type { Assignment, Course, Enrollment } from '@/lib/types';

type ResourceAssignment = Assignment & { courseTitle: string; material?: { file_name: string; url: string } };
type Note = { id: string; title: string; content: string; created_at: string; file_name?: string; url?: string | null; courseTitle: string };

export function StudentResources({ courses, enrollments, assignments }: { courses: Course[]; enrollments: Enrollment[]; assignments: Assignment[] }) {
    const [activeTab, setActiveTab] = useState<'assignments' | 'notes'>('assignments');
    const [assignmentResources, setAssignmentResources] = useState<ResourceAssignment[]>([]);
    const [notes, setNotes] = useState<Note[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let active = true;
        const enrolledCourseIds = new Set(enrollments.map((enrollment) => enrollment.courseId));
        const enrolledAssignments = assignments
            .filter((assignment) => enrolledCourseIds.has(assignment.courseId))
            .map((assignment) => ({ ...assignment, courseTitle: courses.find((course) => course.id === assignment.courseId)?.title || 'Course' }));
        const loadResources = async () => {
            const assignmentResults = await Promise.all(enrolledAssignments.map(async (assignment) => {
                const response = await fetch(`/api/assignments/${assignment.id}/material`);
                const result = await response.json();
                return response.ok && result.material ? { ...assignment, material: result.material } : assignment;
            }));
            const noteResults = await Promise.all([...enrolledCourseIds].map(async (courseId) => {
                const response = await fetch(`/api/courses/${courseId}/notes`);
                const result = await response.json();
                if (!response.ok) return [];
                return (result.notes || []).map((note: Omit<Note, 'courseTitle'>) => ({ ...note, courseTitle: courses.find((course) => course.id === courseId)?.title || 'Course' }));
            }));
            if (active) {
                setAssignmentResources(assignmentResults);
                setNotes(noteResults.flat());
                setLoading(false);
            }
        };
        void loadResources();
        return () => { active = false; };
    }, [assignments, courses, enrollments]);

    return (
        <section className="space-y-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="flex items-center gap-2 text-xl font-bold text-slate-950"><BookOpen className="h-5 w-5 text-emerald-700" />Learning Resources</h2>
                    <p className="mt-1 text-sm text-slate-500">Assignments and notes shared with your enrolled courses.</p>
                </div>
                <div className="flex rounded-xl border border-slate-200 bg-slate-100 p-1">
                    <button type="button" onClick={() => setActiveTab('assignments')} className={`rounded-lg px-4 py-2 text-xs font-semibold ${activeTab === 'assignments' ? 'bg-white text-[#18375f] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><ClipboardList className="mr-1 inline h-3.5 w-3.5" />Assignments</button>
                    <button type="button" onClick={() => setActiveTab('notes')} className={`rounded-lg px-4 py-2 text-xs font-semibold ${activeTab === 'notes' ? 'bg-white text-[#18375f] shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><BookOpen className="mr-1 inline h-3.5 w-3.5" />Notes</button>
                </div>
            </div>
            {loading ? <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500 shadow-sm"><Loader2 className="mx-auto mb-2 h-5 w-5 animate-spin text-emerald-700" />Loading resources...</div> : activeTab === 'assignments' ? (
                assignmentResources.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No assignments have been shared with your enrolled courses yet.</div> :
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">{assignmentResources.map((assignment) => <article key={assignment.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300 hover:shadow-md"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{assignment.courseTitle}</p><h3 className="mt-1 text-base font-bold text-slate-950">{assignment.title}</h3><p className="mt-2 line-clamp-3 text-sm leading-6 text-slate-500">{assignment.description}</p><div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3 text-xs"><span className="text-slate-500">Due {new Date(assignment.dueDate).toLocaleDateString()}</span>{assignment.material ? <a href={assignment.material.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg bg-[#18375f] px-3 py-2 font-semibold text-white hover:bg-[#102a4a]"><Download className="h-3.5 w-3.5" />PDF</a> : <span className="text-slate-400">No PDF attached</span>}</div></article>)}</div>
            ) : notes.length === 0 ? <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">No notes have been shared with your enrolled courses yet.</div> : <div className="space-y-4">{notes.map((note) => <article key={note.id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><p className="text-xs font-semibold uppercase tracking-wider text-emerald-700">{note.courseTitle}</p><h3 className="mt-1 flex items-center gap-2 text-base font-bold text-slate-950"><FileText className="h-4 w-4 text-amber-600" />{note.title}</h3><p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-slate-600">{note.content}</p>{note.url && <a href={note.url} target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-2 text-xs font-semibold text-[#18375f] hover:bg-slate-50"><Download className="h-3.5 w-3.5" />Download attachment</a>}</article>)}</div>}
        </section>
    );
}
