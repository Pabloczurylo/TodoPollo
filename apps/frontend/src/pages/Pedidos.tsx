import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShoppingBag, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import {
  formatCurrency,
  getEstadoPedidoLabel,
  getTipoHamburguesaLabel,
  getTipoHamburguesaEmoji,
  TIPOS_HAMBURGUESA,
} from '@todopolloyplus/shared';
import type { TipoHamburguesa } from '@todopolloyplus/shared';
import { crearPedido, actualizarEstadoPedido, eliminarPedido } from '../api/client';
import type { AppDataContextType } from '../components/layout/Layout';

type CantidadesPorTipo = Record<TipoHamburguesa, string>;

const cantidadesVacias = (): CantidadesPorTipo => ({
  JAMON_QUESO: '',
  ESPINACA_QUESO: '',
  ZANAHORIA_QUESO: '',
});

export function Pedidos() {
  const { pedidos, stockPorTipo, stockActual, fetchAll, showAlert, showConfirm } =
    useOutletContext<AppDataContextType>();

  const [cliente, setCliente] = useState('');
  const [cantidades, setCantidades] = useState<CantidadesPorTipo>(cantidadesVacias());
  const [precio, setPrecio] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');

  const totalCantidad = TIPOS_HAMBURGUESA.reduce(
    (s, t) => s + (parseInt(cantidades[t]) || 0),
    0
  );

  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    const precioNum = parseFloat(precio);
    if (!cliente || totalCantidad <= 0 || !precioNum) {
      showAlert('Datos incompletos', 'Completá el cliente, al menos un tipo de hamburguesa y el precio.', 'error');
      return;
    }

    const items = TIPOS_HAMBURGUESA.filter((t) => (parseInt(cantidades[t]) || 0) > 0).map((t) => ({
      tipo: t,
      cantidad: parseInt(cantidades[t]),
    }));

    try {
      await crearPedido({
        clienteNombre: cliente,
        items,
        precioTotal: precioNum,
        fechaEntrega: fechaEntrega || undefined,
      });
      await fetchAll();
      setCliente('');
      setCantidades(cantidadesVacias());
      setPrecio('');
      setFechaEntrega('');
      showAlert('Pedido Registrado', `Pedido para ${cliente} en estado Pendiente.`, 'success');
    } catch (err: unknown) {
      showAlert('Error', err instanceof Error ? err.message : 'No se pudo registrar el pedido.', 'error');
    }
  };

  const handleEntregarPedido = async (id: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado === 'ENTREGADO') return;

    // Verificar stock por tipo
    const stockMap: Record<string, number> = {};
    for (const s of stockPorTipo) {
      stockMap[s.tipo] = s.cantidadActual;
    }

    const items = pedido.items ?? [];
    const problemaTipo = items.find((item) => (stockMap[item.tipo] ?? 0) < item.cantidad);

    if (problemaTipo) {
      showAlert(
        'Stock Insuficiente',
        `No hay suficiente stock de ${getTipoHamburguesaLabel(problemaTipo.tipo)}. Hay ${stockMap[problemaTipo.tipo] ?? 0} y el pedido requiere ${problemaTipo.cantidad}.`,
        'warning'
      );
      return;
    }

    if (stockActual < pedido.cantidadHamburguesas) {
      showAlert(
        'Stock Insuficiente',
        `Hay ${stockActual} hamburguesas en stock y el pedido requiere ${pedido.cantidadHamburguesas}.`,
        'warning'
      );
      return;
    }

    try {
      await actualizarEstadoPedido(id, 'ENTREGADO');
      await fetchAll();
    } catch (err: unknown) {
      showAlert('Error', err instanceof Error ? err.message : 'No se pudo entregar el pedido.', 'error');
    }
  };

  const handleEliminarPedido = (id: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;
    showConfirm(
      '¿Eliminar Pedido?',
      `Vas a eliminar el pedido de ${pedido.clienteNombre}. Esta acción no se puede deshacer.`,
      async () => {
        try {
          await eliminarPedido(id);
          await fetchAll();
          showAlert('Pedido Eliminado', 'El pedido fue eliminado correctamente.', 'success');
        } catch (err: unknown) {
          showAlert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el pedido.', 'error');
        }
      }
    );
  };

  return (
    <div className="md:grid md:grid-cols-2 md:gap-8 items-start space-y-4 md:space-y-0">
      {/* Formulario nuevo pedido */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <ShoppingBag className="text-emerald-600" size={20} />
          <h2 className="font-bold text-slate-800 text-sm">Nuevo Pedido de Venta</h2>
        </div>

        <form onSubmit={handleCrearPedido} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Cliente / Negocio
            </label>
            <input
              type="text"
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
              placeholder="Ej: Juan Pérez"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Cantidades por tipo */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">
              Hamburguesas por tipo
            </label>
            <div className="space-y-2">
              {TIPOS_HAMBURGUESA.map((tipo) => {
                const stockTipo = stockPorTipo.find((s) => s.tipo === tipo)?.cantidadActual ?? 0;
                return (
                  <div key={tipo} className="flex items-center gap-2 bg-slate-50 rounded-lg px-3 py-2">
                    <span className="text-xl w-7 text-center">{getTipoHamburguesaEmoji(tipo)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-slate-700 truncate">{getTipoHamburguesaLabel(tipo)}</p>
                      <p className="text-[10px] text-slate-400">Stock: {stockTipo}</p>
                    </div>
                    <input
                      type="number"
                      min="0"
                      value={cantidades[tipo]}
                      onChange={(e) => setCantidades((prev) => ({ ...prev, [tipo]: e.target.value }))}
                      placeholder="0"
                      className="w-20 text-sm font-semibold text-center px-2 py-1.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                );
              })}
            </div>
            {totalCantidad > 0 && (
              <p className="text-xs font-bold text-emerald-700 text-right mt-1.5">
                Total: {totalCantidad} hamburguesas
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Precio Total ($)
            </label>
            <input
              type="number"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              placeholder="Ej: 42500"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Fecha de Entrega <span className="text-slate-400 font-normal">(opcional)</span>
            </label>
            <input
              type="date"
              value={fechaEntrega}
              onChange={(e) => setFechaEntrega(e.target.value)}
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            type="submit"
            disabled={totalCantidad === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-bold py-3 rounded-lg shadow active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Guardar Pedido{totalCantidad > 0 ? ` (${totalCantidad} unid.)` : ''}</span>
          </button>
        </form>
      </div>

      {/* Listado de Pedidos */}
      <div className="bg-white/50 p-1 rounded-2xl md:bg-transparent md:p-0">
        <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Listado de Pedidos
        </h3>
        <div className="space-y-2">
          {pedidos.map((p) => {
            const isEntregado = p.estado === 'ENTREGADO';
            const items = p.items ?? [];
            return (
              <div
                key={p.id}
                className={`bg-white p-3.5 rounded-xl border ${
                  isEntregado ? 'border-slate-200 opacity-80' : 'border-amber-300 bg-amber-50/20'
                } shadow-sm space-y-2.5`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-sm font-bold text-slate-800">{p.clienteNombre}</p>
                    <p className="text-xs text-slate-500 font-medium">
                      {p.cantidadHamburguesas} hamburguesas • {formatCurrency(p.precioTotal)}
                    </p>
                    {p.fechaEntrega && (
                      <p className="text-[10px] text-emerald-700 font-semibold mt-0.5 flex items-center gap-1">
                        📅 Entrega: {new Date(p.fechaEntrega).toLocaleDateString('es-AR')}
                      </p>
                    )}
                  </div>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      isEntregado
                        ? 'bg-slate-100 text-slate-600'
                        : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}
                  >
                    {getEstadoPedidoLabel(p.estado)}
                  </span>
                </div>

                {/* Detalle por tipo */}
                {items.length > 0 && (
                  <div className="flex gap-1.5 flex-wrap">
                    {items.map((item) => (
                      <span
                        key={item.tipo}
                        className="inline-flex items-center gap-1 text-[10px] font-semibold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full"
                      >
                        {getTipoHamburguesaEmoji(item.tipo)} {item.cantidad} {getTipoHamburguesaLabel(item.tipo)}
                      </span>
                    ))}
                  </div>
                )}

                {/* Botones de acción */}
                <div className="flex gap-2 mt-2">
                  {!isEntregado && (
                    <button
                      onClick={() => handleEntregarPedido(p.id)}
                      className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition"
                    >
                      <CheckCircle2 size={16} />
                      <span>Entregar</span>
                    </button>
                  )}
                  <button
                    onClick={() => handleEliminarPedido(p.id)}
                    className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-bold transition active:scale-95 ${
                      isEntregado
                        ? 'w-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600'
                        : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                    }`}
                  >
                    <Trash2 size={16} />
                    <span>Eliminar</span>
                  </button>
                </div>
              </div>
            );
          })}
          {pedidos.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No hay pedidos registrados aún</p>
          )}
        </div>
      </div>
    </div>
  );
}
