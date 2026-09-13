// ==========================================
// 1. PRODUCCIÓN (CAJÓN DE PECHUGAS)
// ==========================================

export interface Cajon {
  id: string;
  fecha: string | Date;
  costoTotal: number;
  unidadesRendidas?: number | null;
  proveedor?: string | null;
  notas?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateCajonDto {
  costoTotal: number;
  unidadesRendidas?: number;
  proveedor?: string;
  notas?: string;
  fecha?: string | Date;
}

// ==========================================
// 2. STOCK E INVENTARIO
// ==========================================

export type TipoMovimientoStock = 'INGRESO_PRODUCCION' | 'EGRESO_PEDIDO' | 'AJUSTE_MANUAL';

export interface Stock {
  id: string;
  cantidadActual: number;
  updatedAt: string | Date;
}

export interface MovimientoStock {
  id: string;
  fecha: string | Date;
  tipo: TipoMovimientoStock;
  cantidad: number;
  balancePosterior: number;
  cajonId?: string | null;
  pedidoId?: string | null;
  motivo?: string | null;
  createdAt: string | Date;
}

export interface AjusteStockDto {
  nuevaCantidad: number;
  motivo: string;
}

// ==========================================
// 3. PEDIDOS (VENTAS DE HAMBURGUESAS)
// ==========================================

export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO';

export interface Pedido {
  id: string;
  clienteNombre: string;
  cantidadHamburguesas: number;
  precioTotal: number;
  estado: EstadoPedido;
  fechaPedido: string | Date;
  fechaEntrega?: string | Date | null;
  notas?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreatePedidoDto {
  clienteNombre: string;
  cantidadHamburguesas: number;
  precioTotal: number;
  estado?: EstadoPedido;
  fechaEntrega?: string | Date;
  notas?: string;
}

export interface UpdateEstadoPedidoDto {
  estado: EstadoPedido;
}

// ==========================================
// 4. GASTOS (COSTOS EXTRA / INSUMOS)
// ==========================================

export type CategoriaGasto = 
  | 'SEPARADORES_BOLSAS' 
  | 'CONDIMENTOS_INSUMOS' 
  | 'SERVICIOS_LUZ_GAS' 
  | 'ENVIO_LOGISTICA' 
  | 'OTROS';

export interface Gasto {
  id: string;
  fecha: string | Date;
  concepto: string;
  categoria: CategoriaGasto | string;
  monto: number;
  notas?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface CreateGastoDto {
  concepto: string;
  monto: number;
  categoria?: CategoriaGasto | string;
  fecha?: string | Date;
  notas?: string;
}

// ==========================================
// 5. DASHBOARD & KPIS
// ==========================================

export interface DashboardStats {
  stockActual: number;
  cajonesMes: number;
  hamburguesasProducidasMes: number;
  costoPromedioPorHamburguesa: number;
  pedidosPendientes: number;
  hamburguesasPendientesEntrega: number;
  totalVentasMes: number;
  totalGastosMes: number;
  gananciaNetaEstimada: number;
}

// ==========================================
// 6. RESPUESTA ESTÁNDAR API
// ==========================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}
