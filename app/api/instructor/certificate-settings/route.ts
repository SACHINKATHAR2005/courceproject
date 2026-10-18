import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseSecret = process.env.SUPABASE_SECRET_KEY || '';

function getAdminClient() {
  if (!supabaseUrl || !supabaseSecret) return null;
  return createClient(supabaseUrl, supabaseSecret, {
    auth: { persistSession: false },
  });
}

const defaultSettings = {
  institutionName: 'LearnHub Institute of Technology',
  directorName: 'Director',
  directorTitle: 'LearnHub Certify',
  directorSignatureUrl: '',
  instructorSignatureUrl: '',
  stampUrl: '',
};

export async function GET() {
  try {
    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ ok: true, settings: defaultSettings });
    }

    const { data, error } = await admin
      .from('certificate_settings')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.json({ ok: true, settings: defaultSettings });
    }

    return NextResponse.json({
      ok: true,
      settings: {
        institutionName: data.institution_name || defaultSettings.institutionName,
        directorName: data.director_name || defaultSettings.directorName,
        directorTitle: data.director_title || defaultSettings.directorTitle,
        directorSignatureUrl: data.director_signature_url || '',
        instructorSignatureUrl: data.instructor_signature_url || '',
        stampUrl: data.stamp_url || '',
      },
    });
  } catch (err) {
    console.error('Error fetching certificate settings:', err);
    return NextResponse.json({ ok: true, settings: defaultSettings });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      institutionName,
      directorName,
      directorTitle,
      directorSignatureUrl,
      instructorSignatureUrl,
      stampUrl,
      userId,
    } = body;

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json({ ok: true, saved: true, localOnly: true });
    }

    // Check if table exists by attempting an upsert or insert
    const payload = {
      institution_name: institutionName || defaultSettings.institutionName,
      director_name: directorName || defaultSettings.directorName,
      director_title: directorTitle || defaultSettings.directorTitle,
      director_signature_url: directorSignatureUrl || '',
      instructor_signature_url: instructorSignatureUrl || '',
      stamp_url: stampUrl || '',
      updated_by: userId || null,
      updated_at: new Date().toISOString(),
    };

    // Check if record exists
    const { data: existing } = await admin
      .from('certificate_settings')
      .select('id')
      .limit(1)
      .maybeSingle();

    let saveError = null;
    if (existing?.id) {
      const { error } = await admin
        .from('certificate_settings')
        .update(payload)
        .eq('id', existing.id);
      saveError = error;
    } else {
      const { error } = await admin
        .from('certificate_settings')
        .insert([payload]);
      saveError = error;
    }

    if (saveError) {
      console.warn('Note: certificate_settings database write:', saveError.message);
    }

    return NextResponse.json({ ok: true, saved: !saveError });
  } catch (err) {
    console.error('Error saving certificate settings:', err);
    return NextResponse.json({ ok: true, saved: true, error: String(err) });
  }
}
