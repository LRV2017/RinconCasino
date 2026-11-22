import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from "./cloud-config.js";

const configured =
  typeof SUPABASE_URL === "string" &&
  /^https:\/\/[a-z0-9-]+\.supabase\.co$/i.test(SUPABASE_URL) &&
  typeof SUPABASE_PUBLISHABLE_KEY === "string" &&
  SUPABASE_PUBLISHABLE_KEY.length > 20 &&
  !SUPABASE_PUBLISHABLE_KEY.includes("YOUR_");

const client = configured
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    })
  : null;

function requireClient() {
  if (!client) throw new Error("Cloud accounts are not configured yet. Add your Supabase project URL and publishable key to cloud-config.js.");
  return client;
}

export const cloudConfigured = configured;

export async function cloudGetSession() {
  return requireClient().auth.getSession();
}

export function cloudOnAuthStateChange(callback) {
  return requireClient().auth.onAuthStateChange(callback);
}

export async function cloudSignUp(email, password, displayName) {
  const redirectTo = window.location.origin + window.location.pathname;
  return requireClient().auth.signUp({
    email,
    password,
    options: {
      data: { display_name: displayName || "ROOKIE" },
      emailRedirectTo: redirectTo
    }
  });
}

export async function cloudSignIn(email, password) {
  return requireClient().auth.signInWithPassword({ email, password });
}

export async function cloudSignOut() {
  return requireClient().auth.signOut();
}

export async function cloudSendPasswordReset(email) {
  const redirectTo = window.location.origin + window.location.pathname;
  return requireClient().auth.resetPasswordForEmail(email, { redirectTo });
}

export async function cloudLoadSave(userId) {
  const { data, error } = await requireClient()
    .from("rogueboard_saves")
    .select("save_version, save_data, updated_at")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

export async function cloudWriteSave(userId, saveData) {
  const { data, error } = await requireClient()
    .from("rogueboard_saves")
    .upsert({
      user_id: userId,
      save_version: 1,
      save_data: saveData,
      updated_at: new Date().toISOString()
    }, { onConflict: "user_id" })
    .select("updated_at")
    .single();
  if (error) throw error;
  return data;
}

export async function cloudUpdatePassword(password) {
  return requireClient().auth.updateUser({ password });
}
