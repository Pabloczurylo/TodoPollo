
import { useNavigate, useOutletContext } from 'react-router-dom';
import {
  Package,
  Layers,
  ShoppingBag,
  Receipt,
  TrendingUp,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@todopolloyplus/shared';
import { ReporteSeguimiento } from '../components/dashboard/ReporteSeguimiento';
import type { AppDataContextType } from '../components/layout/Layout';

export function Dashboard() {
  const { cajones, pedidos, gastos, totalVentas, totalGastos, pedidosPendientesCount, stockActual } =
    useOutletContext<AppDataContextType>();

  const navigate = useNavigate();

  const totalCajones = cajones.reduce((acc, c) => acc + c.costoTotal, 0);
  const balanceNeto = totalVentas - totalCajones - totalGastos;
  const balancePositivo = balanceNeto >= 0;

  return (
    <div className="space-y-4 md:space-y-5">
      {/* Tarjeta de Stock Principal */}
      <div className="bg-gradient-to-br from-amber-500 to-amber-600 rounded-2xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-[-10px] top-[-10px] opacity-10">
          <Package size={140} />
        </div>
        <div className="flex items-center justify-between text-amber-100 text-xs font-semibold uppercase tracking-wider mb-1">
          <span>Stock Actual Disponible</span>
          <span className="bg-white/20 px-2 py-0.5 rounded text-[11px]">Inventario</span>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-4xl font-extrabold tracking-tight">{stockActual}</span>
          <span className="text-lg text-amber-100 font-medium">hamburguesas</span>
        </div>
        <p className="text-xs text-amber-100/90 mt-2 flex items-center gap-1">
          <TrendingUp size={14} /> Listo para despachar y tomar nuevos pedidos
        </p>
      </div>

      {/* Accesos Rápidos Mobile */}
      <div className="grid grid-cols-3 gap-2 md:hidden">
        <button
          onClick={() => navigate('/produccion')}
          className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center gap-1 active:scale-95 transition"
        >
          <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
            <Layers size={18} />
          </div>
          <span className="text-xs font-bold text-slate-700">+ Cajón</span>
        </button>

        <button
          onClick={() => navigate('/pedidos')}
          className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center gap-1 active:scale-95 transition"
        >
          <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
            <ShoppingBag size={18} />
          </div>
          <span className="text-xs font-bold text-slate-700">+ Pedido</span>
        </button>

        <button
          onClick={() => navigate('/gastos')}
          className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center gap-1 active:scale-95 transition"
        >
          <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
            <Receipt size={18} />
          </div>
          <span className="text-xs font-bold text-slate-700">+ Gasto</span>
        </button>
      </div>

      {/* Métricas principales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {/* Ventas */}
        <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-xs text-slate-500 font-medium">Ventas</span>
          </div>
          <div className="text-lg md:text-2xl font-bold text-emerald-600">
            {formatCurrency(totalVentas)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pedidos entregados</div>
        </div>

        {/* Gasto cajones */}
        <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-orange-400" />
            <span className="text-xs text-slate-500 font-medium">Cajones</span>
          </div>
          <div className="text-lg md:text-2xl font-bold text-orange-500">
            {formatCurrency(totalCajones)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {cajones.length} cajón{cajones.length !== 1 ? 'es' : ''} comprado
            {cajones.length !== 1 ? 's' : ''}
          </div>
        </div>

        {/* Insumos */}
        <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-1.5 mb-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-xs text-slate-500 font-medium">Insumos</span>
          </div>
          <div className="text-lg md:text-2xl font-bold text-rose-600">
            {formatCurrency(totalGastos)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Bolsas, separadores…</div>
        </div>

        {/* Balance neto */}
        <div
          className={`p-4 md:p-5 rounded-xl border shadow-sm ${
            balancePositivo ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <div
              className={`w-2 h-2 rounded-full ${balancePositivo ? 'bg-emerald-500' : 'bg-rose-500'}`}
            />
            <span className="text-xs text-slate-500 font-medium">Balance Neto</span>
          </div>
          <div
            className={`text-lg md:text-2xl font-bold ${
              balancePositivo ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {balanceNeto >= 0 ? '+' : ''}
            {formatCurrency(balanceNeto)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Ventas − cajones − insumos</div>
        </div>
      </div>

      {/* Reporte de Seguimiento */}
      <ReporteSeguimiento cajones={cajones} pedidos={pedidos} gastos={gastos} />

      {/* Alerta de pedidos pendientes */}
      {pedidosPendientesCount > 0 && (
        <div
          onClick={() => navigate('/pedidos')}
          className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between cursor-pointer active:bg-amber-100 transition"
        >
          <div className="flex items-center gap-2.5">
            <Clock className="text-amber-600" size={20} />
            <div>
              <p className="text-xs font-bold text-amber-900">
                {pedidosPendientesCount}{' '}
                {pedidosPendientesCount === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
              </p>
              <p className="text-[11px] text-amber-700">Toca para revisar y marcar entregado</p>
            </div>
          </div>
          <span className="text-xs font-bold text-amber-700 bg-amber-200/70 px-2 py-1 rounded-md">
            Ver
          </span>
        </div>
      )}

      {/* Actividad Reciente */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Actividad Reciente
        </h3>
        <div className="space-y-2.5">
          {[
            ...cajones.slice(0, 3).map((c) => ({
              tipo: 'cajon' as const,
              label: `Cajón comprado${c.proveedor ? ` — ${c.proveedor}` : ''}`,
              sub: `Costo: ${formatCurrency(c.costoTotal)}`,
              fecha: String(c.fecha),
              id: c.id,
            })),
            ...pedidos
              .filter((p) => p.estado === 'ENTREGADO')
              .slice(0, 3)
              .map((p) => ({
                tipo: 'entrega' as const,
                label: `Entrega a ${p.clienteNombre}`,
                sub: `${p.cantidadHamburguesas} hamburguesas · ${formatCurrency(p.precioTotal)}`,
                fecha: String(p.fechaPedido),
                id: p.id,
              })),
          ]
            .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
            .slice(0, 5)
            .map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`p-1 rounded-full ${
                      item.tipo === 'cajon'
                        ? 'bg-orange-100 text-orange-600'
                        : 'bg-emerald-100 text-emerald-700'
                    }`}
                  >
                    {item.tipo === 'cajon' ? (
                      <ArrowDownLeft size={13} />
                    ) : (
                      <ArrowUpRight size={13} />
                    )}
                  </span>
                  <div>
                    <p className="font-semibold text-slate-800">{item.label}</p>
                    <p className="text-[10px] text-slate-400">{item.sub}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-400">{formatDate(item.fecha)}</span>
              </div>
            ))}
          {cajones.length === 0 && pedidos.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-2">
              Sin actividad registrada aún
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
