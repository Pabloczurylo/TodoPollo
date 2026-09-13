import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { prisma } from './db.js';
import {
  CreateCajonDto,
  CreatePedidoDto,
  CreateGastoDto,
  ApiResponse,
  DashboardStats,
  EstadoPedido,
  TipoHamburguesa,
  RegistrarRendimientoDto,
} from '@todopolloyplus/shared';

// Constante local para iterar sobre los tipos (evita problemas de resolución ESM)
const TIPOS_HAMBURGUESA: TipoHamburguesa[] = ['JAMON_QUESO', 'ESPINACA_QUESO', 'ZANAHORIA_QUESO'];

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Helper: asegura que StockPorTipo tenga una fila por cada tipo
async function ensureStockPorTipo(tx: typeof prisma) {
  for (const tipo of TIPOS_HAMBURGUESA) {
    await tx.stockPorTipo.upsert({
      where: { tipo },
      create: { tipo, cantidadActual: 0 },
      update: {},
    });
  }
}

// ============================================================
// HEALTH CHECK
// ============================================================
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    service: 'TodoPollo y Más Backend API',
  });
});

// ============================================================
// DASHBOARD STATS
// ============================================================
app.get('/api/dashboard/stats', async (_req: Request, res: Response) => {
  try {
    const stock = await prisma.stock.findFirst();
    const stockActual = stock?.cantidadActual ?? 0;

    const cajones = await prisma.cajon.findMany();
    const cajonesMes = cajones.length;
    const hamburguesasProducidasMes = cajones.reduce((sum, c) => sum + (c.unidadesRendidas ?? 0), 0);
    const costoTotalProducido = cajones.reduce((sum, c) => sum + c.costoTotal, 0);
    const costoPromedioPorHamburguesa =
      hamburguesasProducidasMes > 0
        ? costoTotalProducido / hamburguesasProducidasMes
        : 0;

    const pedidosPendientesLista = await prisma.pedido.findMany({
      where: {
        estado: { in: ['PENDIENTE', 'EN_PREPARACION'] },
      },
    });
    const pedidosPendientes = pedidosPendientesLista.length;
    const hamburguesasPendientesEntrega = pedidosPendientesLista.reduce(
      (sum, p) => sum + p.cantidadHamburguesas,
      0
    );

    const pedidosEntregados = await prisma.pedido.findMany({
      where: { estado: 'ENTREGADO' },
    });
    const totalVentasMes = pedidosEntregados.reduce((sum, p) => sum + p.precioTotal, 0);

    const gastos = await prisma.gasto.findMany();
    const totalGastosMes = gastos.reduce((sum, g) => sum + g.monto, 0);

    const gananciaNetaEstimada = totalVentasMes - costoTotalProducido - totalGastosMes;

    const stats: DashboardStats = {
      stockActual,
      cajonesMes,
      hamburguesasProducidasMes,
      costoPromedioPorHamburguesa,
      pedidosPendientes,
      hamburguesasPendientesEntrega,
      totalVentasMes,
      totalGastosMes,
      gananciaNetaEstimada,
    };

    const response: ApiResponse<DashboardStats> = {
      success: true,
      data: stats,
    };
    res.json(response);
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({
      success: false,
      error: 'Error al obtener estadísticas del dashboard',
    });
  }
});

// ============================================================
// STOCK
// ============================================================
app.get('/api/stock', async (_req: Request, res: Response) => {
  try {
    let stock = await prisma.stock.findFirst();
    if (!stock) {
      stock = await prisma.stock.create({
        data: { cantidadActual: 0 },
      });
    }

    // Stock desglosado por tipo
    await ensureStockPorTipo(prisma);
    const stockPorTipo = await prisma.stockPorTipo.findMany({
      orderBy: { tipo: 'asc' },
    });

    const ultimosMovimientos = await prisma.movimientoStock.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' },
      include: {
        cajon: true,
        pedido: true,
      },
    });

    res.json({
      success: true,
      data: {
        stock,
        stockPorTipo,
        movimientos: ultimosMovimientos,
      },
    });
  } catch (error) {
    console.error('Error fetching stock:', error);
    res.status(500).json({ success: false, error: 'Error al consultar stock' });
  }
});

// ============================================================
// PRODUCCIÓN (CAJONES DE PECHUGAS)
// ============================================================
app.get('/api/cajones', async (_req: Request, res: Response) => {
  try {
    const cajones = await prisma.cajon.findMany({
      orderBy: { fecha: 'desc' },
      include: { rendimientoPorTipo: true },
    });
    res.json({ success: true, data: cajones });
  } catch (error) {
    console.error('Error fetching cajones:', error);
    res.status(500).json({ success: false, error: 'Error al obtener cajones' });
  }
});

app.post('/api/cajones', async (req: Request, res: Response) => {
  try {
    const data: CreateCajonDto = req.body;

    const nuevoCajon = await prisma.cajon.create({
      data: {
        costoTotal: data.costoTotal,
        proveedor: data.proveedor ?? null,
        notas: data.notas ?? null,
        fecha: data.fecha ? new Date(data.fecha as string) : new Date(),
      },
      include: { rendimientoPorTipo: true },
    });

    res.status(201).json({ success: true, data: nuevoCajon });
  } catch (error) {
    console.error('Error creating cajon:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el cajón' });
  }
});

// Registrar/actualizar distribución de hamburguesas por tipo para un cajón
app.patch('/api/cajones/:id/rendimiento', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { distribucion } = req.body as RegistrarRendimientoDto;

    const cajonPrevio = await prisma.cajon.findUnique({
      where: { id },
      include: { rendimientoPorTipo: true },
    });
    if (!cajonPrevio) {
      return res.status(404).json({ success: false, error: 'Cajón no encontrado' });
    }

    // Calcular totales: nuevo total vs total previo
    const nuevoTotal = Object.values(distribucion).reduce((s, n) => s + n, 0);
    const totalPrevio = cajonPrevio.unidadesRendidas ?? 0;
    const diff = nuevoTotal - totalPrevio;

    // Distribución previa por tipo
    const prevPorTipo: Record<string, number> = {};
    for (const r of cajonPrevio.rendimientoPorTipo) {
      prevPorTipo[r.tipo] = r.cantidad;
    }

    const result = await prisma.$transaction(async (tx) => {
      // Upsert rendimiento por tipo en el cajón
      for (const tipo of TIPOS_HAMBURGUESA) {
        const cantidad = distribucion[tipo] ?? 0;
        await tx.cajonRendimientoPorTipo.upsert({
          where: { cajonId_tipo: { cajonId: id, tipo } },
          create: { cajonId: id, tipo, cantidad },
          update: { cantidad },
        });
      }

      // Actualizar unidades rendidas totales en el cajón
      const cajonActualizado = await tx.cajon.update({
        where: { id },
        data: { unidadesRendidas: nuevoTotal },
        include: { rendimientoPorTipo: true },
      });

      // Actualizar stock total
      let stock = await tx.stock.findFirst();
      if (!stock) {
        stock = await tx.stock.create({ data: { cantidadActual: 0 } });
      }

      if (diff !== 0) {
        const balancePosterior = stock.cantidadActual + diff;
        await tx.stock.update({
          where: { id: stock.id },
          data: { cantidadActual: balancePosterior },
        });

        await tx.movimientoStock.create({
          data: {
            tipo: 'INGRESO_PRODUCCION',
            cantidad: diff,
            balancePosterior,
            cajonId: id,
            motivo: `Ingreso por producción: ${Object.entries(distribucion)
              .filter(([, v]) => v > 0)
              .map(([k, v]) => `${v} ${k.replace('_', '/')}`)
              .join(', ')}`,
          },
        });
      }

      // Actualizar stock por tipo
      await ensureStockPorTipo(tx);
      for (const tipo of TIPOS_HAMBURGUESA) {
        const nuevaCantidadTipo = distribucion[tipo] ?? 0;
        const prevCantidadTipo = prevPorTipo[tipo] ?? 0;
        const diffTipo = nuevaCantidadTipo - prevCantidadTipo;
        if (diffTipo !== 0) {
          await tx.stockPorTipo.update({
            where: { tipo },
            data: { cantidadActual: { increment: diffTipo } },
          });
        }
      }

      return cajonActualizado;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating cajon rendimiento:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el rendimiento del cajón' });
  }
});

app.delete('/api/cajones/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const cajon = await prisma.cajon.findUnique({
      where: { id },
      include: { rendimientoPorTipo: true },
    });
    if (!cajon) {
      return res.status(404).json({ success: false, error: 'Cajón no encontrado' });
    }

    // Si tenía rendimiento, descontar del stock
    if (cajon.unidadesRendidas && cajon.unidadesRendidas > 0) {
      await prisma.$transaction(async (tx) => {
        let stock = await tx.stock.findFirst();
        if (stock) {
          await tx.stock.update({
            where: { id: stock.id },
            data: { cantidadActual: { decrement: cajon.unidadesRendidas! } },
          });
        }
        // Descontar por tipo
        for (const r of cajon.rendimientoPorTipo) {
          await tx.stockPorTipo.update({
            where: { tipo: r.tipo },
            data: { cantidadActual: { decrement: r.cantidad } },
          });
        }
        await tx.cajon.delete({ where: { id } });
      });
    } else {
      await prisma.cajon.delete({ where: { id } });
    }

    res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error deleting cajon:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar el cajón' });
  }
});

// ============================================================
// PEDIDOS
// ============================================================
app.get('/api/pedidos', async (_req: Request, res: Response) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { createdAt: 'desc' },
      include: { items: true },
    });
    res.json({ success: true, data: pedidos });
  } catch (error) {
    console.error('Error fetching pedidos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener pedidos' });
  }
});

app.post('/api/pedidos', async (req: Request, res: Response) => {
  try {
    const data: CreatePedidoDto = req.body;

    // Validar que venga al menos un ítem con cantidad > 0
    const itemsValidos = (data.items ?? []).filter((i) => i.cantidad > 0);
    if (itemsValidos.length === 0) {
      return res.status(400).json({ success: false, error: 'El pedido debe tener al menos un tipo de hamburguesa' });
    }

    const cantidadTotal = itemsValidos.reduce((s, i) => s + i.cantidad, 0);

    const nuevoPedido = await prisma.pedido.create({
      data: {
        clienteNombre: data.clienteNombre,
        cantidadHamburguesas: cantidadTotal,
        precioTotal: data.precioTotal,
        estado: data.estado ?? 'PENDIENTE',
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega as string) : null,
        notas: data.notas ?? null,
        items: {
          create: itemsValidos.map((i) => ({
            tipo: i.tipo,
            cantidad: i.cantidad,
          })),
        },
      },
      include: { items: true },
    });

    res.status(201).json({ success: true, data: nuevoPedido });
  } catch (error) {
    console.error('Error creating pedido:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el pedido' });
  }
});

app.patch('/api/pedidos/:id/estado', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { estado } = req.body as { estado: EstadoPedido };

    const pedidoPrevio = await prisma.pedido.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!pedidoPrevio) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const pedidoActualizado = await tx.pedido.update({
        where: { id },
        data: {
          estado,
          fechaEntrega: estado === 'ENTREGADO' ? new Date() : pedidoPrevio.fechaEntrega,
        },
        include: { items: true },
      });

      // Si pasa a ENTREGADO y antes no lo estaba, restar de stock
      if (estado === 'ENTREGADO' && pedidoPrevio.estado !== 'ENTREGADO') {
        let stock = await tx.stock.findFirst();
        if (!stock) {
          stock = await tx.stock.create({ data: { cantidadActual: 0 } });
        }

        const balancePosterior = stock.cantidadActual - pedidoPrevio.cantidadHamburguesas;
        await tx.stock.update({
          where: { id: stock.id },
          data: { cantidadActual: balancePosterior },
        });

        await tx.movimientoStock.create({
          data: {
            tipo: 'EGRESO_PEDIDO',
            cantidad: -pedidoPrevio.cantidadHamburguesas,
            balancePosterior,
            pedidoId: pedidoActualizado.id,
            motivo: `Entrega de pedido a ${pedidoPrevio.clienteNombre}`,
          },
        });

        // Descontar por tipo de hamburguesa
        await ensureStockPorTipo(tx);
        for (const item of pedidoPrevio.items) {
          await tx.stockPorTipo.update({
            where: { tipo: item.tipo },
            data: { cantidadActual: { decrement: item.cantidad } },
          });
        }
      }

      return pedidoActualizado;
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating pedido estado:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el estado del pedido' });
  }
});

app.delete('/api/pedidos/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const pedido = await prisma.pedido.findUnique({ where: { id } });
    if (!pedido) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }

    await prisma.pedido.delete({ where: { id } });

    res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error deleting pedido:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar el pedido' });
  }
});

// ============================================================
// GASTOS (COSTOS EXTRA)
// ============================================================
app.get('/api/gastos', async (_req: Request, res: Response) => {
  try {
    const gastos = await prisma.gasto.findMany({
      orderBy: { fecha: 'desc' },
    });
    res.json({ success: true, data: gastos });
  } catch (error) {
    console.error('Error fetching gastos:', error);
    res.status(500).json({ success: false, error: 'Error al obtener gastos' });
  }
});

app.post('/api/gastos', async (req: Request, res: Response) => {
  try {
    const data: CreateGastoDto = req.body;
    const nuevoGasto = await prisma.gasto.create({
      data: {
        concepto: data.concepto,
        monto: data.monto,
        categoria: (data.categoria as any) ?? 'OTROS',
        fecha: data.fecha ? new Date(data.fecha as string) : new Date(),
        notas: data.notas ?? null,
      },
    });

    res.status(201).json({ success: true, data: nuevoGasto });
  } catch (error) {
    console.error('Error creating gasto:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el gasto' });
  }
});

app.patch('/api/gastos/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { concepto, monto, categoria } = req.body as { concepto?: string; monto?: number; categoria?: string };

    const gasto = await prisma.gasto.findUnique({ where: { id } });
    if (!gasto) {
      return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
    }

    const gastoActualizado = await prisma.gasto.update({
      where: { id },
      data: {
        ...(concepto !== undefined && { concepto }),
        ...(monto !== undefined && { monto }),
        ...(categoria !== undefined && { categoria: categoria as any }),
      },
    });

    res.json({ success: true, data: gastoActualizado });
  } catch (error) {
    console.error('Error updating gasto:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el gasto' });
  }
});

app.delete('/api/gastos/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;

    const gasto = await prisma.gasto.findUnique({ where: { id } });
    if (!gasto) {
      return res.status(404).json({ success: false, error: 'Gasto no encontrado' });
    }

    await prisma.gasto.delete({ where: { id } });

    res.json({ success: true, data: null });
  } catch (error) {
    console.error('Error deleting gasto:', error);
    res.status(500).json({ success: false, error: 'Error al eliminar el gasto' });
  }
});

// Escucha solo en desarrollo local; en Vercel el runtime importa el handler directamente
if (process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🍗 TodoPollo y Más API corriendo en http://localhost:${PORT}`);
  });
}

export default app;
