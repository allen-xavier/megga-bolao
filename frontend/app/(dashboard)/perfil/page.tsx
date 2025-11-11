import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { ProfileForm } from '@/components/profile-form';

export const metadata = {
  title: 'Meu Perfil - Megga Bolão',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) {
    redirect('/login');
  }

  return (
    <div className="space-y-6 rounded-2xl bg-slate-900/60 p-6 ring-1 ring-white/10">
      <div>
        <h1 className="text-2xl font-semibold text-white">Dados cadastrais</h1>
        <p className="text-sm text-slate-300">Atualize suas informações pessoais, endereço e chave Pix.</p>
      </div>
      <ProfileForm user={session.user} />
    </div>
  );
}
