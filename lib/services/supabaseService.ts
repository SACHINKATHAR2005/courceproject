import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { UserProfile, Course, Enrollment, Assignment, AssignmentSubmission, Certificate, RegistrationCard, Payment, UserRole } from '@/lib/types';

export const supabaseService = {
  // Fetch profiles from Supabase
  fetchProfiles: async (): Promise<UserProfile[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];
    const { data, error } = await supabase.from('profiles').select('*');
    if (error || !data) {
      console.error('Error fetching profiles from Supabase:', error);
      return [];
    }
    return data.map((p) => ({
      id: p.id,
      fullName: p.full_name,
      email: p.email,
      phone: p.phone,
      role: p.role,
      avatarUrl: p.avatar_url,
      createdAt: p.created_at,
    }));
  },

  // Insert profile into Supabase
  insertProfile: async (user: UserProfile): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('profiles').insert([
      {
        id: user.id,
        full_name: user.fullName,
        email: user.email,
        role: user.role,
        avatar_url: user.avatarUrl,
      },
    ]);
    return !error;
  },

  // Fetch courses from Supabase
  fetchCourses: async (): Promise<Course[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];
    const { data, error } = await supabase.from('courses').select('*');
    if (error || !data) {
      console.error('Error fetching courses from Supabase:', error);
      return [];
    }
    return data.map((c) => {
      const targetMatch = c.description?.match(/\[TARGET_ASSIGNMENTS:(\d+)\]/);
      const totalAssignments = targetMatch ? parseInt(targetMatch[1], 10) : undefined;
      const cleanDescription = (c.description || '').replace(/\[TARGET_ASSIGNMENTS:\d+\]/g, '').trim();

      return {
        id: c.id,
        title: c.title,
        description: cleanDescription,
        instructorId: c.instructor_id,
        instructorName: c.instructor_name,
        category: c.category,
        duration: c.duration,
        registrationFee: Number(c.registration_fee ?? 0),
        startDate: c.start_date || undefined,
        status: c.status || 'upcoming',
        totalAssignments,
        thumbnailUrl: c.thumbnail_url || 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=600&auto=format&fit=crop&q=80',
        createdAt: c.created_at,
      };
    });
  },

  // Create course in Supabase
  insertCourse: async (course: Course): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    let descriptionToSave = (course.description || '').replace(/\[TARGET_ASSIGNMENTS:\d+\]/g, '').trim();
    if (course.totalAssignments && course.totalAssignments > 0) {
      descriptionToSave += `\n\n[TARGET_ASSIGNMENTS:${course.totalAssignments}]`;
    }

    const { error } = await supabase.from('courses').insert([
      {
        id: course.id,
        title: course.title,
        description: descriptionToSave,
        instructor_id: course.instructorId,
        instructor_name: course.instructorName,
        category: course.category,
        duration: course.duration,
        registration_fee: course.registrationFee || 0,
        start_date: course.startDate || null,
        status: course.status || 'upcoming',
        thumbnail_url: course.thumbnailUrl,
      },
    ]);
    return !error;
  },

  updateCourse: async (course: Course): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    let descriptionToSave = (course.description || '').replace(/\[TARGET_ASSIGNMENTS:\d+\]/g, '').trim();
    if (course.totalAssignments && course.totalAssignments > 0) {
      descriptionToSave += `\n\n[TARGET_ASSIGNMENTS:${course.totalAssignments}]`;
    }

    const { error } = await supabase.from('courses').update({
      title: course.title,
      description: descriptionToSave,
      category: course.category,
      duration: course.duration,
      registration_fee: course.registrationFee || 0,
      start_date: course.startDate || null,
      status: course.status || 'upcoming',
      thumbnail_url: course.thumbnailUrl,
    }).eq('id', course.id).eq('instructor_id', course.instructorId);
    return !error;
  },

  deleteCourse: async (courseId: string, instructorId: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { data: material } = await supabase
      .from('course_materials')
      .select('storage_path')
      .eq('course_id', courseId)
      .maybeSingle();
    if (material?.storage_path) {
      const { error: storageError } = await supabase.storage.from('course-materials').remove([material.storage_path]);
      if (storageError) return false;
    }
    const { error } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId)
      .eq('instructor_id', instructorId);
    return !error;
  },

  fetchAssignments: async (): Promise<Assignment[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];
    const { data, error } = await supabase.from('assignments').select('*');
    if (error || !data) return [];
    return data.map((assignment) => {
      const isPdfRequired = Boolean((assignment.description || '').includes('[PDF_REQUIRED]'));
      const cleanDescription = (assignment.description || '').replace(/\[PDF_REQUIRED\]/g, '').trim();

      return {
        id: assignment.id,
        courseId: assignment.course_id,
        title: assignment.title,
        description: cleanDescription,
        dueDate: assignment.due_date,
        maxScore: assignment.max_score,
        pdfRequired: isPdfRequired,
        createdAt: assignment.created_at,
      };
    });
  },

  insertAssignment: async (assignment: Assignment): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { ok: false, error: 'Supabase is not configured.' };
    let descriptionToSave = (assignment.description || '').replace(/\[PDF_REQUIRED\]/g, '').trim();
    if (assignment.pdfRequired) {
      descriptionToSave += '\n\n[PDF_REQUIRED]';
    }

    const { error } = await supabase.from('assignments').insert({
      id: assignment.id,
      course_id: assignment.courseId,
      title: assignment.title,
      description: descriptionToSave,
      due_date: assignment.dueDate,
      max_score: assignment.maxScore,
    });
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  updateAssignment: async (assignment: Assignment): Promise<{ ok: boolean; error?: string }> => {
    if (!isSupabaseConfigured() || !supabase) return { ok: false, error: 'Supabase is not configured.' };
    let descriptionToSave = (assignment.description || '').replace(/\[PDF_REQUIRED\]/g, '').trim();
    if (assignment.pdfRequired) {
      descriptionToSave += '\n\n[PDF_REQUIRED]';
    }

    const { error } = await supabase.from('assignments').update({
      title: assignment.title,
      description: descriptionToSave,
      due_date: assignment.dueDate,
      max_score: assignment.maxScore,
    }).eq('id', assignment.id);
    return error ? { ok: false, error: error.message } : { ok: true };
  },

  fetchSubmissions: async (): Promise<AssignmentSubmission[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];
    const { data, error } = await supabase.from('assignment_submissions').select('*');
    if (error || !data) return [];
    return data.map((submission) => ({
      id: submission.id,
      assignmentId: submission.assignment_id,
      studentId: submission.student_id,
      submissionText: submission.submission_text || '',
      fileUrl: submission.file_url || undefined,
      status: submission.status,
      grade: submission.grade ?? undefined,
      feedback: submission.feedback || undefined,
      submittedAt: submission.submitted_at,
    }));
  },

  // Fetch enrollments from Supabase
  fetchEnrollments: async (): Promise<Enrollment[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];
    const { data, error } = await supabase.from('enrollments').select('*');
    if (error || !data) {
      console.error('Error fetching enrollments from Supabase:', error);
      return [];
    }
    return data.map((e) => ({
      id: e.id,
      studentId: e.student_id,
      courseId: e.course_id,
      status: e.status,
      enrolledAt: e.enrolled_at,
      completedAt: e.completed_at,
    }));
  },

  // Create enrollment in Supabase
  insertEnrollment: async (studentId: string, courseId: string): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('enrollments').insert([
      {
        student_id: studentId,
        course_id: courseId,
        status: 'enrolled',
      },
    ]);
    return !error;
  },

  fetchPayments: async (): Promise<Payment[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];
    const { data, error } = await supabase.from('payments').select('*').order('created_at', { ascending: false });
    if (error || !data) return [];
    return data.map((payment) => ({
      id: payment.id,
      razorpayOrderId: payment.razorpay_order_id,
      razorpayPaymentId: payment.razorpay_payment_id || undefined,
      studentId: payment.student_id,
      courseId: payment.course_id,
      amountPaise: payment.amount_paise,
      currency: payment.currency,
      status: payment.status,
      createdAt: payment.created_at,
      paidAt: payment.paid_at || undefined,
    }));
  },

  // Fetch certificates from Supabase
  fetchCertificates: async (): Promise<Certificate[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];
    const { data, error } = await supabase.from('certificates').select('*');
    if (error || !data) {
      console.error('Error fetching certificates from Supabase:', error);
      return [];
    }
    return data.map((cert) => ({
      id: cert.id,
      outwardNo: cert.outward_no,
      studentId: cert.student_id,
      courseId: cert.course_id,
      studentName: cert.student_name,
      courseName: cert.course_name,
      instructorName: cert.instructor_name,
      institution: cert.institution || 'LearnHub Institute of Technology',
      issueDate: cert.issue_date,
      status: cert.status || 'VALID',
      createdAt: cert.created_at,
    }));
  },

  // Issue certificate in Supabase
  insertCertificate: async (cert: Certificate): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('certificates').insert([
      {
        id: cert.id,
        outward_no: cert.outwardNo,
        student_id: cert.studentId,
        course_id: cert.courseId,
        student_name: cert.studentName,
        course_name: cert.courseName,
        instructor_name: cert.instructorName,
        institution: cert.institution || 'LearnHub Institute of Technology',
        issue_date: cert.issueDate,
        status: cert.status || 'VALID',
      },
    ]);
    return !error;
  },

  // Fetch registrations from Supabase
  fetchRegistrations: async (): Promise<RegistrationCard[]> => {
    if (!isSupabaseConfigured() || !supabase) return [];
    const { data, error } = await supabase.from('registrations').select('*');
    if (error || !data) {
      console.error('Error fetching registrations from Supabase:', error);
      return [];
    }
    return data.map((reg) => ({
      id: reg.id,
      registrationNo: reg.registration_no,
      studentId: reg.student_id,
      studentName: reg.student_name,
      email: reg.email,
      institution: reg.institution,
      department: reg.department,
      issueDate: reg.issue_date,
      status: reg.status || 'VALID',
      createdAt: reg.created_at,
    }));
  },

  // Insert registration card in Supabase
  insertRegistration: async (regCard: RegistrationCard): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('registrations').insert([
      {
        id: regCard.id,
        registration_no: regCard.registrationNo,
        student_id: regCard.studentId,
        student_name: regCard.studentName,
        email: regCard.email,
        institution: regCard.institution,
        department: regCard.department,
        issue_date: regCard.issueDate,
        status: regCard.status || 'VALID',
      },
    ]);
    return !error;
  },
  // Insert a new assignment_submission row into Supabase
  insertSubmission: async (submission: AssignmentSubmission): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('assignment_submissions').insert({
      id: submission.id,
      assignment_id: submission.assignmentId,
      student_id: submission.studentId,
      submission_text: submission.submissionText,
      file_url: submission.fileUrl || null,
      status: submission.status,
      submitted_at: submission.submittedAt,
    });
    if (error) console.error('Error inserting submission:', error);
    return !error;
  },

  // Upsert an existing submission row (for re-submissions)
  upsertSubmission: async (submission: AssignmentSubmission): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase.from('assignment_submissions').upsert({
      id: submission.id,
      assignment_id: submission.assignmentId,
      student_id: submission.studentId,
      submission_text: submission.submissionText,
      file_url: submission.fileUrl || null,
      status: submission.status,
      submitted_at: submission.submittedAt,
    }, { onConflict: 'assignment_id,student_id' });
    if (error) console.error('Error upserting submission:', error);
    return !error;
  },

  // Update grade + feedback on an existing submission
  updateSubmissionGrade: async (submissionId: string, grade: number | undefined, feedback: string, status: 'graded' | 'resubmit_required' = 'graded'): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const updatePayload: Record<string, unknown> = { status, feedback };
    if (grade !== undefined && !isNaN(grade)) {
      updatePayload.grade = grade;
    }
    const { error } = await supabase
      .from('assignment_submissions')
      .update(updatePayload)
      .eq('id', submissionId);
    if (error) console.error('Error grading submission:', error);
    return !error;
  },

  // Mark a certificate as REVOKED in Supabase
  updateCertificateStatus: async (certId: string, status: 'VALID' | 'REVOKED'): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase
      .from('certificates')
      .update({ status })
      .or(`id.eq.${certId},outward_no.eq.${certId}`);
    if (error) console.error('Error updating certificate status:', error);
    return !error;
  },

  // Update a user's role in the profiles table
  updateProfileRole: async (userId: string, role: UserRole): Promise<boolean> => {
    if (!isSupabaseConfigured() || !supabase) return false;
    const { error } = await supabase
      .from('profiles')
      .update({ role })
      .eq('id', userId);
    if (error) console.error('Error updating profile role:', error);
    return !error;
  },
};
