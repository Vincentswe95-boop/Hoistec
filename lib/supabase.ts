import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export type AppRole = 'admin' | 'customer' | 'technician';

export async function getUserRole() {
  const { data: { session }, error } = await supabase.auth.getSession();
  if (error || !session?.user?.email) {
    return null;
  }

  const metadataRole = session.user.user_metadata?.role as AppRole | undefined;
  if (metadataRole) {
    return metadataRole;
  }

  const { data, error: roleError } = await supabase
    .from('users')
    .select('role')
    .eq('email', session.user.email)
    .maybeSingle();

  if (roleError) {
    return null;
  }

  return (data?.role as AppRole | undefined) ?? null;
}

export async function getAuthenticatedEmail() {
  const { data: { session } } = await supabase.auth.getSession();
  return session?.user?.email ?? null;
}

export async function syncUserWithAuthTable(email: string, role?: AppRole) {
  const { data: existingUser, error: fetchError } = await supabase
    .from('users')
    .select('id, email, role')
    .eq('email', email)
    .maybeSingle();

  if (fetchError) {
    return { error: fetchError };
  }

  if (existingUser) {
    const updatePayload: Record<string, unknown> = {};
    if (role) {
      updatePayload.role = role;
    }

    if (Object.keys(updatePayload).length > 0) {
      const { error: updateError } = await supabase
        .from('users')
        .update(updatePayload)
        .eq('id', existingUser.id);

      return { error: updateError };
    }

    return { error: null };
  }

  const { error: insertError } = await supabase.from('users').insert([
    {
      email,
      role: role ?? 'pending',
      name: email.split('@')[0],
      password: null,
      phone: null,
      customer_id: null,
    },
  ]);

  return { error: insertError };
}
