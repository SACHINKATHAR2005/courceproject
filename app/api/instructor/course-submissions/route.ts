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
    return profile?.role === 'instructor' || profile?.role === 'admin' ? profile : null;
}

export async function GET(request: Request) {
    const instructor = await getInstructor();
    if (!instructor) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    if (!courseId) return NextResponse.json({ error: 'Course ID is required.' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !serviceRoleKey) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 503 });

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Verify course ownership if instructor
    const { data: course } = await admin.from('courses').select('id, title, instructor_id').eq('id', courseId).maybeSingle();
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    if (instructor.role !== 'admin' && course.instructor_id !== instructor.id) {
        return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    // Get assignments for this course
    const { data: assignments } = await admin.from('assignments').select('id, title').eq('course_id', courseId);
    const assignmentIds = (assignments || []).map((a) => a.id);

    if (assignmentIds.length === 0) {
        return NextResponse.json({ students: [], totalEstimatedBytes: 0, fileCount: 0 });
    }

    // Get all submissions for these assignments
    const { data: submissions } = await admin
        .from('assignment_submissions')
        .select('id, student_id, assignment_id, file_url, status, submitted_at')
        .in('assignment_id', assignmentIds);

    const studentIds = [...new Set((submissions || []).map((s) => s.student_id))];
    if (studentIds.length === 0) {
        return NextResponse.json({ students: [], totalEstimatedBytes: 0, fileCount: 0 });
    }

    // Get profile info
    const { data: profiles } = await admin.from('profiles').select('id, full_name, email').in('id', studentIds);
    const profileMap = new Map((profiles || []).map((p) => [p.id, p]));
    const assignmentMap = new Map((assignments || []).map((a) => [a.id, a.title]));

    // Check certificate status
    const { data: certs } = await admin.from('certificates').select('student_id, outward_no').eq('course_id', courseId);
    const certMap = new Map((certs || []).map((c) => [c.student_id, c.outward_no]));

    const studentSummary: Record<string, {
        studentId: string;
        studentName: string;
        studentEmail: string;
        hasCertificate: boolean;
        certificateOutwardNo?: string;
        submissions: Array<{
            assignmentId: string;
            assignmentTitle: string;
            fileUrl: string | null;
            hasStorageFile: boolean;
            status: string;
        }>;
        storageFileCount: number;
    }> = {};

    let totalStorageFiles = 0;

    for (const sub of submissions || []) {
        const student = profileMap.get(sub.student_id);
        if (!studentSummary[sub.student_id]) {
            studentSummary[sub.student_id] = {
                studentId: sub.student_id,
                studentName: student?.full_name || 'Unknown Student',
                studentEmail: student?.email || '',
                hasCertificate: certMap.has(sub.student_id),
                certificateOutwardNo: certMap.get(sub.student_id),
                submissions: [],
                storageFileCount: 0,
            };
        }

        const isStorageFile = Boolean(sub.file_url && sub.file_url.includes('submissions/'));
        if (isStorageFile) {
            studentSummary[sub.student_id].storageFileCount += 1;
            totalStorageFiles += 1;
        }

        studentSummary[sub.student_id].submissions.push({
            assignmentId: sub.assignment_id,
            assignmentTitle: assignmentMap.get(sub.assignment_id) || 'Assignment',
            fileUrl: sub.file_url,
            hasStorageFile: isStorageFile,
            status: sub.status,
        });
    }

    // Average PDF assignment submission size is ~1.5MB to 3MB, or we estimate around 2MB per file
    const estimatedBytesPerFile = 2 * 1024 * 1024;
    const totalEstimatedBytes = totalStorageFiles * estimatedBytesPerFile;

    return NextResponse.json({
        students: Object.values(studentSummary),
        fileCount: totalStorageFiles,
        totalEstimatedBytes,
    });
}
