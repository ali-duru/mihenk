import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

const PUBLIC_PATHS = ['/giris', '/kayit', '/auth'];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  // getClaims() JWT imzasını yerelde (önbelleğe alınan JWKS ile) doğrular, her istekte
  // Auth sunucusuna gitmez. Süresi dolan token'ı da yeniler ve çerezleri günceller.
  const { data } = await supabase.auth.getClaims();
  const user = data?.claims ?? null;

  const path = request.nextUrl.pathname;
  const isPublic = PUBLIC_PATHS.some((p) => path === p || path.startsWith(p + '/'));

  if (!user && !isPublic) {
    const url = request.nextUrl.clone();
    url.pathname = '/giris';
    url.search = path !== '/' ? `?next=${encodeURIComponent(path)}` : '';
    return NextResponse.redirect(url);
  }

  if (user && (path === '/giris' || path === '/kayit')) {
    const url = request.nextUrl.clone();
    url.pathname = '/musteriler';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return response;
}
