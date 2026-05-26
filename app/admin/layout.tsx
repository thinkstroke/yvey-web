import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '../../lib/supabase-server';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/');

  const { data: roleRow } = await supabase
    .from('user_roles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!roleRow || roleRow.role !== 'admin') redirect('/');

  return <>{children}</>;
}
