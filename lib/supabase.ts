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
  if (error || !session?.user) {
    return null;
  }

  const normalizedEmail = session.user.email?.trim().toLowerCase();
  if (normalizedEmail === 'vincent.bergstrom@renta.se') {
    return 'admin';
  }

  const metadataRole = session.user.user_metadata?.role ?? session.user.app_metadata?.role;
  if (metadataRole) {
    return metadataRole as AppRole;
  }

  if (!normalizedEmail) {
    return null;
  }

  const { data, error: roleError } = await supabase
    .from('users')
    .select('role')
    .ilike('email', normalizedEmail)
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
  const normalizedEmail = email.trim().toLowerCase();
  const resolvedRole: AppRole | undefined = normalizedEmail === 'vincent.bergstrom@renta.se'
    ? 'admin'
    : role;

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
    if (resolvedRole) {
      updatePayload.role = resolvedRole;
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
      role: resolvedRole ?? 'pending',
      name: email.split('@')[0],
      password: null,
      phone: null,
      customer_id: null,
    },
  ]);

  return { error: insertError };
}
