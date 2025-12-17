export type DrawerSection = {
  title: string;
  items: { label: string; href: string; description?: string; adminOnly?: boolean }[];
};

export const sections: DrawerSection[] = [
  {
    title: 'BolÇæes',
    items: [
      { label: 'InÇðcio', href: '/dashboard', description: 'Resumo inicial com bolÇæes em andamento.' },
      { label: 'BolÇæes em Andamento', href: '/admin/boloes?filtro=andamento', description: 'Visualize e participe dos bolÇæes ativos.' },
      { label: 'BolÇæes Encerrados', href: '/admin/boloes?filtro=encerrados', description: 'Consulte histÇürico e relatÇürios.' },
      { label: 'Criar BolÇœo', href: '/admin/boloes/criar', description: 'Configure cotas, prÇ¦mios e taxa Megga.', adminOnly: true },
      { label: 'Sorteios', href: '/admin/sorteios', description: 'Registrar resultados e atualizar bolÇæes.', adminOnly: true },
    ],
  },
  {
    title: 'Conta',
    items: [
      { label: 'Dashboard', href: '/admin', description: 'Resumo de premiaÇõÇæes, saques e indicaÇõÇæes.', adminOnly: true },
      { label: 'UsuÇ­rios', href: '/admin/usuarios', description: 'Acompanhe cadastros e perfis verificados.', adminOnly: true },
      { label: 'Aprovar saques', href: '/admin/suitpay', description: 'Avalie e libere solicitaÇõÇæes.', adminOnly: true },
      { label: 'SuitPay Config', href: '/admin/suitpay', description: 'Chaves, webhooks e limites automÇ­ticos.', adminOnly: true },
      { label: 'Config Afiliados', href: '/admin/afiliados', description: 'Defina comissÇæes diretas e indiretas.', adminOnly: true },
      { label: 'Meus afiliados', href: '/afiliados', description: 'Veja seu cÇüdigo/link e acompanhe ganhos.' },
    ],
  },
  {
    title: 'PolÇðtica',
    items: [
      { label: 'Termos e CondiÇõÇæes', href: '/politica/termos' },
      { label: 'Jogo ResponsÇ­vel', href: '/politica/jogo-responsavel' },
      { label: 'Privacidade', href: '/politica/privacidade' },
      { label: 'Editar polÇiticas', href: '/admin/politicas', adminOnly: true },
    ],
  },
];
