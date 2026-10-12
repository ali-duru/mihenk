import 'server-only';
import { cache } from 'react';
import { createClient } from '@/lib/supabase/server';

/** Aynı istek içinde tek kez çalışır (React cache). Layout ve sayfalar paylaşır. */
export const getSession = cache(async () => {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const claims = data?.claims;
  if (!claims) return null;

  const { data: member } = await supabase
    .from('firm_members')
    .select('rol, ad_soyad, firms(ad)')
    .eq('user_id', claims.sub)
    .maybeSingle();

  return {
    userId: claims.sub,
    email: (claims.email as string | undefined) ?? '',
    member: member as { rol: 'sahip' | 'personel'; ad_soyad: string | null; firms: { ad: string } | null } | null,
  };
});
