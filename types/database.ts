export type UserRole = 'super_admin' | 'academic_supervisor' | 'tutor' | 'parent_student';
export type EnrollmentStatus = 'trial_pending' | 'trial_completed' | 'active' | 'paused' | 'cancelled';
export type SessionStatus = 'scheduled' | 'completed' | 'cancelled_by_student' | 'cancelled_by_tutor' | 'rescheduled';
export type RequestStatus = 'pending' | 'approved' | 'rejected';

export interface Profile {
  id: string;
  role: UserRole;
  full_name: string;
  email: string;
  phone: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Tutor {
  id: string;
  bio: string | null;
  specialties: string[];
  zoom_meeting_url: string | null;
  is_active: boolean;
  max_students: number;
  created_at: string;
}

export interface Student {
  id: string;
  parent_id: string;
  student_name: string;
  birth_date: string | null;
  gender: 'male' | 'female' | null;
  level: string;
  notes: string | null;
  created_at: string;
}

export interface Enrollment {
  id: string;
  student_id: string;
  tutor_id: string | null;
  preferred_tutor_id: string | null;
  status: EnrollmentStatus;
  plan_tier: string;
  weekly_classes_count: number;
  class_duration_minutes: 30 | 45 | 60;
  created_at: string;
  updated_at: string;
}

export interface AcademySettings {
  id: number;
  min_reschedule_notice_hours: number;
  meeting_provider: 'zoom_static' | 'google_meet_dynamic';
  updated_at: string;
}

export interface ClassSession {
  id: string;
  enrollment_id: string;
  tutor_id: string;
  student_id: string;
  scheduled_at_utc: string;
  duration_minutes: number;
  meeting_url: string | null;
  calendar_event_id: string | null;
  status: session_status_type;
  created_at: string;
}
type session_status_type = SessionStatus;

export interface SessionReport {
  id: string;
  session_id: string;
  attended: boolean;
  surah_from: string | null;
  ayah_from: number | null;
  surah_to: string | null;
  ayah_to: number | null;
  grade_performance: number | null;
  tutor_feedback: string | null;
  homework: string | null;
  created_at: string;
}

export interface ScheduleChangeRequest {
  id: string;
  session_id: string;
  requested_by: string;
  reason: string;
  status: RequestStatus;
  supervisor_notes: string | null;
  created_at: string;
  resolved_at: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}