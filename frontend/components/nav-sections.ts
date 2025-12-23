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
    title: "Bol\u00f5es",
    items: [
      {
        label: "In\u00edcio",
        href: "/inicio",
        description: "Resumo com bol\u00f5es em andamento e futuros.",
      },
      {
        label: "Bol\u00f5es em andamento",
        href: "/admin/boloes?filtro=andamento",
        description: "Visualize e participe dos bol\u00f5es ativos.",
        adminOnly: true,
      },
      {
        label: "Bol\u00f5es encerrados",
        href: "/admin/boloes?filtro=encerrados",
        description: "Consulte hist\u00f3rico e relat\u00f3rios.",
      },
      {
        label: "Criar bol\u00e3o",
        href: "/admin/boloes/criar",
        description: "Configure cotas, pr\u00eamios e taxa Megga.",
        adminOnly: true,
      },
      {
        label: "Sorteios",
        href: "/admin/sorteios",
        description: "Registrar resultados e atualizar bol\u00f5es.",
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
        description: "Resumo de premia\u00e7\u00f5es, saques e indica\u00e7\u00f5es.",
        adminOnly: true,
      },
      {
        label: "Usu\u00e1rios",
        href: "/admin/usuarios",
        description: "Acompanhe cadastros e perfis verificados.",
        adminOnly: true,
      },
      {
        label: "Tickets",
        href: "/admin/tickets",
        description: "Filtre tickets por usu\u00e1rio, bol\u00e3o e data.",
        adminOnly: true,
      },
      {
        label: "Aprovar saques",
        href: "/admin/saques",
        description: "Avalie e libere solicita\u00e7\u00f5es.",
        adminOnly: true,
      },
      {
        label: "SuitPay Config",
        href: "/admin/suitpay",
        description: "Chaves, webhooks e limites autom\u00e1ticos.",
        adminOnly: true,
      },
      {
        label: "Config Afiliados",
        href: "/admin/afiliados",
        description: "Defina comiss\u00f5es diretas e indiretas.",
        adminOnly: true,
      },
      {
        label: "Minha carteira",
        href: "/carteira",
        description: "Saldo e hist\u00f3rico de movimentos.",
      },
      {
        label: "Meus tickets",
        href: "/tickets",
        description: "Acompanhe seus tickets e transpar\u00eancias.",
      },
      {
        label: "Meus afiliados",
        href: "/afiliados",
        description: "Veja seu c\u00f3digo/link e acompanhe ganhos.",
      },
    ],
  },
  {
    title: "Pol\u00edtica",
    items: [
      { label: "Editar pol\u00edticas", href: "/admin/politicas", adminOnly: true },
      { label: "Termos e Condi\u00e7\u00f5es", href: "/politica/termos" },
      { label: "Jogo Respons\u00e1vel", href: "/politica/jogo-responsavel" },
      { label: "Privacidade", href: "/politica/privacidade" },
    ],
  },
];
