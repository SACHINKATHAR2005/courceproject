-- ============================================================================
-- SUPABASE COMPLETE DATABASE SCHEMA & RLS POLICIES
-- ============================================================================
-- Platform: LearnHub Certify Course Platform & Credential Verification System
-- Tables:
--   1. public.profiles (Users & Roles: 'student', 'instructor', 'admin')
--   2. public.courses (Curriculum created by Instructors/Admins)
--   3. public.enrollments (Student Course Enrollments)
--   4. public.assignments (Course Assignments)
--   5. public.assignment_submissions (Student Submissions & Evaluation)
--   6. public.certificates (Outward Number Verified Credentials)
--   7. public.registrations (Student Registration Cards & Outward IDs)
-- ============================================================================

-- Enable UUID extension if not already active
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ----------------------------------------------------------------------------
-- 1. PROFILES TABLE (Extends auth.users)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    role TEXT NOT NULL CHECK (role IN ('student', 'instructor', 'admin')) DEFAULT 'student',
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

REVOKE ALL ON FUNCTION public.current_user_role() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_user_role() TO authenticated;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile"
    ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Staff can view profiles" ON public.profiles;
CREATE POLICY "Staff can view profiles"
    ON public.profiles FOR SELECT USING (public.current_user_role() IN ('instructor', 'admin'));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" 
    ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id AND role = 'student');

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
-- Profile role changes are performed only by trusted server-side staff tooling.


-- ----------------------------------------------------------------------------
-- 2. COURSES TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.courses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    instructor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    instructor_name TEXT NOT NULL,
    category TEXT DEFAULT 'Web Development',
    duration TEXT DEFAULT '6 Weeks',
    registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 0 CHECK (registration_fee >= 0),
    start_date DATE,
    status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'ongoing', 'completed')),
    thumbnail_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS registration_fee NUMERIC(10, 2) NOT NULL DEFAULT 0;
ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE public.courses
    ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'upcoming';
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'courses_status_check'
          AND conrelid = 'public.courses'::regclass
    ) THEN
        ALTER TABLE public.courses
            ADD CONSTRAINT courses_status_check CHECK (status IN ('upcoming', 'ongoing', 'completed'));
    END IF;
END;
$$;

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Courses are viewable by everyone" ON public.courses;
CREATE POLICY "Courses are viewable by everyone" 
    ON public.courses FOR SELECT USING (true);

DROP POLICY IF EXISTS "Instructors and Admins can create courses" ON public.courses;
CREATE POLICY "Instructors and Admins can create courses" 
    ON public.courses FOR INSERT 
    WITH CHECK (
        public.current_user_role() = 'admin'
        OR (public.current_user_role() = 'instructor' AND instructor_id = auth.uid())
    );

DROP POLICY IF EXISTS "Instructors and Admins can update courses" ON public.courses;
CREATE POLICY "Instructors and Admins can update courses" 
    ON public.courses FOR UPDATE 
    USING (
        public.current_user_role() = 'admin'
        OR (public.current_user_role() = 'instructor' AND instructor_id = auth.uid())
    )
    WITH CHECK (
        public.current_user_role() = 'admin'
        OR (public.current_user_role() = 'instructor' AND instructor_id = auth.uid())
    );

DROP POLICY IF EXISTS "Instructors and Admins can delete courses" ON public.courses;
CREATE POLICY "Instructors and Admins can delete courses" 
    ON public.courses FOR DELETE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role IN ('instructor', 'admin')
        )
    );


-- ----------------------------------------------------------------------------
-- 3. ENROLLMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    status TEXT NOT NULL CHECK (status IN ('enrolled', 'completed')) DEFAULT 'enrolled',
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    UNIQUE(student_id, course_id)
);

ALTER TABLE public.enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students and staff view enrollments" ON public.enrollments;
CREATE POLICY "Students and staff view enrollments" 
    ON public.enrollments FOR SELECT 
    USING (auth.uid() = student_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    ));

DROP POLICY IF EXISTS "Students can enroll themselves" ON public.enrollments;
CREATE POLICY "Students can enroll themselves" 
    ON public.enrollments FOR INSERT 
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors and Admins can update enrollment completion" ON public.enrollments;
CREATE POLICY "Instructors and Admins can update enrollment completion" 
    ON public.enrollments FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    ));

-- ----------------------------------------------------------------------------
-- 3b. PAYMENTS (Razorpay transaction ledger)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    razorpay_order_id TEXT UNIQUE NOT NULL,
    razorpay_payment_id TEXT UNIQUE,
    razorpay_signature TEXT,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    amount_paise INTEGER NOT NULL CHECK (amount_paise >= 0),
    currency TEXT NOT NULL DEFAULT 'INR',
    status TEXT NOT NULL CHECK (status IN ('pending', 'paid', 'failed')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    paid_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view their payments" ON public.payments;
CREATE POLICY "Students view their payments"
    ON public.payments FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "Admins view all payments" ON public.payments;
CREATE POLICY "Admins view all payments"
    ON public.payments FOR SELECT USING (public.current_user_role() = 'admin');

DROP POLICY IF EXISTS "Students create their payments" ON public.payments;
CREATE POLICY "Students create their payments"
    ON public.payments FOR INSERT WITH CHECK (auth.uid() = student_id);


-- ----------------------------------------------------------------------------
-- 4. ASSIGNMENTS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE,
    max_score INT DEFAULT 100,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Assignments viewable by authenticated users" ON public.assignments;
CREATE POLICY "Assignments viewable by authenticated users" 
    ON public.assignments FOR SELECT USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Instructors and Admins can create assignments" ON public.assignments;
CREATE POLICY "Instructors and Admins can create assignments" 
    ON public.assignments FOR INSERT 
    WITH CHECK (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'instructor'
            AND EXISTS (
                SELECT 1 FROM public.courses
                WHERE courses.id = assignments.course_id
                  AND courses.instructor_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS "Instructors can update their assignments" ON public.assignments;
CREATE POLICY "Instructors can update their assignments"
    ON public.assignments FOR UPDATE
    USING (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'instructor'
            AND EXISTS (
                SELECT 1 FROM public.courses
                WHERE courses.id = assignments.course_id
                  AND courses.instructor_id = auth.uid()
            )
        )
    )
    WITH CHECK (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'instructor'
            AND EXISTS (
                SELECT 1 FROM public.courses
                WHERE courses.id = assignments.course_id
                  AND courses.instructor_id = auth.uid()
            )
        )
    );


-- ----------------------------------------------------------------------------
-- 5. ASSIGNMENT SUBMISSIONS TABLE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    submission_text TEXT,
    file_url TEXT,
    status TEXT NOT NULL CHECK (status IN ('submitted', 'graded', 'resubmit_required')) DEFAULT 'submitted',
    grade INT,
    feedback TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(assignment_id, student_id)
);

ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Students view own submissions, staff view all" ON public.assignment_submissions;
CREATE POLICY "Students view own submissions, staff view all" 
    ON public.assignment_submissions FOR SELECT 
    USING (auth.uid() = student_id OR EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    ));

DROP POLICY IF EXISTS "Students insert their own submissions" ON public.assignment_submissions;
CREATE POLICY "Students insert their own submissions" 
    ON public.assignment_submissions FOR INSERT 
    WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "Instructors and Admins grade submissions" ON public.assignment_submissions;
CREATE POLICY "Instructors and Admins grade submissions" 
    ON public.assignment_submissions FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    ));


-- ----------------------------------------------------------------------------
-- 6. CERTIFICATES TABLE (Outward Number Verification)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    outward_no TEXT UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    course_name TEXT NOT NULL,
    instructor_name TEXT NOT NULL,
    institution TEXT DEFAULT 'LearnHub Institute of Technology',
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('VALID', 'REVOKED')) DEFAULT 'VALID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_certificates_outward_no ON public.certificates(outward_no);
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Certificates are publicly viewable for verification" ON public.certificates;
DROP POLICY IF EXISTS "Students and staff can view certificates" ON public.certificates;
CREATE POLICY "Students and staff can view certificates"
    ON public.certificates FOR SELECT USING (
        auth.uid() = student_id OR public.current_user_role() IN ('admin', 'instructor')
    );

DROP POLICY IF EXISTS "Instructors and Admins can issue certificates" ON public.certificates;
CREATE POLICY "Instructors and Admins can issue certificates" 
    ON public.certificates FOR INSERT
    WITH CHECK (
        public.current_user_role() = 'admin'
        OR (
            public.current_user_role() = 'instructor'
            AND EXISTS (
                SELECT 1 FROM public.courses
                WHERE courses.id = certificates.course_id
                  AND courses.instructor_id = auth.uid()
                  AND courses.status = 'completed'
            )
        )
    );

DROP POLICY IF EXISTS "Instructors and Admins can update certificate status" ON public.certificates;
CREATE POLICY "Instructors and Admins can update certificate status" 
    ON public.certificates FOR UPDATE 
    USING (EXISTS (
        SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('instructor', 'admin')
    ));


-- ----------------------------------------------------------------------------
-- 7. REGISTRATIONS TABLE (Student Registration Cards & Outward IDs)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.registrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    registration_no TEXT UNIQUE NOT NULL,
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    email TEXT NOT NULL,
    institution TEXT DEFAULT 'LearnHub Institute of Technology',
    department TEXT DEFAULT 'Department of Computer Science & Engineering',
    issue_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('VALID', 'REVOKED')) DEFAULT 'VALID',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_registrations_reg_no ON public.registrations(registration_no);
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Registrations are publicly viewable for verification" ON public.registrations;
DROP POLICY IF EXISTS "Students and staff can view registrations" ON public.registrations;
CREATE POLICY "Students and staff can view registrations"
    ON public.registrations FOR SELECT USING (
        auth.uid() = student_id OR public.current_user_role() IN ('admin', 'instructor')
    );

DROP POLICY IF EXISTS "Users and Admins can insert registration cards" ON public.registrations;
CREATE POLICY "Users and Admins can insert registration cards" 
    ON public.registrations FOR INSERT WITH CHECK (
        auth.uid() = student_id AND public.current_user_role() = 'student'
    );

DROP POLICY IF EXISTS "Admins can update registration status" ON public.registrations;
CREATE POLICY "Admins can update registration status" 
    ON public.registrations FOR UPDATE 
    USING (public.current_user_role() IN ('admin', 'instructor'))
    WITH CHECK (public.current_user_role() IN ('admin', 'instructor'));

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'registrations_one_card_per_student'
          AND conrelid = 'public.registrations'::regclass
    ) THEN
        ALTER TABLE public.registrations
            ADD CONSTRAINT registrations_one_card_per_student UNIQUE (student_id);
    END IF;
END;
$$;

-- Public verification exposes only fields needed to validate a credential.
DROP VIEW IF EXISTS public.certificate_verification;
CREATE VIEW public.certificate_verification AS
SELECT outward_no, student_name, course_name, institution, issue_date, status
FROM public.certificates;

DROP VIEW IF EXISTS public.registration_verification;
CREATE VIEW public.registration_verification AS
SELECT registration_no, student_name, institution, department, issue_date, status
FROM public.registrations;

GRANT SELECT ON public.certificate_verification TO anon, authenticated;
GRANT SELECT ON public.registration_verification TO anon, authenticated;


-- ----------------------------------------------------------------------------
-- 8. AUTOMATIC PROFILE & REGISTRATION TRIGGER ON SIGNUP
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, full_name, email, role)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1)),
        NEW.email,
        'student'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================================
-- END OF SCHEMA SCRIPT
-- ============================================================================
