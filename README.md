# Megga Bolão

Plataforma completa para gestão de bolões inspirados na Mega-Sena. O monorepositório reúne backend (NestJS + Prisma) e frontend (Next.js App Router) empacotados com Docker para orquestração local e deploy via Portainer.

## Visão Geral

- **Backend**: API REST + WebSocket (base) construída com NestJS, Prisma e PostgreSQL. Inclui autenticação JWT, gerenciamento de usuários, criação de bolões, processamento de sorteios, carteira financeira e integrações com Evolution API e SuitPay (stubs prontos para expansão).
- **Frontend**: Aplicação Next.js 14 (App Router) com Tailwind, NextAuth e PWA. Interface responsiva com foco em experiência mobile.
- **Infraestrutura**: `docker-compose` orquestra PostgreSQL 16, Redis 7, backend, frontend e Nginx atuando como proxy reverso (`/api` → backend, demais rotas → frontend).

## Estrutura de Pastas

```
backend/   # NestJS + Prisma API
frontend/  # Next.js App Router
nginx/     # Configuração do proxy reverso
```

## Pré-requisitos

- Docker e Docker Compose instalados
- Node.js 20 (apenas se for executar localmente sem Docker)

## Configuração Rápida

1. Copie o arquivo de variáveis de ambiente:

   ```bash
   cp .env.example .env
   ```

   Ajuste os segredos JWT, chaves da Evolution API e SuitPay conforme necessidade.

2. Suba os serviços com Docker Compose:

   ```bash
   docker compose up --build
   ```

   Serviços expostos:

   - Frontend: http://localhost
   - Backend: http://localhost:3001/api

3. A API executa migrations e cria um usuário administrador padrão (`+55 11 99999-9999`, senha `admin123`) através do seed automático.

## Deploy via Portainer

Caso utilize o Portainer com uma stack Git, siga as instruções abaixo para evitar erros de autenticação como `Invalid username or token. Password authentication is not supported for Git operations.`:

1. **Configure um token ou chave de implantação**
   - Para repositórios privados no GitHub, gere um **Personal Access Token (PAT)** com o escopo `repo`.
   - Como alternativa, crie uma **Deploy Key SSH** somente leitura e registre-a no repositório.

2. **Cadastre o repositório na stack**
   - Em **Stacks → Add stack → Git repository**, informe a URL do repositório.
   - Clique em **Authentication** e forneça o PAT (no campo de senha) ou a chave SSH correspondente.

3. **Defina o arquivo de variáveis**
   - Marque **Use environment variables file** e aponte para `./.env.example` (ou outro `.env` customizado).
   - Ajuste os valores sensíveis direto na interface do Portainer, se necessário.

4. **Implante e monitore**
   - Após clicar em **Deploy the stack**, acompanhe os logs dos containers para verificar migrations e seeds.
   - Acesse a aplicação via host configurado (porta 80 → frontend via Nginx, `/api` → backend).

Esses passos garantem que o Portainer consiga clonar o repositório e levantar a stack sem falhas de autenticação.

### Erro `http2: frame too large` ao construir imagens

Algumas instâncias do Portainer/BuildKit falham ao transmitir logs longos durante o `npm ci`, resultando no erro:

```
Failed to deploy a stack: compose build operation failed: listing workers for Build: failed to list workers: Unavailable: connection error: desc = "error reading server preface: http2: failed reading the frame payload: http2: frame too large"
```

Para contornar o problema, os `Dockerfile`s do backend e do frontend foram ajustados para executar a instalação do npm sem barras de progresso ou logs verbosos. Certifique-se de atualizar o Portainer para a versão mais recente da stack (pull do repositório) e, se ainda assim o erro persistir, limpe builds anteriores em **Stacks → (sua stack) → Recreate** marcando a opção **Pull latest image**.

Também é recomendado:

- Garantir que o agente do Portainer esteja executando Docker `23.0+`.
- Reiniciar o serviço `docker buildx`/daemon após uma falha de build persistente.
- Validar que não existam proxies HTTPS interceptando o tráfego entre o Portainer e o Docker Engine.

## Desenvolvimento Local (sem Docker)

### Backend

```bash
cd backend
npm install
npm run prisma:migrate
npm run start:dev
```

Endpoints estarão disponíveis em `http://localhost:3001/api`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Aplicação acessível em `http://localhost:3000`.

## Principais Funcionalidades

### Backend

- **Autenticação**: login por telefone + senha, geração de tokens JWT (access/refresh) e endpoint para envio de código WhatsApp (stub Evolution API).
- **Usuários**: cadastro validado, atualização de perfil e suporte a perfis (Admin, Supervisor, Usuário).
- **Bolões**: criação, listagem e atualização de configurações de prêmios com validação de percentuais.
- **Apostas**: registro de apostas com 10 dezenas ou modo surpresinha, debitando automaticamente a carteira e gerando arquivo CSV de transparência por bolão.
- **Sorteios**: registro manual por administradores/supervisores com gatilho para recálculo de ranking.
- **Pagamentos e Carteira**: requisições de depósito/saque, fluxo de aprovação e extrato financeiro.
- **Rankings**: agregação de apostas globais e por bolão.
- **Seed**: criação de administrador e dados de demonstração (`npm run seed`).

### Frontend

- **Landing page**: resumo das funcionalidades e CTA para dashboard/login.
- **Autenticação**: formulário com duplo estágio (credenciais + código), integrado ao NextAuth (JWT).
- **Dashboard**: cartões com saldo, bolões ativos e ranking de apostadores.
- **Detalhe do bolão**: lista de premiações, apostas e transparência.
- **Apostas**: formulário interativo para seleção manual ou surpresinha, com atualização automática do ranking e saldo.
- **Perfil**: formulário completo para atualização de dados pessoais e chave Pix.
- **PWA**: manifest padrão e configuração via `next-pwa` (gera service worker em build).

## Scripts Úteis

### Backend

- `npm run start:dev` – desenvolvimento com hot-reload
- `npm run prisma:migrate` – executar migrations (modo dev)
- `npm run seed` – popular dados de demonstração

### Frontend

- `npm run dev` – servidor de desenvolvimento
- `npm run build` / `npm run start` – build e execução de produção

## Próximos Passos

- Implementar websockets para atualizações em tempo real (placares, sorteios).
- Finalizar integrações com Evolution API e SuitPay.
- Adicionar testes automatizados (unitários e end-to-end).
- Expandir regras de premiação e dashboards administrativos detalhados.

---

Este projeto foi inicializado conforme o roteiro fornecido, servindo como base sólida para evolução rápida do produto.
