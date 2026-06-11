// Auth helpers shared by server components / actions.
import type { User } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { isSupabaseConfigured, isAdminEmail } from "./supabase/config";

export async function getUser(): Promise<User | null> {
  if (!isSupabaseConfigured) return null;
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user;
  } catch {
    return null;
  }
}

export async function getAdminUser(): Promise<User | null> {
  const user = await getUser();
  if (!user) return null;
  return isAdminEmail(user.email) ? user : null;
}
