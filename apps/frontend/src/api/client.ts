import type {
  Cajon,
  Pedido,
  Gasto,
  CategoriaGasto,
  EstadoPedido,
  TipoHamburguesa,
  StockPorTipo,
  RegistrarRendimientoDto,
  CreateItemPedidoDto,
} from '@todopolloyplus/shared';

export const API_BASE = 'http://localhost:3001/api';

// ── Generic helper ──────────────────────────────────────────────
async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, options);
  const json = await res.json();
  if (!json.success) throw new Error(json.error || 'Error desconocido del servidor');
  return json.data as T;
}

// ── Stock ────────────────────────────────────────────────────────
export async function fetchStock(): Promise<{ cantidadActual: number; stockPorTipo: StockPorTipo[] }> {
  const data = await apiFetch<{ stock: { cantidadActual: number }; stockPorTipo: StockPorTipo[] }>(
    `${API_BASE}/stock`
  );
  return { cantidadActual: data.stock.cantidadActual, stockPorTipo: data.stockPorTipo };
}

// ── Cajones ──────────────────────────────────────────────────────
export async function fetchCajones(): Promise<Cajon[]> {
  return apiFetch<Cajon[]>(`${API_BASE}/cajones`);
}

export async function crearCajon(payload: {
  costoTotal: number;
  fecha: string;
  proveedor?: string;
}): Promise<Cajon> {
  return apiFetch<Cajon>(`${API_BASE}/cajones`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function registrarRendimientoCajon(
  id: string,
  distribucion: Record<TipoHamburguesa, number>
): Promise<Cajon> {
  const payload: RegistrarRendimientoDto = { distribucion };
  return apiFetch<Cajon>(`${API_BASE}/cajones/${id}/rendimiento`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function eliminarCajon(id: string): Promise<void> {
  await apiFetch<null>(`${API_BASE}/cajones/${id}`, { method: 'DELETE' });
}

// ── Pedidos ──────────────────────────────────────────────────────
export async function fetchPedidos(): Promise<Pedido[]> {
  return apiFetch<Pedido[]>(`${API_BASE}/pedidos`);
}

export async function crearPedido(payload: {
  clienteNombre: string;
  items: CreateItemPedidoDto[];
  precioTotal: number;
  fechaEntrega?: string;
}): Promise<Pedido> {
  return apiFetch<Pedido>(`${API_BASE}/pedidos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function actualizarEstadoPedido(
  id: string,
  estado: EstadoPedido
): Promise<Pedido> {
  return apiFetch<Pedido>(`${API_BASE}/pedidos/${id}/estado`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ estado }),
  });
}

export async function eliminarPedido(id: string): Promise<void> {
  await apiFetch<null>(`${API_BASE}/pedidos/${id}`, { method: 'DELETE' });
}

// ── Gastos ───────────────────────────────────────────────────────
export async function fetchGastos(): Promise<Gasto[]> {
  return apiFetch<Gasto[]>(`${API_BASE}/gastos`);
}

export async function crearGasto(payload: {
  concepto: string;
  monto: number;
  categoria: CategoriaGasto;
}): Promise<Gasto> {
  return apiFetch<Gasto>(`${API_BASE}/gastos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function actualizarGasto(
  id: string,
  payload: { concepto?: string; monto?: number; categoria?: CategoriaGasto }
): Promise<Gasto> {
  return apiFetch<Gasto>(`${API_BASE}/gastos/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

export async function eliminarGasto(id: string): Promise<void> {
  await apiFetch<null>(`${API_BASE}/gastos/${id}`, { method: 'DELETE' });
}
