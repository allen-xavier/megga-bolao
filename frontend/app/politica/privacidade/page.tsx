export const metadata = {
  title: 'PolÇðtica de Privacidade - Megga BolÇœo',
};

async function getPolicy() {
  const base = process.env.NEXT_PUBLIC_API_BASE ?? 'https://app.allentiomolu.com.br/api';
  try {
    const res = await fetch(`${base}/policies/privacidade`, { next: { revalidate: 300 } });
    if (!res.ok) throw new Error('failed');
    return res.json();
  } catch {
    return { title: 'PolÇðtica de Privacidade', content: '<p>Edite este conteÇ§do no painel administrativo.</p>' };
  }
}

export default async function PrivacidadePage() {
  const policy = await getPolicy();

  return (
    <article className="space-y-4">
      <h1 className="text-2xl font-semibold">{policy.title}</h1>
      <div className="prose prose-invert max-w-none prose-p:leading-relaxed" dangerouslySetInnerHTML={{ __html: policy.content }} />
    </article>
  );
}
