import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getInstructor() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !anonKey) return null;
    const cookieStore = await cookies();
    const sessionClient = createServerClient(url, anonKey, {
        cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
    });
    const { data: { user } } = await sessionClient.auth.getUser();
    if (!user) return null;
    const { data: profile } = await sessionClient.from('profiles').select('id, full_name, role').eq('id', user.id).maybeSingle();
    return profile?.role === 'instructor' ? profile : null;
}

export async function POST(request: Request) {
    const instructor = await getInstructor();
    if (!instructor) return NextResponse.json({ error: 'Only the authenticated course instructor can issue certificates.' }, { status: 403 });

    const { courseId } = await request.json().catch(() => ({})) as { courseId?: string };
    if (!courseId) return NextResponse.json({ error: 'A course is required.' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !serviceRoleKey) return NextResponse.json({ error: 'Certificate issuing is not configured.' }, { status: 503 });

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
    const { data: course } = await admin.from('courses').select('id, title, instructor_id, status').eq('id', courseId).maybeSingle();
    if (!course || course.instructor_id !== instructor.id) return NextResponse.json({ error: 'This course does not belong to you.' }, { status: 403 });
    if (course.status !== 'completed') return NextResponse.json({ error: 'Mark the course as completed before issuing certificates.' }, { status: 400 });

    const [{ data: enrollments }, { data: assignments }] = await Promise.all([
        admin.from('enrollments').select('student_id').eq('course_id', courseId),
        admin.from('assignments').select('id').eq('course_id', courseId),
    ]);
    const assignmentIds = (assignments || []).map((assignment) => assignment.id);
    if (assignmentIds.length === 0) return NextResponse.json({ error: 'Add at least one assignment before issuing certificates.' }, { status: 400 });

    const studentIds = [...new Set((enrollments || []).map((enrollment) => enrollment.student_id))];
    const [{ data: submissions }, { data: existingCertificates }] = await Promise.all([
        admin.from('assignment_submissions').select('student_id, assignment_id').in('assignment_id', assignmentIds).eq('status', 'graded'),
        admin.from('certificates').select('student_id, course_id, outward_no').eq('course_id', courseId),
    ]);
    const existingStudents = new Set((existingCertificates || []).map((certificate) => certificate.student_id));
    const completedByStudent = new Map<string, Set<string>>();
    for (const submission of submissions || []) {
        const completed = completedByStudent.get(submission.student_id) || new Set<string>();
        completed.add(submission.assignment_id);
        completedByStudent.set(submission.student_id, completed);
    }

    const eligibleStudentIds = studentIds.filter((studentId) => !existingStudents.has(studentId) && assignmentIds.every((assignmentId) => completedByStudent.get(studentId)?.has(assignmentId)));
    if (eligibleStudentIds.length === 0) return NextResponse.json({ issued: 0, skipped: studentIds.length, results: [], message: 'No new students meet the completion requirements.' });

    const { data: students } = await admin.from('profiles').select('id, full_name').in('id', eligibleStudentIds);
    const results: Array<{ studentId: string; studentName: string; outwardNo?: string; status: 'issued' | 'skipped' }> = [];
    for (const student of students || []) {
        const outwardNo = `CERT-${new Date().getUTCFullYear()}-${crypto.randomUUID().replaceAll('-', '').slice(0, 16).toUpperCase()}`;
        const { error } = await admin.from('certificates').insert({
            outward_no: outwardNo,
            student_id: student.id,
            course_id: course.id,
            student_name: student.full_name,
            course_name: course.title,
            instructor_name: instructor.full_name,
            institution: 'LearnHub Institute of Technology',
            status: 'VALID',
        });
        results.push(error
            ? { studentId: student.id, studentName: student.full_name, status: 'skipped' }
            : { studentId: student.id, studentName: student.full_name, outwardNo, status: 'issued' });
    }

    return NextResponse.json({
        issued: results.filter((result) => result.status === 'issued').length,
        skipped: studentIds.length - results.filter((result) => result.status === 'issued').length,
        results,
    });
}
