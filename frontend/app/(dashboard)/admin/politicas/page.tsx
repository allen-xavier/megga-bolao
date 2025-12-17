'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { useSession } from 'next-auth/react';
import { api } from '@/lib/api';
import 'react-quill/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });

const POLICY_OPTIONS = [
  { key: 'termos', label: 'Termos e Condições' },
  { key: 'privacidade', label: 'Política de Privacidade' },
  { key: 'jogo-responsavel', label: 'Jogo Responsável' },
];

const fetcher = ([url, token]: [string, string]) =>
  api.get(url, { headers: { Authorization: `Bearer ${token}` } }).then((res) => res.data);

export default function AdminPoliciesPage() {
  const { data: session } = useSession();
  const token = session?.user?.accessToken;
  const quillRef = useRef<any>(null);

  const [currentKey, setCurrentKey] = useState('termos');
  const { data, mutate, isLoading } = useSWR(token ? [`/admin/policies/${currentKey}`, token] : null, fetcher, {
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

  const insertTable = (cols: number) => {
    const editor = quillRef.current?.getEditor?.();
    if (!editor) return;
    const index = editor.getSelection()?.index ?? editor.getLength();
    const cells = Array.from({ length: cols })
      .map((_, i) => `<td style="padding:8px; border:1px solid #ccc;">Coluna ${i + 1}</td>`)
      .join('');
    const table = `<table style="width:100%; border-collapse:collapse; margin:12px 0;"><tbody><tr>${cells}</tr></tbody></table>`;
    editor.clipboard.dangerouslyPasteHTML(index, table, 'silent');
  };

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
      setMessage('Conteudo salvo com sucesso.');
    } catch (err: any) {
      setMessage(err?.response?.data?.message ?? 'Erro ao salvar conteudo.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <p className="text-xs uppercase tracking-[0.3em] text-white/50">Politicas</p>
        <h1 className="text-2xl font-semibold">Editar conteudos legais</h1>
        <p className="text-sm text-white/70">
          Atualize os textos exibidos nas paginas de Termos, Politica de Privacidade e Jogo Responsavel.
        </p>
      </header>

      <div className="flex flex-wrap gap-3">
        {POLICY_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => setCurrentKey(option.key)}
            className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
              option.key === currentKey ? 'bg-gradient-to-r from-megga-magenta to-megga-teal text-white' : 'bg-white/5 text-white/80'
            }`}
          >
            {option.label}
          </button>
        ))}
      </div>

      {message && <p className="rounded-2xl bg-white/10 px-4 py-2 text-sm text-megga-lime">{message}</p>}

      <div className="space-y-4 rounded-3xl bg-megga-navy/80 p-5 ring-1 ring-white/5">
        <label className="space-y-2 text-sm text-white/80">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">Titulo</span>
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white focus:border-megga-magenta focus:outline-none"
            placeholder="Ex: Termos e Condicoes"
          />
        </label>

        <div className="space-y-2 text-sm text-white/80">
          <span className="text-xs uppercase tracking-[0.3em] text-white/40">Conteudo</span>
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
              ref={quillRef}
              className="min-h-[240px]"
            />
          </div>
          <div className="flex flex-wrap gap-2 text-xs text-white/70">
            <button
              type="button"
              onClick={() => insertTable(2)}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white transition hover:border-megga-magenta hover:text-megga-yellow"
            >
              Inserir tabela 2 colunas
            </button>
            <button
              type="button"
              onClick={() => insertTable(3)}
              className="rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-white transition hover:border-megga-magenta hover:text-megga-yellow"
            >
              Inserir tabela 3 colunas
            </button>
          </div>
          <p className="text-xs text-white/60">
            Use o editor para inserir negrito, listas, alinhamento, cores, links, imagens ou vídeos. Para colocar texto e mídia lado a
            lado, use as ações de tabela para criar colunas.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => mutate()}
            className="flex-1 rounded-2xl border border-white/10 bg-white/5 py-3 text-sm font-semibold text-white transition hover:border-megga-magenta hover:text-megga-yellow"
            disabled={isLoading}
          >
            Recarregar conteudo
          </button>
          <button
            type="button"
            onClick={save}
            className="flex-1 rounded-2xl bg-gradient-to-r from-megga-magenta to-megga-teal py-3 text-sm font-semibold text-white transition hover:opacity-95"
            disabled={saving || isLoading}
          >
            {saving ? 'Salvando...' : 'Salvar conteudo'}
          </button>
        </div>
      </div>
    </div>
  );
}
