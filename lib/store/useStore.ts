import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { UserProfile, Course, Enrollment, Assignment, AssignmentSubmission, Certificate, UserRole, RegistrationCard } from '../types';
import { supabaseService } from '../services/supabaseService';

interface StoreState {
  // Auth state
  currentUser: UserProfile | null;
  allUsers: UserProfile[];
  setUser: (user: UserProfile | null) => void;
  logoutUser: () => void;
  updateUserRole: (userId: string, newRole: UserRole) => void;

  // Course state
  courses: Course[];
  addCourse: (newCourse: Omit<Course, 'id' | 'createdAt'>) => Promise<Course | null>;
  updateCourse: (course: Course) => Promise<boolean>;
  deleteCourse: (courseId: string) => void;

  // Enrollment state
  enrollments: Enrollment[];
  enrollInCourse: (studentId: string, courseId: string) => void;
  completeEnrollment: (studentId: string, courseId: string) => Certificate | null;

  // Assignment state
  assignments: Assignment[];
  addAssignment: (newAssignment: Omit<Assignment, 'id' | 'createdAt'>) => Promise<{ assignment: Assignment | null; error?: string }>;
  updateAssignment: (assignment: Assignment) => Promise<{ ok: boolean; error?: string }>;

  // Submission state
  submissions: AssignmentSubmission[];
  submitAssignment: (submission: Omit<AssignmentSubmission, 'id' | 'submittedAt' | 'status'>) => void;
  gradeSubmission: (submissionId: string, grade: number, feedback: string) => void;

  // Certificate state
  certificates: Certificate[];
  issueCertificate: (studentId: string, studentName: string, courseId: string, courseName: string, instructorName: string) => Certificate;
  issueCertificateForStudent: (studentId: string, courseId: string) => Promise<{ certificate?: Certificate; error?: string }>;
  getCertificateByOutwardNo: (outwardNo: string) => Certificate | undefined;
  getCertificateById: (certId: string) => Certificate | undefined;
  revokeCertificate: (certId: string) => void;

  // Registration Cards state
  registrationCards: RegistrationCard[];
  issueRegistrationCard: (studentId: string, studentName: string, email: string) => RegistrationCard;
  getRegistrationByNo: (regNo: string) => RegistrationCard | undefined;
  getRegistrationByStudentId: (studentId: string) => RegistrationCard | undefined;
  revokeRegistration: (regId: string) => void;

  // Hydration
  hydrateFromSupabase: () => Promise<void>;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      // Auth State — defaults to null (guest). Supabase Auth is the source of truth.
      currentUser: null,
      allUsers: [],

      setUser: (user: UserProfile | null) => set({ currentUser: user }),

      logoutUser: () => {
        set({
          currentUser: null,
          allUsers: [],
          courses: [],
          enrollments: [],
          assignments: [],
          submissions: [],
          certificates: [],
          registrationCards: [],
        });
        // Clear localStorage persisted data
        if (typeof window !== 'undefined') {
          localStorage.removeItem('learnhub-platform-storage');
        }
      },

      updateUserRole: (userId: string, newRole: UserRole) => {
        set((state) => {
          const updatedUsers = state.allUsers.map((u) =>
            u.id === userId ? { ...u, role: newRole } : u
          );
          const updatedCurrent =
            state.currentUser?.id === userId
              ? { ...state.currentUser, role: newRole }
              : state.currentUser;
          return { allUsers: updatedUsers, currentUser: updatedCurrent };
        });
      },

      // Courses — starts empty, hydrated from Supabase
      courses: [],
      addCourse: async (newCourseData) => {
        const newCourse: Course = {
          ...newCourseData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          enrolledCount: 0,
          totalAssignments: 0,
        };

        const saved = await supabaseService.insertCourse(newCourse);
        if (!saved) return null;

        set((state) => ({ courses: [newCourse, ...state.courses] }));
        return newCourse;
      },
      updateCourse: async (course) => {
        const saved = await supabaseService.updateCourse(course);
        if (!saved) return false;
        set((state) => ({ courses: state.courses.map((item) => item.id === course.id ? course : item) }));
        return true;
      },
      deleteCourse: (courseId) => {
        set((state) => ({
          courses: state.courses.filter((c) => c.id !== courseId),
        }));
      },

      // Enrollments — starts empty
      enrollments: [],
      enrollInCourse: (studentId, courseId) => {
        const existing = get().enrollments.find(
          (e) => e.studentId === studentId && e.courseId === courseId
        );
        if (existing) return;

        const newEnrollment: Enrollment = {
          id: `enr-${Date.now()}`,
          studentId,
          courseId,
          status: 'enrolled',
          enrolledAt: new Date().toISOString(),
        };

        set((state) => ({
          enrollments: [...state.enrollments, newEnrollment],
          courses: state.courses.map((c) =>
            c.id === courseId ? { ...c, enrolledCount: (c.enrolledCount || 0) + 1 } : c
          ),
        }));

        // Persist to Supabase
        supabaseService.insertEnrollment(studentId, courseId);
      },

      completeEnrollment: (studentId, courseId) => {
        const course = get().courses.find((c) => c.id === courseId);
        const student = get().allUsers.find((u) => u.id === studentId) || get().currentUser;

        if (!course || !student) return null;

        set((state) => ({
          enrollments: state.enrollments.map((e) =>
            e.studentId === studentId && e.courseId === courseId
              ? { ...e, status: 'completed', completedAt: new Date().toISOString() }
              : e
          ),
        }));

        const existingCert = get().certificates.find(
          (c) => c.studentId === studentId && c.courseId === courseId
        );
        if (existingCert) return existingCert;

        return get().issueCertificate(
          studentId,
          student.fullName,
          courseId,
          course.title,
          course.instructorName
        );
      },

      // Assignments — starts empty
      assignments: [],
      addAssignment: async (assignmentData) => {
        const newAssignment: Assignment = {
          ...assignmentData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
        };
        const saved = await supabaseService.insertAssignment(newAssignment);
        if (!saved.ok) return { assignment: null, error: saved.error };
        set((state) => ({
          assignments: [newAssignment, ...state.assignments],
          courses: state.courses.map((c) =>
            c.id === assignmentData.courseId
              ? { ...c, totalAssignments: (c.totalAssignments || 0) + 1 }
              : c
          ),
        }));
        return { assignment: newAssignment };
      },
      updateAssignment: async (assignment) => {
        const result = await supabaseService.updateAssignment(assignment);
        if (!result.ok) return result;
        set((state) => ({ assignments: state.assignments.map((item) => item.id === assignment.id ? assignment : item) }));
        return result;
      },

      // Submissions — starts empty
      submissions: [],
      submitAssignment: (submissionData) => {
        const student = get().currentUser;
        const studentName = student ? student.fullName : 'Student';
        const existingIndex = get().submissions.findIndex(
          (s) => s.assignmentId === submissionData.assignmentId && s.studentId === submissionData.studentId
        );

        if (existingIndex >= 0) {
          set((state) => {
            const updated = [...state.submissions];
            updated[existingIndex] = {
              ...updated[existingIndex],
              ...submissionData,
              studentName,
              status: 'submitted',
              submittedAt: new Date().toISOString(),
            };
            return { submissions: updated };
          });
        } else {
          const newSubmission: AssignmentSubmission = {
            ...submissionData,
            id: `sub-${Date.now()}`,
            studentName,
            status: 'submitted',
            submittedAt: new Date().toISOString(),
          };
          set((state) => ({ submissions: [newSubmission, ...state.submissions] }));
        }
      },

      gradeSubmission: (submissionId, grade, feedback) => {
        set((state) => ({
          submissions: state.submissions.map((s) =>
            s.id === submissionId
              ? { ...s, grade, feedback, status: 'graded' }
              : s
          ),
        }));
      },

      // Certificates — starts empty
      certificates: [],
      issueCertificate: (studentId, studentName, courseId, courseName, instructorName) => {
        const year = new Date().getFullYear();
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const outwardNo = `CERT-${year}-${randomNum}`;

        const newCert: Certificate = {
          id: `cert-${randomNum}`,
          outwardNo,
          studentId,
          courseId,
          studentName,
          courseName,
          instructorName,
          institution: 'LearnHub Institute of Technology',
          issueDate: new Date().toISOString(),
          status: 'VALID',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          certificates: [newCert, ...state.certificates],
        }));

        return newCert;
      },
      issueCertificateForStudent: async (studentId, courseId) => {
        const course = get().courses.find((item) => item.id === courseId);
        const student = get().allUsers.find((item) => item.id === studentId);
        const currentUser = get().currentUser;
        if (!course || !student || !currentUser || currentUser.role !== 'instructor' || course.instructorId !== currentUser.id) {
          return { error: 'Only the course instructor can issue this certificate.' };
        }
        if (course.status !== 'completed') return { error: 'Mark the course as completed before issuing certificates.' };
        const courseAssignments = get().assignments.filter((assignment) => assignment.courseId === courseId);
        const submitted = courseAssignments.length > 0 && courseAssignments.every((assignment) => get().submissions.some((submission) => submission.assignmentId === assignment.id && submission.studentId === studentId));
        if (!submitted) return { error: 'This student has not completed every assignment yet.' };
        const existing = get().certificates.find((certificate) => certificate.studentId === studentId && certificate.courseId === courseId);
        if (existing) return { certificate: existing };
        const certificate = get().issueCertificate(studentId, student.fullName, courseId, course.title, currentUser.fullName);
        const saved = await supabaseService.insertCertificate(certificate);
        if (!saved) {
          set((state) => ({ certificates: state.certificates.filter((item) => item.id !== certificate.id) }));
          return { error: 'Certificate could not be saved.' };
        }
        return { certificate };
      },

      getCertificateByOutwardNo: (outwardNo: string) => {
        const clean = outwardNo.trim().toUpperCase();
        return get().certificates.find(
          (c) => c.outwardNo.toUpperCase() === clean || c.id.toUpperCase() === clean
        );
      },

      getCertificateById: (certId: string) => {
        return get().certificates.find((c) => c.id === certId);
      },

      revokeCertificate: (certId: string) => {
        set((state) => ({
          certificates: state.certificates.map((c) =>
            c.id === certId || c.outwardNo === certId ? { ...c, status: 'REVOKED' } : c
          ),
        }));
      },

      // Registration Cards — starts empty
      registrationCards: [],
      issueRegistrationCard: (studentId: string, studentName: string, email: string) => {
        const existing = get().registrationCards.find((r) => r.studentId === studentId);
        if (existing) return existing;

        const year = new Date().getFullYear();
        const randomNum = Math.floor(100000 + Math.random() * 900000);
        const registrationNo = `REG-${year}-${randomNum}`;

        const newRegCard: RegistrationCard = {
          id: `regcard-${randomNum}`,
          registrationNo,
          studentId,
          studentName,
          email,
          institution: 'LearnHub Institute of Technology',
          department: 'Department of Applied Sciences',
          issueDate: new Date().toISOString(),
          status: 'VALID',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          registrationCards: [newRegCard, ...state.registrationCards],
        }));

        // Persist to Supabase
        supabaseService.insertRegistration(newRegCard);

        return newRegCard;
      },

      getRegistrationByNo: (regNo: string) => {
        const clean = regNo.trim().toUpperCase();
        return get().registrationCards.find(
          (r) => r.registrationNo.toUpperCase() === clean || r.id.toUpperCase() === clean
        );
      },

      getRegistrationByStudentId: (studentId: string) => {
        return get().registrationCards.find((r) => r.studentId === studentId);
      },

      revokeRegistration: (regId: string) => {
        set((state) => ({
          registrationCards: state.registrationCards.map((r) =>
            r.id === regId || r.registrationNo === regId ? { ...r, status: 'REVOKED' } : r
          ),
        }));
      },

      // Hydrate all data from Supabase
      hydrateFromSupabase: async () => {
        const [profiles, dbCourses, dbEnrollments, dbAssignments, dbSubmissions, dbCertificates, dbRegistrations] = await Promise.all([
          supabaseService.fetchProfiles(),
          supabaseService.fetchCourses(),
          supabaseService.fetchEnrollments(),
          supabaseService.fetchAssignments(),
          supabaseService.fetchSubmissions(),
          supabaseService.fetchCertificates(),
          supabaseService.fetchRegistrations(),
        ]);

        const currentUser = get().currentUser;
        const updatedUser = currentUser
          ? profiles.find((p) => p.id === currentUser.id) || currentUser
          : null;

        set({
          allUsers: profiles,
          courses: dbCourses,
          enrollments: dbEnrollments,
          assignments: dbAssignments,
          submissions: dbSubmissions,
          certificates: dbCertificates,
          registrationCards: dbRegistrations,
          currentUser: updatedUser,
        });
      },
    }),
    {
      name: 'learnhub-platform-storage',
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);
