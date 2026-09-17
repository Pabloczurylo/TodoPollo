// ==========================================
// 0. TIPOS DE HAMBURGUESA
// ==========================================

export type TipoHamburguesa = 'JAMON_QUESO' | 'ESPINACA_QUESO' | 'ZANAHORIA_QUESO';

export const TIPOS_HAMBURGUESA: TipoHamburguesa[] = [
  'JAMON_QUESO',
  'ESPINACA_QUESO',
  'ZANAHORIA_QUESO',
];

// ==========================================
// 1. PRODUCCIÓN (CAJÓN DE PECHUGAS)
// ==========================================

export interface CajonRendimientoPorTipo {
  id: string;
  cajonId: string;
  tipo: TipoHamburguesa;
  cantidad: number;
}

export interface Cajon {
  id: string;
  fecha: string | Date;
  costoTotal: number;
  unidadesRendidas?: number | null;
  proveedor?: string | null;
  notas?: string | null;
  createdAt: string | Date;
  updatedAt: string | Date;
  rendimientoPorTipo?: CajonRendimientoPorTipo[];
}

export interface CreateCajonDto {
  costoTotal: number;
  proveedor?: string;
  notas?: string;
  fecha?: string | Date;
}

export interface RegistrarRendimientoDto {
  distribucion: Record<TipoHamburguesa, number>;
}

// ==========================================
// 2. STOCK E INVENTARIO
// ==========================================

export type TipoMovimientoStock = 'INGRESO_PRODUCCION' | 'EGRESO_PEDIDO' | 'AJUSTE_MANUAL' | 'CONSUMO_INTERNO';

export interface Stock {
  id: string;
  cantidadActual: number;
  updatedAt: string | Date;
}

export interface StockPorTipo {
  id: string;
  tipo: TipoHamburguesa;
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

export interface ConsumoInternoDto {
  /** Cantidad por tipo de hamburguesa consumida (solo los tipos con cantidad > 0) */
  distribucion: Partial<Record<TipoHamburguesa, number>>;
  notas?: string;
}

// ==========================================
// 3. PEDIDOS (VENTAS DE HAMBURGUESAS)
// ==========================================

export type EstadoPedido = 'PENDIENTE' | 'EN_PREPARACION' | 'ENTREGADO' | 'CANCELADO';

export interface ItemPedido {
  id: string;
  pedidoId: string;
  tipo: TipoHamburguesa;
  cantidad: number;
}

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
  items?: ItemPedido[];
}

export interface CreateItemPedidoDto {
  tipo: TipoHamburguesa;
  cantidad: number;
}

export interface CreatePedidoDto {
  clienteNombre: string;
  items: CreateItemPedidoDto[];
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
