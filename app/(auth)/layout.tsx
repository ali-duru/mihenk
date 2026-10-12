import { Mark } from '@/components/Mark';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div className="auth-card">
        <div className="auth-brand">
          <Mark size={34} />
          <span>Mihenk</span>
        </div>
        {children}
      </div>
    </div>
  );
}
