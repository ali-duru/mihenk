import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import { logout } from '@/app/(auth)/actions';
import { Mark } from '@/components/Mark';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect('/giris');
  const { member, email } = session;

  if (!member) {
    return (
      <div className="auth">
        <div className="auth-card stack">
          <h1>Hesabınız bir firmaya bağlı değil</h1>
          <p className="lede">Firma yöneticinizden sizi personel olarak eklemesini isteyin.</p>
          <form action={logout}>
            <button className="btn btn-ghost">Çıkış yap</button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="shell">
      <aside className="rail no-print">
        <Link href="/musteriler" className="brand">
          <Mark />
          <span>Mihenk</span>
        </Link>
        <p className="firm">{member.firms?.ad}</p>
        <nav aria-label="Ana menü">
          <Link href="/musteriler">Müşteriler</Link>
          <Link href="/musteriler/yeni">Yeni müşteri</Link>
          <Link href="/musteriler/rapor">Bakiye raporu</Link>
        </nav>
        <div className="rail-foot">
          <span>{member.ad_soyad ?? email}</span>
          <form action={logout}>
            <button className="linkbtn">Çıkış yap</button>
          </form>
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
