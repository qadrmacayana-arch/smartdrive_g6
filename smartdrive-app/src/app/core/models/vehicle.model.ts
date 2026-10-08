export interface Vehicle {
  id: number;
  vehicle_id: string;
  name: string;
  type: string;
  main_category: string;
  price: number;
  sr_points: number;
  image: string | null;
  description: string | null;
  features: string[] | null;
  transmission: string;
  fuel: string;
  seats: number;
  status: 'available' | 'booked' | 'maintenance' | 'archived';
  is_featured: boolean;
  created_at?: string | null;
}
