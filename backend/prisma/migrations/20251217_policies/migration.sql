-- Create policies table to store editable public pages (termos, privacidade, jogo-responsavel)
CREATE TABLE IF NOT EXISTS "Policy" (
  "key" TEXT PRIMARY KEY,
  "title" TEXT NOT NULL,
  "content" TEXT NOT NULL DEFAULT '',
  "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT now()
);

-- Seed defaults if they do not exist
INSERT INTO "Policy" ("key", "title", "content")
VALUES
('termos', 'Termos e Condicoes', '<p>Edite os termos e condicoes no painel administrativo.</p>'),
('privacidade', 'Politica de Privacidade', '<p>Edite a politica de privacidade no painel administrativo.</p>'),
('jogo-responsavel', 'Jogo Responsavel', '<p>Edite as orientacoes de jogo responsavel no painel administrativo.</p>')
ON CONFLICT ("key") DO NOTHING;
