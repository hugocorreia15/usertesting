/**
 * One-time script to update existing user metadata.
 * Run this from the browser console or import and call it once.
 * Can be deleted after use.
 */
import { supabase } from "./supabase";

export async function updateCurrentUserProfile() {
  const { data, error } = await supabase.auth.updateUser({
    data: {
      first_name: "Hugo",
      last_name: "Correia",
      phone: "911584192",
    },
  });

  if (error) {
    console.error("Failed to update profile:", error.message);
    return null;
  }

  console.log("Profile updated successfully:", data.user.user_metadata);
  return data;
}
