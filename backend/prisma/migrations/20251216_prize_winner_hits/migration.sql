-- Guarda a quantidade de acertos para cada ganhador de premiação
ALTER TABLE "PrizeResultWinner" ADD COLUMN "hits" INTEGER NOT NULL DEFAULT 0;
