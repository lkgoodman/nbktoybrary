export interface Toy {
  id: string;
  name: string;
  description: string;
  brand: string | null;
  link: string | null;
  battery_operated: boolean;
  shareable: boolean;
  age_min: number | null;
  age_max: number | null;
  piece_count: number | null;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface HelloResponse {
  message: string;
}
