import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

async function getUser() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const cookieStore = await cookies();
    const session = createServerClient(url, key, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } });
    const { data: { user } } = await session.auth.getUser();
    return user;
}

function adminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    return url && key ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } }) : null;
}

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
    const user = await getUser();
    const admin = adminClient();
    const { courseId } = await params;
    if (!user || !admin) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    const [{ data: profile }, { data: course }, { data: enrollment }, { data: notes }] = await Promise.all([
        admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        admin.from('courses').select('instructor_id').eq('id', courseId).maybeSingle(),
        admin.from('enrollments').select('id').eq('course_id', courseId).eq('student_id', user.id).maybeSingle(),
        admin.from('course_notes').select('id, title, content, file_name, storage_path, file_size, created_at').eq('course_id', courseId).order('created_at', { ascending: false }),
    ]);
    if (!course || !(profile?.role === 'admin' || course.instructor_id === user.id || Boolean(enrollment))) return NextResponse.json({ error: 'You are not authorized to access these notes.' }, { status: 403 });
    const notesWithUrls = await Promise.all((notes || []).map(async (note) => {
        if (!note.storage_path) return note;
        const { data: signed } = await admin.storage.from('course-materials').createSignedUrl(note.storage_path, 3600);
        return { ...note, url: signed?.signedUrl || null };
    }));
    return NextResponse.json({ notes: notesWithUrls });
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
    const user = await getUser();
    const admin = adminClient();
    const { courseId } = await params;
    if (!user || !admin) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    const { data: course } = await admin.from('courses').select('instructor_id').eq('id', courseId).maybeSingle();
    if (!course || course.instructor_id !== user.id) return NextResponse.json({ error: 'Only the course instructor can share notes.' }, { status: 403 });
    const formData = await request.formData();
    const title = String(formData.get('title') || '').trim();
    const content = String(formData.get('content') || '').trim();
    if (!title || !content) return NextResponse.json({ error: 'Note title and content are required.' }, { status: 400 });
    const file = formData.get('file');
    let storagePath: string | null = null;
    let fileName: string | null = null;
    let fileSize: number | null = null;
    let mimeType: string | null = null;
    if (file instanceof File) {
        if (file.type !== 'application/pdf') return NextResponse.json({ error: 'Note attachments must be PDF files.' }, { status: 400 });
        if (file.size === 0 || file.size > 20 * 1024 * 1024) return NextResponse.json({ error: 'Note PDFs must be smaller than 20 MB.' }, { status: 400 });
        storagePath = `notes/${courseId}/${crypto.randomUUID()}.pdf`;
        fileName = file.name;
        fileSize = file.size;
        mimeType = 'application/pdf';
        const { error: uploadError } = await admin.storage.from('course-materials').upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: mimeType, upsert: false });
        if (uploadError) return NextResponse.json({ error: 'Note PDF upload failed.' }, { status: 500 });
    }
    const { data: note, error } = await admin.from('course_notes').insert({ course_id: courseId, title, content, created_by: user.id, file_name: fileName, storage_path: storagePath, file_size: fileSize, mime_type: mimeType }).select('id, title, content, file_name, created_at').single();
    if (error || !note) {
        if (storagePath) await admin.storage.from('course-materials').remove([storagePath]);
        return NextResponse.json({ error: 'Note could not be saved.' }, { status: 500 });
    }
    return NextResponse.json({ ok: true, note });
}
