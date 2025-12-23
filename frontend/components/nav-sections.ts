export type DrawerSection = {
  title: string;
  items: {
    label: string;
    href: string;
    description?: string;
    adminOnly?: boolean;
  }[];
};

export const sections: DrawerSection[] = [
  {
    title: "BolÃµes",
    items: [
      {
        label: "Inicio",
        href: "/inicio",
        description: "Resumo com bolÃµes em andamento e futuros.",
      },
      {
        label: "BolÃµes em andamento",
        href: "/admin/boloes?filtro=andamento",
        description: "Visualize e participe dos bolÃµes ativos.",
        adminOnly: true,
      },
      {
        label: "BolÃµes encerrados",
        href: "/admin/boloes?filtro=encerrados",
        description: "Consulte histÃ³rico e relatÃ³rios.",
      },
      {
        label: "Criar bolÃ£o",
        href: "/admin/boloes/criar",
        description: "Configure cotas, prÃªmios e taxa Megga.",
        adminOnly: true,
      },
      {
        label: "Sorteios",
        href: "/admin/sorteios",
        description: "Registrar resultados e atualizar bolÃµes.",
        adminOnly: true,
      },
    ],
  },
  {
    title: "Conta",
    items: [
      {
        label: "Dashboard admin",
        href: "/admin",
        description: "Resumo de premiaÃ§Ãµes, saques e indicaÃ§Ãµes.",
        adminOnly: true,
      },
      {
        label: "UsuÃ¡rios",
        href: "/admin/usuarios",
        description: "Acompanhe cadastros e perfis verificados.",
        adminOnly: true,
      },
      {
        label: "Tickets",
        href: "/admin/tickets",
        description: "Filtre tickets por usuario, bolao e data.",
        adminOnly: true,
      },
      {
        label: "Aprovar saques",
        href: "/admin/saques",
        description: "Avalie e libere solicitaÃ§Ãµes.",
        adminOnly: true,
      },
      {
        label: "SuitPay Config",
        href: "/admin/suitpay",
        description: "Chaves, webhooks e limites automÃ¡ticos.",
        adminOnly: true,
      },
      {
        label: "Config Afiliados",
        href: "/admin/afiliados",
        description: "Defina comissÃµes diretas e indiretas.",
        adminOnly: true,
      },
      {
        label: "Minha carteira",
        href: "/carteira",
        description: "Saldo e histÃ³rico de movimentos.",
      },
      {
        label: "Meus afiliados",
        href: "/afiliados",
        description: "Veja seu cÃ³digo/link e acompanhe ganhos.",
      },
    ],
  },
  {
    title: "PolÃ­tica",
    items: [
      { label: "Editar polÃ­ticas", href: "/admin/politicas", adminOnly: true },
      { label: "Termos e CondiÃ§Ãµes", href: "/politica/termos" },
      { label: "Jogo ResponsÃ¡vel", href: "/politica/jogo-responsavel" },
      { label: "Privacidade", href: "/politica/privacidade" },
    ],
  },
];
