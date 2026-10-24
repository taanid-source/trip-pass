import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
);

export type Trip = {
  id: string;
  name: string;
  currency: string;
  members: string[];
  created_at: string;
};

export type Expense = {
  id: string;
  trip_id: string;
  description: string;
  amount: number;
  paid_by: string;
  split_between: string[];
  created_at: string;
};
