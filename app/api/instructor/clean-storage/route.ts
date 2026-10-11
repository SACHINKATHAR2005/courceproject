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

function extractStoragePath(fileUrl: string): string | null {
    if (!fileUrl) return null;
    // file_url could be a full signed URL or path like "submissions/assignmentId/userId/filename.pdf"
    if (fileUrl.includes('submissions/')) {
        const parts = fileUrl.split('submissions/');
        const subPath = parts[1]?.split('?')[0]; // strip query string
        if (subPath) return `submissions/${subPath}`;
    }
    return null;
}

export async function POST(request: Request) {
    const instructor = await getInstructor();
    if (!instructor) return NextResponse.json({ error: 'Only the authenticated course instructor or admin can delete submissions.' }, { status: 403 });

    const body = await request.json().catch(() => ({})) as { courseId?: string; studentIds?: string[]; deleteAllForCourse?: boolean };
    const { courseId, studentIds, deleteAllForCourse } = body;
    if (!courseId) return NextResponse.json({ error: 'A course is required.' }, { status: 400 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !serviceRoleKey) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 503 });

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Verify course ownership
    const { data: course } = await admin.from('courses').select('id, instructor_id').eq('id', courseId).maybeSingle();
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    if (instructor.role !== 'admin' && course.instructor_id !== instructor.id) {
        return NextResponse.json({ error: 'This course does not belong to you.' }, { status: 403 });
    }

    // Get assignments for this course
    const { data: assignments } = await admin.from('assignments').select('id').eq('course_id', courseId);
    const assignmentIds = (assignments || []).map((a) => a.id);
    if (assignmentIds.length === 0) {
        return NextResponse.json({ deletedFiles: 0, freedBytes: 0, message: 'No assignments found for this course.' });
    }

    // Query submissions
    let query = admin.from('assignment_submissions').select('id, student_id, file_url').in('assignment_id', assignmentIds);
    if (!deleteAllForCourse && Array.isArray(studentIds) && studentIds.length > 0) {
        query = query.in('student_id', studentIds);
    }

    const { data: submissions } = await query;
    if (!submissions || submissions.length === 0) {
        return NextResponse.json({ deletedFiles: 0, freedBytes: 0, message: 'No submissions found to clean up.' });
    }

    const storagePathsToDelete: string[] = [];
    const submissionIdsToUpdate: string[] = [];

    for (const sub of submissions) {
        if (sub.file_url) {
            const path = extractStoragePath(sub.file_url);
            if (path) {
                storagePathsToDelete.push(path);
                submissionIdsToUpdate.push(sub.id);
            }
        }
    }

    let deletedFiles = 0;
    if (storagePathsToDelete.length > 0) {
        // Delete in chunks of 50 from Supabase storage
        for (let i = 0; i < storagePathsToDelete.length; i += 50) {
            const chunk = storagePathsToDelete.slice(i, i + 50);
            const { error: storageDelErr } = await admin.storage.from('course-materials').remove(chunk);
            if (!storageDelErr) {
                deletedFiles += chunk.length;
            } else {
                console.error('Storage deletion error:', storageDelErr);
            }
        }

        // Update DB rows to remove file_url so records remain clean
        if (submissionIdsToUpdate.length > 0) {
            await admin
                .from('assignment_submissions')
                .update({ file_url: null })
                .in('id', submissionIdsToUpdate);
        }
    }

    // Average file size approximation (2MB each)
    const estimatedFreedBytes = deletedFiles * 2 * 1024 * 1024;

    return NextResponse.json({
        ok: true,
        deletedFiles,
        freedBytes: estimatedFreedBytes,
        message: `Successfully deleted ${deletedFiles} stored assignment file(s). Freed approximately ${(estimatedFreedBytes / (1024 * 1024)).toFixed(1)} MB.`,
    });
}
