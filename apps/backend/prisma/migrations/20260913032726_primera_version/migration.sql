-- CreateEnum
CREATE TYPE "TipoMovimientoStock" AS ENUM ('INGRESO_PRODUCCION', 'EGRESO_PEDIDO', 'AJUSTE_MANUAL');

-- CreateEnum
CREATE TYPE "EstadoPedido" AS ENUM ('PENDIENTE', 'EN_PREPARACION', 'ENTREGADO', 'CANCELADO');

-- CreateEnum
CREATE TYPE "CategoriaGasto" AS ENUM ('SEPARADORES_BOLSAS', 'CONDIMENTOS_INSUMOS', 'SERVICIOS_LUZ_GAS', 'ENVIO_LOGISTICA', 'OTROS');

-- CreateTable
CREATE TABLE "cajones" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "costo_total" DOUBLE PRECISION NOT NULL,
    "unidades_rendidas" INTEGER,
    "proveedor" TEXT,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cajones_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "stock" (
    "id" TEXT NOT NULL,
    "cantidad_actual" INTEGER NOT NULL DEFAULT 0,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "movimientos_stock" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "tipo" "TipoMovimientoStock" NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "balance_posterior" INTEGER NOT NULL,
    "motivo" TEXT,
    "cajon_id" TEXT,
    "pedido_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimientos_stock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "pedidos" (
    "id" TEXT NOT NULL,
    "cliente_nombre" TEXT NOT NULL,
    "cantidad_hamburguesas" INTEGER NOT NULL,
    "precio_total" DOUBLE PRECISION NOT NULL,
    "estado" "EstadoPedido" NOT NULL DEFAULT 'PENDIENTE',
    "fecha_pedido" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "fecha_entrega" TIMESTAMP(3),
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "pedidos_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gastos" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concepto" TEXT NOT NULL,
    "categoria" "CategoriaGasto" NOT NULL DEFAULT 'OTROS',
    "monto" DOUBLE PRECISION NOT NULL,
    "notas" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "gastos_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_cajon_id_fkey" FOREIGN KEY ("cajon_id") REFERENCES "cajones"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimientos_stock" ADD CONSTRAINT "movimientos_stock_pedido_id_fkey" FOREIGN KEY ("pedido_id") REFERENCES "pedidos"("id") ON DELETE SET NULL ON UPDATE CASCADE;
