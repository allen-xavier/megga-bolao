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
    title: "Bolões",
    items: [
      {
        label: "Inicio",
        href: "/inicio",
        description: "Resumo com bolões em andamento e futuros.",
      },
      {
        label: "Bolões em andamento",
        href: "/admin/boloes?filtro=andamento",
        description: "Visualize e participe dos bolões ativos.",
        adminOnly: true,
      },
      {
        label: "Bolões encerrados",
        href: "/admin/boloes?filtro=encerrados",
        description: "Consulte histórico e relatórios.",
      },
      {
        label: "Criar bolão",
        href: "/admin/boloes/criar",
        description: "Configure cotas, prêmios e taxa Megga.",
        adminOnly: true,
      },
      {
        label: "Sorteios",
        href: "/admin/sorteios",
        description: "Registrar resultados e atualizar bolões.",
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
        description: "Resumo de premiações, saques e indicações.",
        adminOnly: true,
      },
      {
        label: "Usuários",
        href: "/admin/usuarios",
        description: "Acompanhe cadastros e perfis verificados.",
        adminOnly: true,
      },
      {
        label: "Aprovar saques",
        href: "/admin/saques",
        description: "Avalie e libere solicitações.",
        adminOnly: true,
      },
      {
        label: "SuitPay Config",
        href: "/admin/suitpay",
        description: "Chaves, webhooks e limites automáticos.",
        adminOnly: true,
      },
      {
        label: "Config Afiliados",
        href: "/admin/afiliados",
        description: "Defina comissões diretas e indiretas.",
        adminOnly: true,
      },
      {
        label: "Minha carteira",
        href: "/carteira",
        description: "Saldo e histórico de movimentos.",
      },
      {
        label: "Meus afiliados",
        href: "/afiliados",
        description: "Veja seu código/link e acompanhe ganhos.",
      },
    ],
  },
  {
    title: "Política",
    items: [
      { label: "Editar políticas", href: "/admin/politicas", adminOnly: true },
      { label: "Termos e Condições", href: "/politica/termos" },
      { label: "Jogo Responsável", href: "/politica/jogo-responsavel" },
      { label: "Privacidade", href: "/politica/privacidade" },
    ],
  },
];
