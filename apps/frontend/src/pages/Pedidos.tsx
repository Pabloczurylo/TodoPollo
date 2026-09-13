import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ShoppingBag, Plus, CheckCircle2, Trash2 } from 'lucide-react';
import { formatCurrency, getEstadoPedidoLabel } from '@todopolloyplus/shared';
import { crearPedido, actualizarEstadoPedido } from '../api/client';
import type { AppDataContextType } from '../components/layout/Layout';

export function Pedidos() {
  const { pedidos, stockActual, fetchAll, showAlert, showConfirm } =
    useOutletContext<AppDataContextType>();

  const [cliente, setCliente] = useState('');
  const [cantidad, setCantidad] = useState('');
  const [precio, setPrecio] = useState('');
  const [fechaEntrega, setFechaEntrega] = useState('');

  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantidadNum = parseInt(cantidad);
    const precioNum = parseFloat(precio);
    if (!cliente || !cantidadNum || !precioNum) return;
    try {
      await crearPedido({
        clienteNombre: cliente,
        cantidadHamburguesas: cantidadNum,
        precioTotal: precioNum,
        fechaEntrega: fechaEntrega || undefined,
      });
      await fetchAll();
      setCliente('');
      setCantidad('');
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
      '¿Cancelar Pedido?',
      `Vas a cancelar el pedido de ${pedido.clienteNombre}. Esta acción no se puede deshacer.`,
      async () => {
        try {
          await actualizarEstadoPedido(id, 'CANCELADO');
          await fetchAll();
        } catch (err: unknown) {
          showAlert('Error', err instanceof Error ? err.message : 'No se pudo cancelar el pedido.', 'error');
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

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Cantidad</label>
              <input
                type="number"
                value={cantidad}
                onChange={(e) => setCantidad(e.target.value)}
                placeholder="Ej: 50"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
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
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-lg shadow active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Guardar Pedido</span>
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
