import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

const MAX_FILE_SIZE = 25 * 1024 * 1024; // 25 MB

async function getUser() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return null;
  const cookieStore = await cookies();
  const session = createServerClient(url, key, {
    cookies: { getAll: () => cookieStore.getAll(), setAll: () => undefined },
  });
  const { data: { user } } = await session.auth.getUser();
  return user;
}

function adminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SECRET_KEY;
  return url && key
    ? createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
    : null;
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ assignmentId: string }> }
) {
  try {
    const user = await getUser();
    const admin = adminClient();
    const { assignmentId } = await params;

    if (!user || !admin) {
      return NextResponse.json({ error: 'You must be signed in to submit assignments.' }, { status: 401 });
    }

    // Fetch assignment & course
    const { data: assignment, error: asgError } = await admin
      .from('assignments')
      .select('id, course_id, title, description, courses!inner(id, title, instructor_id)')
      .eq('id', assignmentId)
      .maybeSingle();

    if (asgError || !assignment) {
      return NextResponse.json({ error: 'Assignment not found.' }, { status: 404 });
    }

    // Verify enrollment
    const { data: enrollment } = await admin
      .from('enrollments')
      .select('id, status')
      .eq('course_id', assignment.course_id)
      .eq('student_id', user.id)
      .maybeSingle();

    if (!enrollment) {
      return NextResponse.json({ error: 'You must be enrolled in this course to submit assignments.' }, { status: 403 });
    }

    const formData = await request.formData();
    const submissionText = (formData.get('submissionText') as string) || '';
    const externalLink = (formData.get('fileUrl') as string) || '';
    const file = formData.get('file');

    const isPdfRequired = Boolean((assignment.description || '').includes('[PDF_REQUIRED]'));

    // Check existing submission
    const { data: existingSubmission } = await admin
      .from('assignment_submissions')
      .select('id, file_url')
      .eq('assignment_id', assignmentId)
      .eq('student_id', user.id)
      .maybeSingle();

    let finalFileUrl = externalLink || existingSubmission?.file_url || '';

    // If PDF file was uploaded
    if (file instanceof File && file.size > 0) {
      const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
      if (!isPdf) {
        return NextResponse.json({ error: 'Only PDF files are accepted for document uploads.' }, { status: 400 });
      }
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: 'PDF file size must be less than 25 MB.' }, { status: 400 });
      }

      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
      const storagePath = `submissions/${assignmentId}/${user.id}/${Date.now()}_${safeName}`;

      const { error: uploadError } = await admin.storage
        .from('course-materials')
        .upload(storagePath, Buffer.from(await file.arrayBuffer()), {
          contentType: 'application/pdf',
          upsert: true,
        });

      if (uploadError) {
        console.error('Submission upload error:', uploadError);
        return NextResponse.json({ error: 'Failed to upload PDF file to storage.' }, { status: 500 });
      }

      // Generate signed URL with long validity (1 year)
      const { data: signed } = await admin.storage
        .from('course-materials')
        .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

      finalFileUrl = signed?.signedUrl || storagePath;
    } else if (isPdfRequired && !finalFileUrl.toLowerCase().includes('.pdf')) {
      return NextResponse.json(
        { error: 'A PDF document submission is required by the instructor for this assignment.' },
        { status: 400 }
      );
    }

    if (!submissionText.trim()) {
      return NextResponse.json({ error: 'Please provide submission notes or a description of your work.' }, { status: 400 });
    }

    // Upsert submission
    const submissionId = existingSubmission?.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const { data: savedSubmission, error: upsertError } = await admin
      .from('assignment_submissions')
      .upsert(
        {
          id: submissionId,
          assignment_id: assignmentId,
          student_id: user.id,
          submission_text: submissionText.trim(),
          file_url: finalFileUrl || null,
          status: 'submitted',
          submitted_at: now,
        },
        { onConflict: 'assignment_id,student_id' }
      )
      .select('*')
      .single();

    if (upsertError) {
      console.error('Submission upsert error:', upsertError);
      return NextResponse.json({ error: 'Could not record assignment submission.' }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      submission: {
        id: savedSubmission.id,
        assignmentId: savedSubmission.assignment_id,
        studentId: savedSubmission.student_id,
        submissionText: savedSubmission.submission_text,
        fileUrl: savedSubmission.file_url,
        status: savedSubmission.status,
        submittedAt: savedSubmission.submitted_at,
      },
    });
  } catch (error) {
    console.error('Assignment submission API error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred during submission.' }, { status: 500 });
  }
}
