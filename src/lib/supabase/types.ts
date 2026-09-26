/**
 * Hand-written to match supabase/migrations/20260909120000_init.sql.
 * Regenerate later with:
 *   npx supabase gen types typescript --linked > src/lib/supabase/types.ts
 */

export type Gender = "sister" | "brother";
export type ProfileStatus = "draft" | "active" | "paused" | "hidden" | "suspended";
export type Plan = "free" | "full_access" | "lifetime";
export type Category = "standard" | "widowed";
export type MaritalStatus = "never_married" | "divorced" | "widowed";
export type WaliType = "family" | "independent" | "none_yet";
export type Availability = "available" | "limited" | "full";
export type RequestStatus = "pending" | "accepted" | "declined" | "withdrawn";
export type WaliRequestStatus = RequestStatus | "ended";

export interface ProfileRow {
  id: string;
  created_at: string;
  updated_at: string;
  role: "member" | "wali" | "admin";
  status: ProfileStatus;
  is_demo: boolean;
  plan: Plan;
  plan_since: string | null;
  req_anchor: string | null;
  req_cycle: number;
  req_carry: number;
  last_active_at: string | null;
  gender: Gender | null;
  public_ref: string | null;
  alias: string | null;
  date_of_birth: string | null;
  ethnicity: string | null;
  location_country: string | null;
  location_city: string | null;
  marital_status: MaritalStatus | null;
  category: Category;
  has_children: boolean;
  children_note: string | null;
  practice_prayer: string | null;
  sect: string | null;
  height_cm: number | null;
  build: string | null;
  about: string | null;
  looking_for: string | null;
  timeline: string | null;
  wants_children: string | null;
  relocate: string | null;
  wali_type: WaliType;
  wali_name: string | null;
  wali_relationship: string | null;
  wali_contact: string | null;
  independent_wali_id: string | null;
}

export interface IndependentWaliRow {
  id: string;
  user_id: string | null;
  name: string;
  role: string;
  location: string;
  languages: string[];
  years_serving: number;
  references_verified: boolean;
  availability: Availability;
  bio: string;
  active: boolean;
  created_at: string;
}

export interface WaliRequestRow {
  id: string;
  sister_id: string;
  wali_id: string;
  status: WaliRequestStatus;
  message: string | null;
  scope_agreed: string | null;
  duration_agreed: string | null;
  fee_agreed: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface InterestRequestRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  status: RequestStatus;
  message: string | null;
  created_at: string;
  responded_at: string | null;
}

export interface MatchRow {
  id: string;
  a_id: string;
  b_id: string;
  interest_request_id: string | null;
  status: "active" | "closed";
  wali_visible: boolean;
  created_at: string;
}

export interface MessageRow {
  id: string;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface ProfileViewRow {
  viewer_id: string;
  viewed_id: string;
  viewed_at: string;
}

export interface NudgeRow {
  id: string;
  sender_id: string;
  recipient_id: string;
  created_at: string;
}

type TableShape<Row, Insert = Partial<Row>, Update = Partial<Row>> = {
  Row: Row;
  Insert: Insert;
  Update: Update;
  Relationships: [];
};

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: "13.0.5";
  };
  public: {
    Tables: {
      profiles: TableShape<ProfileRow, { id: string } & Partial<ProfileRow>>;
      independent_walis: TableShape<IndependentWaliRow>;
      wali_requests: TableShape<
        WaliRequestRow,
        Pick<WaliRequestRow, "sister_id" | "wali_id"> & Partial<WaliRequestRow>
      >;
      interest_requests: TableShape<
        InterestRequestRow,
        Pick<InterestRequestRow, "sender_id" | "recipient_id"> &
          Partial<InterestRequestRow>
      >;
      matches: TableShape<MatchRow>;
      messages: TableShape<
        MessageRow,
        Pick<MessageRow, "match_id" | "sender_id" | "body"> & Partial<MessageRow>
      >;
      profile_views: TableShape<
        ProfileViewRow,
        Pick<ProfileViewRow, "viewer_id" | "viewed_id"> & Partial<ProfileViewRow>
      >;
      nudges: TableShape<
        NudgeRow,
        Pick<NudgeRow, "sender_id" | "recipient_id"> & Partial<NudgeRow>
      >;
    };
    Views: Record<never, never>;
    Functions: {
      accept_interest_request: {
        Args: { request_id: string };
        Returns: string;
      };
    };
    Enums: Record<never, never>;
    CompositeTypes: Record<never, never>;
  };
}
