import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 20 * 1024 * 1024;
const allowedExtensions = new Set(['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'zip']);

async function getSessionUser() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!url || !key) return null;
    const cookieStore = await cookies();
    const sessionClient = createServerClient(url, key, { cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined } });
    const { data: { user } } = await sessionClient.auth.getUser();
    return user;
}

function getAdminClient() {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!url || !key) return null;
    return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

function isAllowedUser(profile: { role?: string } | null, userId: string, course: { instructor_id?: string } | null) {
    return profile?.role === 'admin' || course?.instructor_id === userId || profile?.role === 'student';
}

export async function POST(request: Request, { params }: { params: Promise<{ courseId: string }> }) {
    const user = await getSessionUser();
    const admin = getAdminClient();
    const { courseId } = await params;
    if (!user || !admin) return NextResponse.json({ error: 'You must be signed in.' }, { status: 401 });

    const { data: profile } = await admin.from('profiles').select('role').eq('id', user.id).maybeSingle();
    const { data: course } = await admin.from('courses').select('id, instructor_id').eq('id', courseId).maybeSingle();
    if (profile?.role !== 'instructor' || course?.instructor_id !== user.id) {
        return NextResponse.json({ error: 'Only the course instructor can upload curriculum.' }, { status: 403 });
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) return NextResponse.json({ error: 'Choose a curriculum file.' }, { status: 400 });
    if (file.size === 0 || file.size > MAX_FILE_SIZE) return NextResponse.json({ error: 'Curriculum files must be smaller than 20 MB.' }, { status: 400 });

    const originalName = file.name.trim();
    const extension = originalName.split('.').pop()?.toLowerCase() || '';
    if (!allowedExtensions.has(extension)) return NextResponse.json({ error: 'Use PDF, Word, Excel, PowerPoint, text, or ZIP files.' }, { status: 400 });
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/-+/g, '-').slice(-120);
    const storagePath = `${courseId}/${crypto.randomUUID()}-${safeName}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { data: oldMaterial } = await admin.from('course_materials').select('storage_path').eq('course_id', courseId).maybeSingle();
    const { error: uploadError } = await admin.storage.from('course-materials').upload(storagePath, buffer, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
    });
    if (uploadError) return NextResponse.json({ error: 'Curriculum upload failed.' }, { status: 500 });

    const { data: material, error: materialError } = await admin.from('course_materials').upsert({
        course_id: courseId,
        file_name: originalName,
        storage_path: storagePath,
        mime_type: file.type || 'application/octet-stream',
        file_size: file.size,
        uploaded_by: user.id,
    }, { onConflict: 'course_id' }).select('id, file_name, mime_type, file_size, created_at').single();
    if (materialError || !material) {
        await admin.storage.from('course-materials').remove([storagePath]);
        return NextResponse.json({ error: 'Curriculum record could not be saved.' }, { status: 500 });
    }
    if (oldMaterial?.storage_path && oldMaterial.storage_path !== storagePath) {
        await admin.storage.from('course-materials').remove([oldMaterial.storage_path]);
    }
    return NextResponse.json({ ok: true, material });
}

export async function GET(_request: Request, { params }: { params: Promise<{ courseId: string }> }) {
    const user = await getSessionUser();
    const admin = getAdminClient();
    const { courseId } = await params;
    if (!admin) return NextResponse.json({ error: 'Storage is not configured.' }, { status: 503 });

    const [{ data: profile }, { data: course }, { data: material }] = await Promise.all([
        user ? admin.from('profiles').select('role').eq('id', user.id).maybeSingle() : Promise.resolve({ data: null }),
        admin.from('courses').select('id, instructor_id').eq('id', courseId).maybeSingle(),
        admin.from('course_materials').select('file_name, storage_path, mime_type, file_size, created_at').eq('course_id', courseId).maybeSingle(),
    ]);
    if (!course) return NextResponse.json({ error: 'Course not found.' }, { status: 404 });
    if (!material) return NextResponse.json({ material: null });

    if (!user) {
        return NextResponse.json({ material: { file_name: material.file_name, mime_type: material.mime_type, file_size: material.file_size, created_at: material.created_at, requiresLogin: true } });
    }

    if (!isAllowedUser(profile, user.id, course)) {
        return NextResponse.json({ material: { file_name: material.file_name, mime_type: material.mime_type, file_size: material.file_size, created_at: material.created_at, requiresLogin: true } });
    }

    const { data: signed, error } = await admin.storage.from('course-materials').createSignedUrl(material.storage_path, 3600);
    if (error || !signed?.signedUrl) return NextResponse.json({ error: 'Curriculum link could not be created.' }, { status: 500 });
    return NextResponse.json({ material: { ...material, url: signed.signedUrl } });
}
