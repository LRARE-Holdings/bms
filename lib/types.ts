export type UserRole = "member" | "staff" | "admin";
export type BookingStatus = "confirmed" | "cancelled";
export type PaymentMethod = "stripe" | "pack_credit" | "complimentary" | "membership" | "birthday";

export interface Studio {
  id: string;
  name: string;
  slug: string;
  domain: string | null;
  email_from: string | null;
  email_domain: string | null;
  branding: Record<string, string>;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean;
  active: boolean;
  first_class_free_enabled: boolean;
  created_at: string;
}

export interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
  date_of_birth: string | null;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface StudioMembership {
  id: string;
  studio_id: string;
  profile_id: string;
  role: UserRole;
  free_class_used: boolean;
  created_at: string;
}

export interface Class {
  id: string;
  studio_id: string;
  name: string;
  slug: string;
  description: string;
  duration_mins: number;
  /** List price. A running discount is applied on top, never written into this. */
  price_pence: number;
  discount_percent: number | null;
  discount_starts_on: string | null;
  discount_ends_on: string | null;
  image_url: string | null;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
}

export interface StudioEvent {
  id: string;
  studio_id: string;
  /** Set once from the title and never changed, so shared links keep working */
  slug: string;
  title: string;
  description: string;
  /** UK wall-clock date, YYYY-MM-DD */
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  location: string | null;
  image_url: string | null;
  link_url: string | null;
  link_label: string | null;
  is_published: boolean;
  tickets_enabled: boolean;
  price_pence: number;
  capacity: number | null;
  max_tickets_per_member: number;
  /** Null means on sale as soon as the event is published */
  sales_open_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
}

/** What the signed-in member already has for one event. */
export interface EventMemberState {
  /** Places they hold on confirmed tickets */
  ticketsHeld: number;
  waitlist: { status: "waiting" | "offered"; quantity: number; claimToken: string } | null;
  alertRequested: boolean;
}

/** Live availability for one ticketed event. */
export interface EventAvailability {
  placesLeft: number;
  /** Someone is waiting, so freed places go to the queue, not the public */
  queueOpen: boolean;
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
  pack_type?: string;
  pack_tier_id?: string | null;
  credits_total: number;
  credits_remaining: number;
  purchased_at: string;
  expires_at: string;
  stripe_session_id: string;
  created_at: string;
}

export interface PackTier {
  id: string;
  studio_id: string;
  name: string;
  credits: number;
  price_pence: number;
  validity_days: number;
  is_active: boolean;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
}

export interface MembershipTier {
  id: string;
  studio_id: string;
  name: string;
  description: string;
  price_pence: number;
  interval: string;
  interval_count: number;
  is_active: boolean;
  stripe_product_id: string | null;
  stripe_price_id: string | null;
  created_at: string;
}

export interface Membership {
  id: string;
  studio_id: string;
  profile_id: string;
  membership_tier_id: string;
  stripe_subscription_id: string | null;
  status: string;
  current_period_start: string | null;
  current_period_end: string | null;
  cancelled_at: string | null;
  created_at: string;
}

export type CheckoutType = "dropin" | "pack" | "membership" | "waitlist_claim" | "event_ticket";

// Composite types for joined queries
export interface TimetableSlot {
  schedule_id: string;
  class_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  class_name: string;
  class_slug: string;
  duration_mins: number;
  price_pence: number;
  /** Today's price. Equals price_pence unless a discount window is open. */
  effective_price_pence?: number;
  /** Set only while a discount is actually running. */
  discount_percent?: number | null;
  max_capacity: number;
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

export interface ClassPackWithTier extends ClassPack {
  pack_tiers: { name: string; credits: number } | null;
}

export type BirthdayTokenStatus = "active" | "used" | "expired";

export interface BirthdayToken {
  id: string;
  studio_id: string;
  profile_id: string;
  token: string;
  birthday_year: number;
  status: BirthdayTokenStatus;
  expires_at: string;
  created_at: string;
}

export type WaitlistStatus = "waiting" | "offered" | "claimed" | "expired" | "cancelled";

export interface WaitlistEntry {
  id: string;
  studio_id: string;
  schedule_id: string;
  date: string;
  profile_id: string;
  position: number;
  status: WaitlistStatus;
  offered_at: string | null;
  expires_at: string | null;
  claim_token: string;
  created_at: string;
}

export interface WaitlistEntryWithDetails extends WaitlistEntry {
  class_name: string;
  class_slug: string;
  start_time: string;
  duration_mins: number;
  instructor_name: string;
}
