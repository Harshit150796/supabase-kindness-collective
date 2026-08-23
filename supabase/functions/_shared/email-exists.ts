// Case-insensitive, authoritative check for whether an account already exists.
// Checks public.profiles first, then falls back to the auth user list so
// accounts created without a profile row are still detected.
export async function emailExists(supabaseAdmin: any, email: string): Promise<boolean> {
  const normalized = email.trim().toLowerCase();

  const { data: profileData, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .ilike("email", normalized)
    .maybeSingle();

  if (profileError) {
    console.error("Error checking email in profiles:", profileError);
  } else if (profileData) {
    return true;
  }

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) {
      console.error("Error listing auth users:", error);
      break;
    }
    const users = data?.users ?? [];
    if (users.some((u: any) => (u.email ?? "").toLowerCase() === normalized)) {
      return true;
    }
    if (users.length < 200) break;
  }

  return false;
}
