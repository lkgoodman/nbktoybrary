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
  link: string | null;
  battery_operated: boolean;
  shareable: boolean;
  age_min: number | null;
  age_max: number | null;
  piece_count: number | null;
  images: ToyImage[];
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface HelloResponse {
  message: string;
}
