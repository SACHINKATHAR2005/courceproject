'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/lib/store/useStore';
import { supabaseService } from '@/lib/services/supabaseService';
import { enrollInCourse as enrollWithPayment } from '@/lib/services/paymentService';
import { BookOpen, Search, CheckCircle2, UserCheck, Clock, CalendarDays } from 'lucide-react';

export default function CoursesPage() {
  const { courses, currentUser, enrollments } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [loading, setLoading] = useState(courses.length === 0);
  const [processingCourseId, setProcessingCourseId] = useState<string | null>(null);
  const [enrollmentError, setEnrollmentError] = useState('');

  // Fetch courses from Supabase on mount (public page — no auth required)
  useEffect(() => {
    if (courses.length > 0) { setLoading(false); return; }
    supabaseService.fetchCourses().then((dbCourses) => {
      if (dbCourses.length > 0) {
        useStore.setState({ courses: dbCourses });
      }
      setLoading(false);
    });
  }, []);

  const categories = ['All', 'Web Development', 'Backend & Cloud', 'UI/UX Design'];

  const filteredCourses = courses.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || course.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

      {/* Page Header */}
      <div className="space-y-3">
        <div className="inline-flex items-center space-x-2 text-xs uppercase font-extrabold tracking-widest text-amber-400">
          <BookOpen className="w-4 h-4" />
          <span>Curriculum Catalog</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white">Course Directory</h1>
        <p className="text-sm text-slate-400 max-w-2xl">
          Browse specialized technical courses. Enroll to access project assignments and earn your verifiable completion certificate.
        </p>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900 border border-slate-800 p-4 rounded-2xl">
        {/* Search */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search course title or keyword..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Category Tabs */}
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${selectedCategory === cat
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20'
                : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Course Grid */}
      {loading ? (
        <div className="text-center py-20 text-slate-400 text-sm">Loading courses...</div>
      ) : filteredCourses.length === 0 ? (
        <div className="text-center py-20 text-slate-400 text-sm">No courses found.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredCourses.map((course) => {
            const isEnrolled = currentUser
              ? enrollments.some((e) => e.studentId === currentUser.id && e.courseId === course.id)
              : false;

            return (
              <div
                key={course.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all flex flex-col justify-between group shadow-lg"
              >
                <div>
                  <div className="relative h-48 w-full overflow-hidden bg-slate-950">
                    <img
                      src={course.thumbnailUrl}
                      alt={course.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-3 left-3 px-3 py-1 bg-slate-950/80 backdrop-blur-md rounded-full text-[10px] uppercase font-extrabold tracking-wider text-amber-300 border border-amber-500/30">
                      {course.category}
                    </div>
                  </div>

                  <div className="p-6 space-y-3">
                    <h3 className="text-lg font-bold text-white group-hover:text-amber-300 transition-colors">
                      {course.title}
                    </h3>
                    <p className="text-xs text-slate-400 line-clamp-3">
                      {course.description}
                    </p>

                    <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
                      <span className="flex items-center space-x-1">
                        <UserCheck className="w-3.5 h-3.5 text-slate-500" />
                        <span>{course.instructorName}</span>
                      </span>
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3.5 h-3.5 text-slate-500" />
                        <span>{course.duration}</span>
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold text-slate-300">
                      <span className="text-emerald-300">{course.registrationFee ? `₹${course.registrationFee.toFixed(2)}` : 'Free'}</span>
                      <span className="flex items-center gap-1 text-slate-400"><CalendarDays className="h-3.5 w-3.5" />{course.startDate ? new Date(`${course.startDate}T00:00:00`).toLocaleDateString() : 'Start date TBD'}</span>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0">
                  <div className="flex items-center justify-between gap-3">
                    <Link
                      href={`/courses/${course.id}`}
                      className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs text-center transition-all border border-slate-700"
                    >
                      View Details
                    </Link>

                    {isEnrolled ? (
                      <span className="px-3 py-2 rounded-xl bg-emerald-950 text-emerald-300 border border-emerald-500/40 text-xs font-bold flex items-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Enrolled</span>
                      </span>
                    ) : (
                      <button
                        onClick={async () => {
                          if (!currentUser) {
                            window.location.href = '/register';
                          } else {
                            setProcessingCourseId(course.id);
                            setEnrollmentError('');
                            try {
                              await enrollWithPayment(course.id, course.registrationFee || 0, { fullName: currentUser.fullName, email: currentUser.email, phone: currentUser.phone });
                              window.location.href = '/dashboard';
                            } catch (error) {
                              setEnrollmentError(error instanceof Error ? error.message : 'Enrollment failed.');
                            } finally {
                              setProcessingCourseId(null);
                            }
                          }
                        }}
                        disabled={processingCourseId === course.id}
                        className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
                      >
                        {processingCourseId === course.id ? 'Processing...' : 'Enroll Now'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {enrollmentError && <p className="mx-auto max-w-xl rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-center text-sm text-red-300">{enrollmentError}</p>}

    </div>
  );
}
