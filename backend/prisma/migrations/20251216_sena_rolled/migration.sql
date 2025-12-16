-- Keep track of the last valor acumulado (rolado) por bolao mesmo apos repassar
ALTER TABLE "Bolao" ADD COLUMN "senaPotRolled" DECIMAL(12,2) NOT NULL DEFAULT 0;
