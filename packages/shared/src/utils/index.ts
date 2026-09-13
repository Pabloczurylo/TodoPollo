import type { EstadoPedido, CategoriaGasto, TipoHamburguesa } from '../types/index.js';

/**
 * Formatea un número como moneda en Pesos Argentinos (ARS)
 * Ejemplo: 12500 -> "$ 12.500" o "$ 12.500,50"
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return '$ 0';
  }
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Formatea una fecha a formato legible (DD/MM/YYYY)
 */
export function formatDate(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(d);
}

/**
 * Formatea una fecha y hora (DD/MM HH:mm)
 */
export function formatDateTime(date: string | Date | null | undefined): string {
  if (!date) return '-';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (isNaN(d.getTime())) return '-';
  return new Intl.DateTimeFormat('es-AR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

/**
 * Calcula el costo unitario por hamburguesa a partir del costo total del cajón
 * y la cantidad rendida.
 */
export function calculateCostPerBurger(costoTotal: number, unidadesRendidas: number): number {
  if (!unidadesRendidas || unidadesRendidas <= 0) return 0;
  return Number((costoTotal / unidadesRendidas).toFixed(2));
}

/**
 * Retorna el label amigable para los estados de pedidos
 */
export function getEstadoPedidoLabel(estado: EstadoPedido): string {
  switch (estado) {
    case 'PENDIENTE':
      return 'Pendiente';
    case 'EN_PREPARACION':
      return 'En Preparación';
    case 'ENTREGADO':
      return 'Entregado';
    case 'CANCELADO':
      return 'Cancelado';
    default:
      return estado;
  }
}

/**
 * Retorna el label amigable para las categorías de gastos
 */
export function getCategoriaGastoLabel(categoria: CategoriaGasto | string): string {
  switch (categoria) {
    case 'SEPARADORES_BOLSAS':
      return 'Separadores y Bolsas';
    case 'CONDIMENTOS_INSUMOS':
      return 'Condimentos e Insumos';
    case 'SERVICIOS_LUZ_GAS':
      return 'Servicios (Luz/Gas)';
    case 'ENVIO_LOGISTICA':
      return 'Logística / Envío';
    case 'MANTENIMIENTO':
      return 'Mantenimiento';
    case 'OTROS':
      return 'Otros Gastos';
    default:
      return categoria;
  }
}

/**
 * Retorna el label amigable para los tipos de hamburguesa
 */
export function getTipoHamburguesaLabel(tipo: TipoHamburguesa): string {
  switch (tipo) {
    case 'JAMON_QUESO':
      return 'Jamón y Queso';
    case 'ESPINACA_QUESO':
      return 'Espinaca y Queso';
    case 'ZANAHORIA_QUESO':
      return 'Zanahoria y Queso';
    default:
      return tipo;
  }
}

/**
 * Emoji representativo para cada tipo de hamburguesa
 */
export function getTipoHamburguesaEmoji(tipo: TipoHamburguesa): string {
  switch (tipo) {
    case 'JAMON_QUESO':
      return '🧀';
    case 'ESPINACA_QUESO':
      return '🌿';
    case 'ZANAHORIA_QUESO':
      return '🥕';
    default:
      return '🍔';
  }
}
