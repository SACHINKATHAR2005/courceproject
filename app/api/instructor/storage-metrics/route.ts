import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const MAX_STORAGE_BYTES = 1024 * 1024 * 1024; // 1 GB in bytes

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

export async function GET() {
    const instructor = await getInstructor();
    if (!instructor) return NextResponse.json({ error: 'Unauthorized.' }, { status: 403 });

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceRoleKey = process.env.SUPABASE_SECRET_KEY;
    if (!url || !serviceRoleKey) return NextResponse.json({ error: 'Server configuration missing.' }, { status: 503 });

    const admin = createClient(url, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });

    // Aggregate storage usage across course_materials, assignment_materials, course_notes
    const [{ data: cm }, { data: am }, { data: cn }] = await Promise.all([
        admin.from('course_materials').select('file_size'),
        admin.from('assignment_materials').select('file_size'),
        admin.from('course_notes').select('file_size'),
    ]);

    const cmBytes = (cm || []).reduce((acc, row) => acc + (Number(row.file_size) || 0), 0);
    const amBytes = (am || []).reduce((acc, row) => acc + (Number(row.file_size) || 0), 0);
    const cnBytes = (cn || []).reduce((acc, row) => acc + (Number(row.file_size) || 0), 0);

    // Now list objects in 'submissions/' folder in 'course-materials' bucket
    let submissionsBytes = 0;
    let submissionsCount = 0;

    try {
        const { data: files } = await admin.storage.from('course-materials').list('submissions', {
            limit: 1000,
            sortBy: { column: 'name', order: 'asc' },
        });

        // 'submissions' folder contains subfolders by assignmentId or direct files
        if (files) {
            for (const item of files) {
                if (item.metadata?.size) {
                    submissionsBytes += item.metadata.size;
                    submissionsCount += 1;
                } else if (item.id === null) {
                    // It's a directory (assignmentId)
                    const { data: subFiles } = await admin.storage.from('course-materials').list(`submissions/${item.name}`, { limit: 1000 });
                    if (subFiles) {
                        for (const sf of subFiles) {
                            if (sf.metadata?.size) {
                                submissionsBytes += sf.metadata.size;
                                submissionsCount += 1;
                            } else if (sf.id === null) {
                                // subfolder by studentId
                                const { data: studentFiles } = await admin.storage.from('course-materials').list(`submissions/${item.name}/${sf.name}`, { limit: 1000 });
                                if (studentFiles) {
                                    for (const stf of studentFiles) {
                                        if (stf.metadata?.size) {
                                            submissionsBytes += stf.metadata.size;
                                            submissionsCount += 1;
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    } catch (e) {
        console.error('Error calculating storage metrics:', e);
    }

    const totalUsedBytes = cmBytes + amBytes + cnBytes + submissionsBytes;
    const freeBytes = Math.max(0, MAX_STORAGE_BYTES - totalUsedBytes);

    return NextResponse.json({
        totalAllocatedBytes: MAX_STORAGE_BYTES, // 1 GB
        totalUsedBytes,
        freeBytes,
        usedPercentage: Number(((totalUsedBytes / MAX_STORAGE_BYTES) * 100).toFixed(2)),
        breakdown: {
            submissionsBytes,
            submissionsCount,
            curriculumBytes: cmBytes,
            assignmentMaterialsBytes: amBytes,
            notesBytes: cnBytes,
        },
    });
}
