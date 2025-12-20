import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth-options';
import { ProfileForm, type UserProfile } from '@/components/profile-form';
import { ProfileLogoutButton } from '@/components/profile-logout-button';

export const metadata = {
  title: 'Meu Perfil - Megga Bolão',
};

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect('/login');
  }
  const user = session.user as UserProfile;

  return (
    <div className="space-y-6">
      <section className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <div>
          <h1 className="text-2xl font-semibold">Dados cadastrais</h1>
          <p className="text-sm text-white/60">
            Atualize suas informações pessoais, endereço, telefone e chave Pix para depósitos e saques.
          </p>
        </div>
      </section>
      <section className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <ProfileForm user={user} />
      </section>
      <section className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <ProfileLogoutButton />
      </section>
    </div>
  );
}
