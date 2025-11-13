# Megga Bolão

Plataforma completa para gestão de bolões inspirados na Mega-Sena. O monorepositório reúne backend (NestJS + Prisma) e frontend (Next.js App Router) empacotados com Docker para orquestração local e deploy via Portainer.

## Visão Geral

- **Backend**: API REST + WebSocket (base) construída com NestJS, Prisma e PostgreSQL. Inclui autenticação JWT, gerenciamento de usuários, criação de bolões, processamento de sorteios, carteira financeira e integrações com Evolution API e SuitPay (stubs prontos para expansão).
- **Frontend**: Aplicação Next.js 14 (App Router) com Tailwind, NextAuth e PWA. Interface responsiva com foco em experiência mobile.
- **Infraestrutura**: `docker-compose.dev.yml` atende ao desenvolvimento local completo, enquanto o `docker-compose.yml` já vem pronto para deploy em Docker Swarm (Portainer + Traefik) publicando o domínio `api.allentiomolu.com.br`.

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

1. Copie o arquivo de variáveis de ambiente para desenvolvimento:

   ```bash
   cp .env.example .env
   ```

   Ajuste os segredos JWT, chaves da Evolution API e SuitPay conforme necessidade.

2. Suba os serviços com o arquivo de desenvolvimento:

   ```bash
   docker compose -f docker-compose.dev.yml up --build
   ```

   Serviços expostos:

   - Frontend (via Nginx): http://localhost:8080
   - Backend direto: http://localhost:3001/api
   - Backend pelo proxy: http://localhost:8080/api

   > Se a porta 8080 estiver ocupada no host, ajuste o mapeamento do serviço `nginx` em `docker-compose.dev.yml` (linha `8080:80`).

  O container do backend aceita as flags `SKIP_DB_WAIT` e `SKIP_MIGRATIONS`:

  - `SKIP_DB_WAIT=1` desabilita a checagem ativa de disponibilidade do Postgres antes de iniciar as migrations (útil quando um orquestrador já garante a ordem de inicialização).
  - `SKIP_MIGRATIONS=1` impede a execução automática do `prisma migrate deploy` no boot.

3. A API executa migrations e cria um usuário administrador padrão (`+55 11 99999-9999`, senha `admin123`) através do seed automático.

Para o deploy em produção com Swarm veja [Deploy em Docker Swarm via Portainer](#deploy-em-docker-swarm-via-portainer).

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

## Deploy em Docker Swarm via Portainer

O repositório inclui um `docker-compose.yml` compatível com `docker stack deploy`, ajustado para servidores com Traefik e Portainer. O fluxo abaixo assume o domínio `api.allentiomolu.com.br` e um cluster Swarm já inicializado.

### 1. Preparar variáveis de ambiente

1. Copie o arquivo de exemplo e personalize segredos/domínio:

   ```bash
   cp .env.swarm.example .env.swarm
   ```

   - `APP_DOMAIN` define o host publicado pelo Traefik (padrão `api.allentiomolu.com.br`).
   - Ajuste `JWT_SECRET`, `JWT_REFRESH_SECRET`, `NEXTAUTH_SECRET` e tokens externos.

2. Certifique-se de que o cluster possui a rede overlay usada pelo Traefik (nome `traefik-public`). Caso contrário crie-a:

   ```bash
   docker network create --driver=overlay traefik-public
   ```

### 2. Construir e publicar imagens

Docker Swarm não suporta `build` direto no stack, então publique as imagens previamente (pode ser no GitHub Container Registry ou outro registry). Exemplo com Buildx:

```bash
docker buildx build --platform linux/amd64 -t ghcr.io/<usuario>/megga-bolao-backend:latest -f backend/Dockerfile backend --push
docker buildx build --platform linux/amd64 -t ghcr.io/<usuario>/megga-bolao-frontend:latest -f frontend/Dockerfile frontend --push
```

Atualize as variáveis `BACKEND_IMAGE` e `FRONTEND_IMAGE` no Portainer (ou em `.env.swarm`) apontando para os repositórios enviados.

### 3. Criar a stack no Portainer

1. Em **Stacks → Add stack → Git repository**, informe a URL do repositório e mantenha `docker-compose.yml` como Compose path.
2. Em **Environment variables/Env file**, selecione `./.env.swarm` ou insira manualmente as variáveis descritas acima.
3. Defina `BACKEND_IMAGE` e `FRONTEND_IMAGE` com as tags publicadas.
4. Confirme que o Traefik já está operando e possui um `certresolver` compatível (padrão `letsencrypt`, configurável via `TRAEFIK_CERT_RESOLVER`).
5. Clique em **Deploy the stack**. O Portainer irá criar os serviços `db`, `redis`, `backend`, `frontend` e `nginx` na rede overlay `internal`, expondo o Nginx pelo Traefik no domínio informado.

### 4. Pós-deploy e testes

- A API executa `prisma migrate deploy` e o seed do administrador automaticamente via entrypoint da imagem.
- O frontend usa `NEXT_PUBLIC_API_BASE` e `NEXTAUTH_URL` apontando para o domínio público (`https://api.allentiomolu.com.br`).
- Arquivos de transparência são persistidos no volume `backend_storage`.

Caso altere configurações (por exemplo, novo domínio ou certificado), ajuste as variáveis correspondentes e mande redeploy pela interface do Portainer.

## Próximos Passos

- Implementar websockets para atualizações em tempo real (placares, sorteios).
- Finalizar integrações com Evolution API e SuitPay.
- Adicionar testes automatizados (unitários e end-to-end).
- Expandir regras de premiação e dashboards administrativos detalhados.

---

Este projeto foi inicializado conforme o roteiro fornecido, servindo como base sólida para evolução rápida do produto.
