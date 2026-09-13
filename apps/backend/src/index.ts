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
} from '@todopolloyplus/shared';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

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

    const result = await prisma.$transaction(async (tx) => {
      const nuevoCajon = await tx.cajon.create({
        data: {
          costoTotal: data.costoTotal,
          unidadesRendidas: data.unidadesRendidas ?? null,
          proveedor: data.proveedor ?? null,
          notas: data.notas ?? null,
          fecha: data.fecha ? new Date(data.fecha) : new Date(),
        },
      });

      // Solo actualizar stock si se especificaron unidades rendidas
      if (data.unidadesRendidas && data.unidadesRendidas > 0) {
        let stock = await tx.stock.findFirst();
        if (!stock) {
          stock = await tx.stock.create({ data: { cantidadActual: 0 } });
        }

        const balancePosterior = stock.cantidadActual + data.unidadesRendidas;
        await tx.stock.update({
          where: { id: stock.id },
          data: { cantidadActual: balancePosterior },
        });

        await tx.movimientoStock.create({
          data: {
            tipo: 'INGRESO_PRODUCCION',
            cantidad: data.unidadesRendidas,
            balancePosterior,
            cajonId: nuevoCajon.id,
            motivo: `Ingreso por producción de cajón (${data.unidadesRendidas} unid.)`,
          },
        });
      }

      return nuevoCajon;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error) {
    console.error('Error creating cajon:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el cajón' });
  }
});

app.patch('/api/cajones/:id/unidades', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { unidadesRendidas } = req.body as { unidadesRendidas: number };

    if (!unidadesRendidas || unidadesRendidas <= 0) {
      return res.status(400).json({ success: false, error: 'Unidades inválidas' });
    }

    const cajonPrevio = await prisma.cajon.findUnique({ where: { id } });
    if (!cajonPrevio) {
      return res.status(404).json({ success: false, error: 'Cajón no encontrado' });
    }

    const result = await prisma.$transaction(async (tx) => {
      const cajonActualizado = await tx.cajon.update({
        where: { id },
        data: { unidadesRendidas },
      });

      let stock = await tx.stock.findFirst();
      if (!stock) {
        stock = await tx.stock.create({ data: { cantidadActual: 0 } });
      }

      // Diferencia respecto a unidades previas (si ya tenía alguna)
      const prevUnidades = cajonPrevio.unidadesRendidas ?? 0;
      const diff = unidadesRendidas - prevUnidades;

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
            motivo: `Actualización de rendimiento cajón (${unidadesRendidas} unid.)`,
          },
        });
      }

      return cajonActualizado;
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Error updating cajon unidades:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el cajón' });
  }
});


app.get('/api/pedidos', async (_req: Request, res: Response) => {
  try {
    const pedidos = await prisma.pedido.findMany({
      orderBy: { createdAt: 'desc' },
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

    const nuevoPedido = await prisma.pedido.create({
      data: {
        clienteNombre: data.clienteNombre,
        cantidadHamburguesas: data.cantidadHamburguesas,
        precioTotal: data.precioTotal,
        estado: data.estado ?? 'PENDIENTE',
        fechaEntrega: data.fechaEntrega ? new Date(data.fechaEntrega) : null,
        notas: data.notas ?? null,
      },
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

    const pedidoPrevio = await prisma.pedido.findUnique({ where: { id } });
    if (!pedidoPrevio) {
      return res.status(404).json({ success: false, error: 'Pedido no encontrado' });
    }

    // Transacción: si pasa a ENTREGADO, descuenta del stock
    const updated = await prisma.$transaction(async (tx) => {
      const pedidoActualizado = await tx.pedido.update({
        where: { id },
        data: {
          estado,
          fechaEntrega: estado === 'ENTREGADO' ? new Date() : pedidoPrevio.fechaEntrega,
        },
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
      }

      return pedidoActualizado;
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    console.error('Error updating pedido estado:', error);
    res.status(500).json({ success: false, error: 'Error al actualizar el estado del pedido' });
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
        fecha: data.fecha ? new Date(data.fecha) : new Date(),
        notas: data.notas ?? null,
      },
    });

    res.status(201).json({ success: true, data: nuevoGasto });
  } catch (error) {
    console.error('Error creating gasto:', error);
    res.status(500).json({ success: false, error: 'Error al registrar el gasto' });
  }
});

app.listen(PORT, () => {
  console.log(`🍗 TodoPollo y Más API corriendo en http://localhost:${PORT}`);
});
