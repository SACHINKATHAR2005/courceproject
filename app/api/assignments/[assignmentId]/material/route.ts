import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 20 * 1024 * 1024;

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

export async function POST(request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const user = await getUser();
    const admin = adminClient();
    const { assignmentId } = await params;
    if (!user || !admin) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    const { data: assignment } = await admin.from('assignments').select('id, course_id, courses!inner(instructor_id)').eq('id', assignmentId).maybeSingle();
    const courseRelation = assignment ? (Array.isArray(assignment.courses) ? assignment.courses[0] : assignment.courses) as { instructor_id: string } | undefined : undefined;
    if (!assignment || courseRelation?.instructor_id !== user.id) return NextResponse.json({ error: 'Only the course instructor can upload this file.' }, { status: 403 });
    const file = (await request.formData()).get('file');
    if (!(file instanceof File) || file.type !== 'application/pdf') return NextResponse.json({ error: 'Assignment files must be PDF files.' }, { status: 400 });
    if (file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'PDF files must be smaller than 20 MB.' }, { status: 400 });

    const { data: oldMaterial } = await admin.from('assignment_materials').select('storage_path').eq('assignment_id', assignmentId).maybeSingle();
    const storagePath = `assignments/${assignmentId}/${crypto.randomUUID()}.pdf`;
    const { error: uploadError } = await admin.storage.from('course-materials').upload(storagePath, Buffer.from(await file.arrayBuffer()), { contentType: 'application/pdf', upsert: false });
    if (uploadError) return NextResponse.json({ error: 'Assignment PDF upload failed.' }, { status: 500 });
    const { data: material, error } = await admin.from('assignment_materials').upsert({ assignment_id: assignmentId, file_name: file.name, storage_path: storagePath, mime_type: 'application/pdf', file_size: file.size, uploaded_by: user.id }, { onConflict: 'assignment_id' }).select('file_name, file_size, created_at').single();
    if (error || !material) {
        await admin.storage.from('course-materials').remove([storagePath]);
        return NextResponse.json({ error: 'Assignment file record could not be saved.' }, { status: 500 });
    }
    if (oldMaterial?.storage_path) await admin.storage.from('course-materials').remove([oldMaterial.storage_path]);
    return NextResponse.json({ ok: true, material });
}

export async function GET(_request: Request, { params }: { params: Promise<{ assignmentId: string }> }) {
    const user = await getUser();
    const admin = adminClient();
    const { assignmentId } = await params;
    if (!user || !admin) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });
    const [{ data: profile }, { data: assignment }, { data: material }] = await Promise.all([
        admin.from('profiles').select('role').eq('id', user.id).maybeSingle(),
        admin.from('assignments').select('course_id, courses!inner(instructor_id)').eq('id', assignmentId).maybeSingle(),
        admin.from('assignment_materials').select('file_name, storage_path, file_size, created_at').eq('assignment_id', assignmentId).maybeSingle(),
    ]);
    const courseRelation = assignment ? (Array.isArray(assignment.courses) ? assignment.courses[0] : assignment.courses) as { instructor_id: string } | undefined : undefined;
    const instructorId = courseRelation?.instructor_id || '';
    const { data: enrollment } = assignment ? await admin.from('enrollments').select('id').eq('course_id', assignment.course_id).eq('student_id', user.id).maybeSingle() : { data: null };
    if (!assignment || !(profile?.role === 'admin' || instructorId === user.id || Boolean(enrollment))) return NextResponse.json({ error: 'You are not authorized to access this assignment.' }, { status: 403 });
    if (!material) return NextResponse.json({ material: null });
    const { data: signed, error } = await admin.storage.from('course-materials').createSignedUrl(material.storage_path, 3600);
    if (error || !signed?.signedUrl) return NextResponse.json({ error: 'Assignment link could not be created.' }, { status: 500 });
    return NextResponse.json({ material: { ...material, url: signed.signedUrl } });
}
