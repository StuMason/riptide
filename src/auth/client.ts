import { SupabaseClient, Session, User } from '@supabase/supabase-js';

/**
 * Sign in with email and password
 */
export async function signIn(
  client: SupabaseClient,
  email: string,
  password: string
): Promise<Session> {
  const { data, error } = await client.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;
  if (!data.session) throw new Error('No session returned from login');

  return data.session;
}

/**
 * Sign up with email and password
 */
export async function signUp(
  client: SupabaseClient,
  email: string,
  password: string,
  metadata: Record<string, any> = {}
): Promise<User> {
  const { data, error } = await client.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) throw error;
  if (!data.user) throw new Error('User registration failed');

  return data.user;
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  client: SupabaseClient,
  email: string,
  redirectTo?: string
): Promise<boolean> {
  const { error } = await client.auth.resetPasswordForEmail(email, {
    redirectTo,
  });

  return !error;
}

/**
 * Reset password with token
 */
export async function resetPassword(client: SupabaseClient, newPassword: string): Promise<boolean> {
  const { error } = await client.auth.updateUser({
    password: newPassword,
  });

  return !error;
}

/**
 * Sign out the current user
 */
export async function signOut(client: SupabaseClient): Promise<void> {
  const { error } = await client.auth.signOut();
  if (error) throw error;
}

/**
 * Verify email
 * Note: Email verification is handled automatically by Supabase
 * This is a placeholder for any additional verification logic
 */
export async function verifyEmail(client: SupabaseClient, _token: string): Promise<boolean> {
  return true;
}

/**
 * Get current session
 */
export async function getSession(client: SupabaseClient): Promise<Session | null> {
  const { data, error } = await client.auth.getSession();

  if (error) throw error;
  return data.session;
}

/**
 * Get current user
 */
export async function getUser(client: SupabaseClient): Promise<User | null> {
  const { data, error } = await client.auth.getUser();

  if (error) throw error;
  return data.user;
}

/**
 * Update user email
 */
export async function updateEmail(client: SupabaseClient, email: string): Promise<User> {
  const { data, error } = await client.auth.updateUser({ email });

  if (error) throw error;
  if (!data.user) throw new Error('User update failed');

  return data.user;
}

/**
 * Update user password
 */
export async function updatePassword(client: SupabaseClient, password: string): Promise<User> {
  const { data, error } = await client.auth.updateUser({ password });

  if (error) throw error;
  if (!data.user) throw new Error('User update failed');

  return data.user;
}
