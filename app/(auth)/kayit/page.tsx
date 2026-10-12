import { SignupForm } from '@/components/AuthForms';

export default function SignupPage() {
  return (
    <>
      <h1>Firma hesabı oluştur</h1>
      <p className="lede">Hesabı açan kişi firmanın sahibi olur. Personeli daha sonra ekleyebilirsiniz.</p>
      <SignupForm />
    </>
  );
}
