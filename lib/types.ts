export type UserRole = 'student' | 'instructor' | 'admin';

export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  instructorId: string;
  instructorName: string;
  category: string;
  duration: string;
  registrationFee?: number;
  startDate?: string;
  status?: 'upcoming' | 'ongoing' | 'completed';
  thumbnailUrl: string;
  createdAt: string;
  enrolledCount?: number;
  totalAssignments?: number;
}

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  status: 'enrolled' | 'completed';
  enrolledAt: string;
  completedAt?: string;
}

export interface Payment {
  id: string;
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  studentId: string;
  courseId: string;
  amountPaise: number;
  currency: string;
  status: 'pending' | 'paid' | 'failed';
  createdAt: string;
  paidAt?: string;
}

export interface Assignment {
  id: string;
  courseId: string;
  title: string;
  description: string;
  dueDate: string;
  maxScore: number;
  createdAt: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submissionText: string;
  fileUrl?: string;
  status: 'submitted' | 'graded' | 'resubmit_required';
  grade?: number;
  feedback?: string;
  submittedAt: string;
}

export interface Certificate {
  id: string;
  outwardNo: string;
  studentId: string;
  courseId: string;
  studentName: string;
  courseName: string;
  instructorName: string;
  institution?: string;
  duration?: string;
  completionDate?: string;
  issueDate: string;
  status?: 'VALID' | 'REVOKED';
  createdAt: string;
}

export interface RegistrationCard {
  id: string;
  registrationNo: string; // e.g. REG-2026-894120
  studentId: string;
  studentName: string;
  email: string;
  institution: string;
  department?: string;
  issueDate: string;
  status: 'VALID' | 'REVOKED';
  createdAt: string;
}
