import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export const metadata = {
  title: 'Entrar - Megga Bolão',
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold">Acesse sua conta</h2>
        <p className="text-sm text-white/70">
          Informe seu telefone e senha. Enviaremos um código via WhatsApp para confirmação.
        </p>
      </div>
      <AuthForm />
      <p className="text-center text-sm text-white/60">
        Não tem conta?{' '}
        <Link href="/" className="font-medium text-megga-yellow underline">
          Conheça o Megga Bolão
        </Link>
      </p>
    </div>
  );
}
