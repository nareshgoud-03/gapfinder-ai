import { supabase, isSupabaseConfigured } from './client';
import { StudentProfile } from '@/types';
import { DEMO_STUDENT } from '@/lib/mockData';

export interface AuthResult {
  success: boolean;
  user?: StudentProfile;
  error?: string;
}

/**
 * Signs in using Supabase Auth (or instant local demo login if Supabase is unconfigured).
 */
export async function authenticateStudent(
  email: string,
  password: string
): Promise<AuthResult> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile: StudentProfile = {
          id: data.user.id,
          name: data.user.user_metadata?.full_name || email.split('@')[0],
          email: data.user.email || email,
          targetExam: data.user.user_metadata?.target_exam || 'Class 12 CBSE & JEE Mathematics',
          targetGrade: 'Target: 90%+',
          examDate: '2026-03-15',
          isDemoUser: false,
        };
        return { success: true, user: profile };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Authentication failed';
      return { success: false, error: msg };
    }
  }

  // Local / Demo mode fallback
  if (email === 'student.demo@gapfinder.ai' || password === 'demo2026') {
    return { success: true, user: DEMO_STUDENT };
  }

  // Allow any custom local credentials in demo/offline mode
  const localProfile: StudentProfile = {
    id: `student-${Date.now()}`,
    name: email.split('@')[0],
    email,
    targetExam: 'Custom Exam Syllabus',
    targetGrade: 'Target: 90%+',
    examDate: '2026-03-15',
    isDemoUser: false,
  };

  return { success: true, user: localProfile };
}

/**
 * Registers a new student via Supabase Auth.
 */
export async function registerStudent(
  email: string,
  password: string,
  fullName: string,
  targetExam: string
): Promise<AuthResult> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            target_exam: targetExam,
          },
        },
      });

      if (error) {
        return { success: false, error: error.message };
      }

      if (data.user) {
        const profile: StudentProfile = {
          id: data.user.id,
          name: fullName,
          email,
          targetExam,
          targetGrade: 'Target: 90%+',
          examDate: '2026-03-15',
          isDemoUser: false,
        };
        return { success: true, user: profile };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Registration failed';
      return { success: false, error: msg };
    }
  }

  // Local fallback registration
  const profile: StudentProfile = {
    id: `student-${Date.now()}`,
    name: fullName,
    email,
    targetExam,
    targetGrade: 'Target: 90%+',
    examDate: '2026-03-15',
    isDemoUser: false,
  };

  return { success: true, user: profile };
}
