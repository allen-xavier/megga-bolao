'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { api } from '@/lib/api';
import 'react-quill/dist/quill.snow.css';

const ReactQuill: any = dynamic(() => import('react-quill'), { ssr: false });

const POLICY_OPTIONS = [
  { key: 'termos', label: 'Termos e Condições' },
  { key: 'privacidade', label: 'Política de Privacidade' },
  { key: 'jogo-responsavel', label: 'Jogo Responsável' },
];

const fetcher = ([url, token]: [string, string]) =>
  api.get(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);

export default function AdminPoliciesPage() {
  const { data: session, status } = useSession();
  const token = session?.user?.accessToken;
  const role = session?.user?.role;
  const isAdmin = role === 'ADMIN' || role === 'SUPERVISOR';

  const [currentKey, setCurrentKey] = useState('termos');
  const { data, mutate, isLoading } = useSWR(token && isAdmin ? [`/admin/policies/${currentKey}`, token] : null, fetcher, {
    revalidateOnFocus: false,
  });

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setTitle(data.title ?? '');
      setContent(data.content ?? '');
    }
  }, [data, currentKey]);

  const toolbarOptions = useMemo(
    () => ({
      toolbar: [
        [{ font: [] }],
        [{ header: [1, 2, 3, 4, 5, 6, false] }],
        [{ size: ['small', false, 'large', 'huge'] }],
        ['bold', 'italic', 'underline', 'strike', 'blockquote', 'code-block'],
        [{ list: 'ordered' }, { list: 'bullet' }],
        [{ align: [] }],
        [{ color: [] }, { background: [] }],
        [{ indent: '-1' }, { indent: '+1' }],
        ['link', 'image', 'video'],
        ['clean'],
      ],
    }),
    [],
  );

  const save = async () => {
    if (!token) return;
    try {
      setSaving(true);
      setMessage(null);
      await api.put(
        `/admin/policies/${currentKey}`,
        { title: title || 'Documento', content },
        { headers: { Authorization: `Bearer ${token}` } },
      );
      await mutate();
      setMessage('Conteúdo salvo com sucesso.');
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? 'Erro ao salvar conteúdo.');
    } finally {
      setSaving(false);
    }
  };

  if (status !== 'authenticated') {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-white/80">Faça login como administrador para acessar esta página.</p>
        <Link
          href="/login"
          className="mt-3 inline-flex items-center gap-2 rounded-full bg-megga-yellow px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-megga-navy transition hover:opacity-95"
        >
          Ir para login
        </Link>
      </div>
    );
  }
  if (!isAdmin) {
    return (
      <div className="rounded-3xl bg-megga-navy/80 p-6 text-white shadow-lg ring-1 ring-white/5">
        <p className="text-sm text-megga-rose">Você não tem permissão para acessar esta página.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Políticas</p>
        <h1 className="text-2xl font-semibold">Editar conteúdos legais</h1>
        <p className="text-sm text-white/70">
          Atualize os textos exibidos nas páginas de Termos, Política de Privacidade e Jogo Responsável.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        {POLICY_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setCurrentKey(option.key)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              option.key === currentKey ? 'bg-megga-yellow text-megga-navy' : 'bg-white/5 text-white/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {message && <p className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-megga-lime">{message}</p>}

      <div className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 ring-1 ring-white/5">
        <label className="space-y-2 text-sm text-white/80">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">Título</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            placeholder="Ex: Termos e Condições"
          />
        </label>

        <div className="space-y-2 text-sm text-white/80">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">Conteúdo</span>
          <div className="rounded-2xl border border-white/10 bg-white text-black">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={toolbarOptions}
              formats={[
                'header',
                'font',
                'size',
                'bold',
                'italic',
                'underline',
                'strike',
                'blockquote',
                'code-block',
                'list',
                'bullet',
                'indent',
                'link',
                'image',
                'video',
                'align',
                'color',
                'background',
              ]}
              className="min-h-[240px]"
            />
          </div>
          <p className="text-xs text-white/60">
            Use o editor para inserir negrito, listas, alinhamento, cores, links, imagens ou vídeos. Para colocar texto e mídia lado a
            lado, use as ações de colunas.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => mutate()}
            className="flex-1 rounded-2xl bg-[#f7b500] py-3 text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
            disabled={isLoading}
          >
            Recarregar conteúdo
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-2xl bg-[#1ea7a4] py-3 text-sm font-semibold text-[#0f1117] transition hover:brightness-110"
            disabled={saving || isLoading}
          >
            {saving ? 'Salvando...' : 'Salvar conteúdo'}
          </button>
        </div>
      </div>
    </div>
  );
}
