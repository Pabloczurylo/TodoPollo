-- CreateEnum
CREATE TYPE "TipoHamburguesa" AS ENUM ('JAMON_QUESO', 'ESPINACA_QUESO', 'ZANAHORIA_QUESO');

-- CreateTable
CREATE TABLE "cajon_rendimiento_por_tipo" (
    "id" TEXT NOT NULL,
    "cajon_id" TEXT NOT NULL,
    "tipo" "TipoHamburguesa" NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "cajon_rendimiento_por_tipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock_por_tipo" (
    "id" TEXT NOT NULL,
    "tipo" "TipoHamburguesa" NOT NULL,
    "cantidad_actual" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_por_tipo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "items_pedido" (
    "id" TEXT NOT NULL,
    "pedido_id" TEXT NOT NULL,
    "tipo" "TipoHamburguesa" NOT NULL,
    "cantidad" INTEGER NOT NULL,

    CONSTRAINT "items_pedido_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "cajon_rendimiento_por_tipo_cajon_id_tipo_key" ON "cajon_rendimiento_por_tipo"("cajon_id", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "stock_por_tipo_tipo_key" ON "stock_por_tipo"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "items_pedido_pedido_id_tipo_key" ON "items_pedido"("pedido_id", "tipo");

-- AddForeignKey
ALTER TABLE "cajon_rendimiento_por_tipo" ADD CONSTRAINT "cajon_rendimiento_por_tipo_cajon_id_fkey" FOREIGN KEY ("cajon_id") REFERENCES "cajones"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "items_pedido" ADD CONSTRAINT "items_pedido_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
