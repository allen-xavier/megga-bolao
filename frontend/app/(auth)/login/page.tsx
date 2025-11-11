import Link from 'next/link';
import { AuthForm } from '@/components/auth-form';

export const metadata = {
  title: 'Entrar - Megga Bolão',
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h2 className="text-2xl font-semibold text-white">Acesse sua conta</h2>
        <p className="text-sm text-slate-300">
          Informe seu telefone e senha. Enviaremos um código via WhatsApp para confirmação.
        </p>
      </div>
      <AuthForm />
      <p className="text-center text-sm text-slate-400">
        Não tem conta?{' '}
        <Link href="/" className="text-primary-300 underline">
          Conheça o Megga Bolão
        </Link>
      </p>
    </div>
  );
}
