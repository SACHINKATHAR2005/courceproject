'use client';

import { useEffect, useSyncExternalStore } from 'react';
import { useStore } from '@/lib/store/useStore';
import { supabaseService } from '@/lib/services/supabaseService';

const subscribe = () => () => undefined;
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export function useStudentData() {
    const ready = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
    const state = useStore();
    const { currentUser } = state;

    useEffect(() => {
        let active = true;
        const hydrate = async () => {
            if (!currentUser) return;
            const [profiles, courses, enrollments, assignments, submissions, certificates, registrationCards] = await Promise.all([
                supabaseService.fetchProfiles(),
                supabaseService.fetchCourses(),
                supabaseService.fetchEnrollments(),
                supabaseService.fetchAssignments(),
                supabaseService.fetchSubmissions(),
                supabaseService.fetchCertificates(),
                supabaseService.fetchRegistrations(),
            ]);
            if (active) {
                const profile = profiles.find((item) => item.id === currentUser.id);
                useStore.setState({ allUsers: profiles, courses, enrollments, assignments, submissions, certificates, registrationCards, currentUser: profile || null });
            }
        };
        void hydrate();
        return () => { active = false; };
    }, [currentUser?.id]);

    useEffect(() => {
        if (!currentUser || currentUser.role !== 'student') return;
        if (!state.registrationCards.some((card) => card.studentId === currentUser.id)) {
            state.issueRegistrationCard(currentUser.id, currentUser.fullName, currentUser.email);
        }
    }, [currentUser, state.registrationCards, state.issueRegistrationCard]);

    const myEnrollments = currentUser ? state.enrollments.filter((item) => item.studentId === currentUser.id) : [];
    const mySubmissions = currentUser ? state.submissions.filter((item) => item.studentId === currentUser.id) : [];
    const myCertificates = currentUser ? state.certificates.filter((item) => item.studentId === currentUser.id) : [];
    const enrolledCourseIds = new Set(myEnrollments.map((item) => item.courseId));
    const myAssignments = state.assignments.filter((item) => enrolledCourseIds.has(item.courseId));
    const myRegistrationCard = currentUser ? state.getRegistrationByStudentId(currentUser.id) : undefined;

    return {
        ready,
        currentUser,
        courses: state.courses,
        enrollments: state.enrollments,
        assignments: state.assignments,
        submissions: state.submissions,
        certificates: state.certificates,
        myEnrollments,
        myAssignments,
        mySubmissions,
        myCertificates,
        myRegistrationCard,
    };
}
