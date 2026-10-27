-- CreateEnum
CREATE TYPE "EstadoCumplimiento" AS ENUM ('LOGRADO', 'EN_RIESGO', 'CRITICO');

-- CreateEnum
CREATE TYPE "EstadoTarea" AS ENUM ('PENDIENTE', 'EN_PROCESO', 'COMPLETADA', 'CANCELADA');

-- CreateEnum
CREATE TYPE "EstadoValidacion" AS ENUM ('PENDIENTE', 'VALIDADO', 'RECHAZADO');

-- CreateEnum
CREATE TYPE "UnidadMedida" AS ENUM ('PORCENTAJE', 'SOLES', 'PUNTOS', 'DIAS', 'SEMANAS', 'HORAS', 'NUMERO_ORDEN');

-- DropForeignKey
ALTER TABLE "Kpi" DROP CONSTRAINT "Kpi_objetivoId_fkey";

-- AlterTable
ALTER TABLE "Perspectiva" ADD COLUMN     "activo" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "codigo" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "descripcion" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "empresaId" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3);
UPDATE "Perspectiva" SET "updatedAt" = CURRENT_TIMESTAMP WHERE "updatedAt" IS NULL;
ALTER TABLE "Perspectiva" ALTER COLUMN "updatedAt" SET NOT NULL;

-- AlterTable
ALTER TABLE "Objetivo" ADD COLUMN     "responsableId" TEXT;

-- Backfill de datos requeridos en Kpi antes de crear restricciones
UPDATE "Kpi" SET "codigo" = "id" WHERE "codigo" IS NULL;
INSERT INTO "Objetivo" ("id", "empresaId", "codigo", "nombre", "descripcion", "perspectivaId", "ponderacion", "activo", "orden", "createdAt", "updatedAt")
SELECT
  'legacy-' || substr(md5(k."empresaId" || ':' || k."perspectivaId"), 1, 20),
  k."empresaId",
  'OBJ-LEGACY-' || upper(substr(md5(k."empresaId" || ':' || k."perspectivaId"), 1, 8)),
  'Objetivo legado ' || k."perspectivaId",
  'Creado automáticamente durante la migración para conservar KPIs existentes.',
  k."perspectivaId",
  0,
  true,
  0,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM (
  SELECT DISTINCT "empresaId", "perspectivaId"
  FROM "Kpi"
  WHERE "objetivoId" IS NULL
) AS k
WHERE NOT EXISTS (
  SELECT 1 FROM "Objetivo" AS o
  WHERE o."empresaId" = k."empresaId" AND o."perspectivaId" = k."perspectivaId"
);
UPDATE "Kpi" AS k
SET "objetivoId" = (
  SELECT o."id"
  FROM "Objetivo" AS o
  WHERE o."empresaId" = k."empresaId"
    AND o."perspectivaId" = k."perspectivaId"
  ORDER BY o."codigo"
  LIMIT 1
)
WHERE k."objetivoId" IS NULL;
UPDATE "Kpi" AS k
SET "objetivoId" = (
  SELECT o."id"
  FROM "Objetivo" AS o
  WHERE o."empresaId" = k."empresaId"
  ORDER BY o."codigo"
  LIMIT 1
)
WHERE k."objetivoId" IS NULL;

-- AlterTable
ALTER TABLE "Kpi" ADD COLUMN     "agregacionPeriodos" TEXT NOT NULL DEFAULT 'ULTIMO',
ADD COLUMN     "codigo" TEXT,
ADD COLUMN     "decimales" INTEGER,
ADD COLUMN     "responsableId" TEXT,
ADD COLUMN     "unidadMedida" "UnidadMedida",
ALTER COLUMN "objetivoId" SET NOT NULL,
ALTER COLUMN "meta" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "real" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "Medicion" ALTER COLUMN "meta" SET DATA TYPE DECIMAL(18,4),
ALTER COLUMN "real" SET DATA TYPE DECIMAL(18,4);

-- AlterTable
ALTER TABLE "Evidencia" ADD COLUMN     "contenido" TEXT,
ADD COLUMN     "mimeType" TEXT,
ADD COLUMN     "nombreArchivo" TEXT,
ADD COLUMN     "resultadoTareaId" TEXT,
ADD COLUMN     "storageKey" TEXT,
ADD COLUMN     "tamano" INTEGER,
ADD COLUMN     "tareaId" TEXT;

-- AlterTable
ALTER TABLE "Config" ADD COLUMN     "agregacionObjetivo" TEXT NOT NULL DEFAULT 'PROMEDIO',
ADD COLUMN     "agregacionPeriodos" TEXT NOT NULL DEFAULT 'ULTIMO',
ADD COLUMN     "agregacionResultados" TEXT NOT NULL DEFAULT 'NINGUNA',
ADD COLUMN     "decimalesReporte" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "empresaId" TEXT,
ADD COLUMN     "formatoPorcentaje" TEXT NOT NULL DEFAULT 'DECIMAL',
ADD COLUMN     "limitarPorcentaje" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "Recomendacion" (
    "id" TEXT NOT NULL,
    "contenido" TEXT NOT NULL,
    "autorId" TEXT NOT NULL,
    "objetivoId" TEXT,
    "kpiId" TEXT,
    "fijada" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Recomendacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tarea" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL DEFAULT '',
    "objetivoId" TEXT NOT NULL,
    "kpiId" TEXT,
    "responsableId" TEXT,
    "creadorId" TEXT NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fechaFin" TIMESTAMP(3),
    "estado" "EstadoTarea" NOT NULL DEFAULT 'PENDIENTE',
    "avance" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tarea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ResultadoTarea" (
    "id" TEXT NOT NULL,
    "tareaId" TEXT NOT NULL,
    "descripcion" TEXT NOT NULL,
    "valor" DECIMAL(18,4),
    "autorId" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "estadoValidacion" "EstadoValidacion" NOT NULL DEFAULT 'PENDIENTE',
    "validadoPorId" TEXT,
    "validadoEn" TIMESTAMP(3),
    "aplicadoKpi" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ResultadoTarea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Recomendacion_objetivoId_idx" ON "Recomendacion"("objetivoId");

-- CreateIndex
CREATE INDEX "Recomendacion_kpiId_idx" ON "Recomendacion"("kpiId");

-- CreateIndex
CREATE UNIQUE INDEX "Recomendacion_objetivo_fijada_key" ON "Recomendacion"("objetivoId") WHERE "fijada" = true AND "objetivoId" IS NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Recomendacion_kpi_fijada_key" ON "Recomendacion"("kpiId") WHERE "fijada" = true AND "kpiId" IS NOT NULL;

-- CreateIndex
CREATE INDEX "Tarea_objetivoId_idx" ON "Tarea"("objetivoId");

-- CreateIndex
CREATE INDEX "Tarea_kpiId_idx" ON "Tarea"("kpiId");

-- CreateIndex
CREATE INDEX "Tarea_responsableId_idx" ON "Tarea"("responsableId");

-- CreateIndex
CREATE INDEX "Tarea_estado_idx" ON "Tarea"("estado");

-- CreateIndex
CREATE INDEX "ResultadoTarea_tareaId_idx" ON "ResultadoTarea"("tareaId");

-- CreateIndex
CREATE INDEX "Perspectiva_empresaId_idx" ON "Perspectiva"("empresaId");

-- CreateIndex
CREATE UNIQUE INDEX "Perspectiva_empresaId_codigo_key" ON "Perspectiva"("empresaId", "codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Kpi_codigo_key" ON "Kpi"("codigo");

-- CreateIndex
CREATE INDEX "Evidencia_tareaId_idx" ON "Evidencia"("tareaId");

-- CreateIndex
CREATE INDEX "Evidencia_resultadoTareaId_idx" ON "Evidencia"("resultadoTareaId");

-- CreateIndex
CREATE UNIQUE INDEX "Config_empresaId_key" ON "Config"("empresaId");

-- AddForeignKey
ALTER TABLE "Perspectiva" ADD CONSTRAINT "Perspectiva_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Objetivo" ADD CONSTRAINT "Objetivo_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "Objetivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Kpi" ADD CONSTRAINT "Kpi_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evidencia" ADD CONSTRAINT "Evidencia_resultadoTareaId_fkey" FOREIGN KEY ("resultadoTareaId") REFERENCES "ResultadoTarea"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recomendacion" ADD CONSTRAINT "Recomendacion_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recomendacion" ADD CONSTRAINT "Recomendacion_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "Objetivo"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Recomendacion" ADD CONSTRAINT "Recomendacion_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_objetivoId_fkey" FOREIGN KEY ("objetivoId") REFERENCES "Objetivo"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_kpiId_fkey" FOREIGN KEY ("kpiId") REFERENCES "Kpi"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_responsableId_fkey" FOREIGN KEY ("responsableId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tarea" ADD CONSTRAINT "Tarea_creadorId_fkey" FOREIGN KEY ("creadorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoTarea" ADD CONSTRAINT "ResultadoTarea_tareaId_fkey" FOREIGN KEY ("tareaId") REFERENCES "Tarea"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoTarea" ADD CONSTRAINT "ResultadoTarea_autorId_fkey" FOREIGN KEY ("autorId") REFERENCES "Usuario"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ResultadoTarea" ADD CONSTRAINT "ResultadoTarea_validadoPorId_fkey" FOREIGN KEY ("validadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Config" ADD CONSTRAINT "Config_empresaId_fkey" FOREIGN KEY ("empresaId") REFERENCES "Empresa"("id") ON DELETE SET NULL ON UPDATE CASCADE;

