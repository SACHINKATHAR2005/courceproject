'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { useStore } from '@/lib/store/useStore';
import type { UserRole } from '@/lib/types';

interface AuthAccessGateProps {
    requiredRole: 'instructor' | 'admin';
    children: React.ReactNode;
}

export const AuthAccessGate: React.FC<AuthAccessGateProps> = ({ requiredRole, children }) => {
    const router = useRouter();
    const setUser = useStore((state) => state.setUser);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        let active = true;
        if (!supabase) {
            router.replace('/staff-auth');
            return () => { active = false; };
        }
        const client = supabase;

        client.auth.getUser().then(async ({ data }) => {
            if (!data.user) {
                router.replace('/staff-auth');
                return;
            }
            const { data: profile } = await client.from('profiles').select('*').eq('id', data.user.id).maybeSingle();
            if (!profile || profile.role !== requiredRole) {
                router.replace('/access-denied');
                return;
            }
            if (active) {
                setUser({ id: profile.id, fullName: profile.full_name, email: profile.email, phone: profile.phone, role: profile.role as UserRole, avatarUrl: profile.avatar_url, createdAt: profile.created_at });
                setAuthorized(true);
            }
        });

        return () => { active = false; };
    }, [requiredRole, router, setUser]);

    if (!authorized) {
        return <div className="mx-auto max-w-md px-4 py-24 text-center text-sm text-slate-500">Checking authorization...</div>;
    }

    return <>{children}</>;
};
