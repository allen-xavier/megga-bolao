export type DrawerSection = {
  title: string;
  items: { label: string; href: string; description?: string }[];
};

export const sections: DrawerSection[] = [
  {
    title: 'Bolões',
    items: [
      { label: 'Criar Bolão', href: '/admin/boloes/criar', description: 'Configure cotas, prêmios e taxa Megga.' },
      { label: 'Bolões em Andamento', href: '/admin/boloes', description: 'Gerencie campanhas ativas e status.' },
      { label: 'Bolões Encerrados', href: '/admin/boloes?filtro=encerrados', description: 'Consulte histórico e relatórios.' },
    ],
  },
  {
    title: 'Conta',
    items: [
      { label: 'Dashboard', href: '/admin', description: 'Resumo de premiações, saques e indicações.' },
      { label: 'Usuários', href: '/admin/usuarios', description: 'Acompanhe cadastros e perfis verificados.' },
      { label: 'SuitPay Config', href: '/admin/suitpay', description: 'Chaves, webhooks e limites automáticos.' },
      { label: 'Config Afiliados', href: '/admin/afiliados', description: 'Defina comissões diretas e indiretas.' },
    ],
  },
  {
    title: 'Política',
    items: [
      { label: 'Termos e Condições', href: '/politica/termos' },
      { label: 'Jogo Responsável', href: '/politica/jogo-responsavel' },
      { label: 'Privacidade', href: '/politica/privacidade' },
    ],
  },
];
