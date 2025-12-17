export const metadata = {
  title: 'Política de Privacidade - Megga Bolão',
};

import 'react-quill/dist/quill.snow.css';

async function getPolicy() {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'https://app.allentiomolu.com.br/api';
  try {
    const res = await fetch(`${base}/policies/privacidade`, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed');
    return res.json();
  } catch {
    return { title: 'Política de Privacidade', content: '<p>Edite este conteúdo no painel administrativo.</p>' };
  }
}

export default async function PrivacidadePage() {
  const policy = await getPolicy();

  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-semibold">{policy.title}</h1>
      <div className="ql-snow rounded-2xl bg-white/5 p-4">
        <div className="ql-editor prose prose-invert max-w-none prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: policy.content }} />
      </div>
    </article>
  );
}
