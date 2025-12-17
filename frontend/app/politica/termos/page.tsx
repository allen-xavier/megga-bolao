export const metadata = {
  title: 'Termos e Condições - Megga Bolão',
};

async function getPolicy() {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'https://app.allentiomolu.com.br/api';
  try {
    const res = await fetch(`${base}/policies/termos`, { cache: 'no-store' });
    if (!res.ok) throw new Error('failed');
    return res.json();
  } catch {
    return { title: 'Termos e Condições', content: '<p>Edite este conteúdo no painel administrativo.</p>' };
  }
}

export default async function TermosPage() {
  const policy = await getPolicy();

  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-semibold">{policy.title}</h1>
      <div className="prose prose-invert max-w-none prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: policy.content }} />
    </article>
  );
}
