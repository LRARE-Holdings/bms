export type UserRole = "member" | "staff" | "admin";
export type BookingStatus = "confirmed" | "cancelled";
export type PaymentMethod = "stripe" | "pack_credit";
export type PackType = "5" | "10";

export interface Studio {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  email_from: string | null;
  email_domain: string | null;
  branding: Record<string, string>;
  active: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioMembership {
  id: string;
  studio_id: string;
  profile_id: string;
  role: UserRole;
  created_at: string;
}

export interface Class {
  id: string;
  studio_id: string;
  name: string;
  slug: string;
  description: string;
  duration_mins: number;
  price_pence: number;
  image_url: string | null;
  created_at: string;
}

export interface Instructor {
  id: string;
  studio_id: string;
  name: string;
  slug: string;
  bio: string;
  photo_url: string | null;
  profile_id: string | null;
  created_at: string;
}

export interface ScheduleSlot {
  id: string;
  studio_id: string;
  class_id: string;
  instructor_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  is_active: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  studio_id: string;
  schedule_id: string;
  profile_id: string;
  date: string;
  status: BookingStatus;
  payment_method: PaymentMethod;
  stripe_session_id: string | null;
  created_at: string;
}

export interface ClassPack {
  id: string;
  studio_id: string;
  profile_id: string;
  pack_type: PackType;
  credits_total: number;
  credits_remaining: number;
  purchased_at: string;
  expires_at: string;
  stripe_session_id: string;
  created_at: string;
}

// Composite types for joined queries
export interface TimetableSlot {
  schedule_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_name: string;
  class_slug: string;
  duration_mins: number;
  price_pence: number;
  instructor_name: string;
  booking_count: number;
  spots_remaining: number;
  date: string;
}

export interface BookingWithDetails extends Booking {
  class_name: string;
  class_slug: string;
  duration_mins: number;
  start_time: string;
  instructor_name: string;
}
