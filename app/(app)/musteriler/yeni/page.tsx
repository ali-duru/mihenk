import Link from 'next/link';
import { CustomerForm } from '@/components/CustomerForm';

export default function NewCustomerPage() {
  return (
    <>
      <div className="pagehead">
        <h1>Yeni müşteri</h1>
        <Link href="/musteriler" className="btn btn-ghost">Listeye dön</Link>
      </div>
      <div className="narrow">
        <CustomerForm />
      </div>
    </>
  );
}
