export interface ToyImage {
  id: string;
  toy_id: string;
  image_url: string;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Toy {
  id: string;
  name: string;
  description: string;
  brand: string | null;
  language: string | null;
  link: string | null;
  battery_operated: boolean;
  shareable: boolean;
  age_min: number | null;
  age_max: number | null;
  piece_count: number | null;
  images: ToyImage[];
  tags: string[];
  materials: string[];
  keywords: string[];
  is_available: boolean;
  is_checked_out: boolean;
  is_requested: boolean;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface UserRead {
  id: string;
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  roles: string[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: UserRead;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  address_line1: string;
  address_line2: string | null;
  city: string;
  state: string;
  zip: string;
  password: string;
}

export interface MembershipRequestRead {
  id: string;
  user_id: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  status: "pending" | "approved" | "denied";
  notes: string | null;
  user: UserRead;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface ToyCreate {
  name: string;
  description: string;
  brand: string | null;
  language: string | null;
  link: string | null;
  battery_operated: boolean;
  shareable: boolean;
  age_min: number | null;
  age_max: number | null;
  piece_count: number | null;
  materials: string[];
  keywords: string[];
  tags: string[];
}

export interface ToyUpdate {
  name?: string;
  description?: string;
  brand?: string | null;
  link?: string | null;
  battery_operated?: boolean;
  shareable?: boolean;
  age_min?: number | null;
  age_max?: number | null;
  piece_count?: number | null;
  materials?: string[];
  keywords?: string[];
  tags?: string[];
}

export interface BorrowRequestRead {
  id: string;
  batch_id: string;
  toy_id: string;
  membership_id: string;
  status: "pending" | "approved" | "denied";
  denial_note: string | null;
  return_date: string | null;
  return_start: string | null;
  return_end: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface BorrowRequestReadWithDetails extends BorrowRequestRead {
  toy_name: string;
  member_name: string;
  member_user_id: string | null;
  pickup_start: string | null;
  pickup_end: string | null;
  return_start: string | null;
  return_end: string | null;
}

export interface MembershipRead {
  id: string;
  membership_request_id: string;
  start_date: string;
  end_date: string;
  account_standing: "active" | "banned" | "temporary_hold";
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TimeframeRead {
  id: string;
  start_time: string;
  end_time: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface TimeframeCreate {
  start_time: string;
  end_time: string;
  notes: string | null;
}

export interface CheckoutRead {
  id: string;
  toy_id: string;
  membership_id: string;
  request_id: string | null;
  checked_out_at: string;
  due_at: string;
  returned_at: string | null;
  member_name: string;
  toy_name: string;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface FavoriteRead {
  id: string;
  user_id: string;
  toy_id: string;
  created_at: string;
  updated_at: string;
}

export interface HelloResponse {
  message: string;
}
