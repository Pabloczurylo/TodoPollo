import { useState } from 'react';
import type { Cajon, Pedido, Gasto } from '@todopolloyplus/shared';
import { formatCurrency } from '@todopolloyplus/shared';

type Periodo = 'semana' | 'mes';

interface ReporteSeguimientoProps {
  cajones: Cajon[];
  pedidos: Pedido[];
  gastos: Gasto[];
}

export function ReporteSeguimiento({ cajones, pedidos, gastos }: ReporteSeguimientoProps) {
  const [periodo, setPeriodo] = useState<Periodo>('mes');

  const now = new Date();
  const desde = new Date(now);
  if (periodo === 'semana') {
    desde.setDate(now.getDate() - 7);
  } else {
    desde.setDate(1);
    desde.setHours(0, 0, 0, 0);
  }

  const inRange = (fecha: string | Date) => new Date(fecha) >= desde;

  const ventas = pedidos
    .filter((p) => p.estado === 'ENTREGADO' && inRange(p.fechaPedido))
    .reduce((acc, p) => acc + p.precioTotal, 0);

  const gastoCajones = cajones
    .filter((c) => inRange(c.fecha))
    .reduce((acc, c) => acc + c.costoTotal, 0);

  const gastoInsumos = gastos
    .filter((g) => inRange(g.fecha))
    .reduce((acc, g) => acc + g.monto, 0);

  const totalEgresos = gastoCajones + gastoInsumos;
  const balancePeriodo = ventas - totalEgresos;
  const positivo = balancePeriodo >= 0;

  const maxVal = Math.max(ventas, gastoCajones, gastoInsumos, 1);
  const pct = (v: number) => `${Math.round((v / maxVal) * 100)}%`;

  const labelPeriodo = periodo === 'semana' ? 'últimos 7 días' : 'este mes';

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5">
      {/* Header con toggle */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800">Seguimiento Financiero</h3>
          <p className="text-[11px] text-slate-400 mt-0.5">{labelPeriodo}</p>
        </div>
        <div className="flex bg-slate-100 rounded-lg p-0.5 text-[11px] font-semibold">
          <button
            onClick={() => setPeriodo('semana')}
            className={`px-3 py-1.5 rounded-md transition ${
              periodo === 'semana'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriodo('mes')}
            className={`px-3 py-1.5 rounded-md transition ${
              periodo === 'mes'
                ? 'bg-white text-slate-800 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            Mes
          </button>
        </div>
      </div>

      {/* Barras */}
      <div className="space-y-3">
        {/* Ventas */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Ventas cobradas
            </span>
            <span className="text-xs font-bold text-emerald-700">{formatCurrency(ventas)}</span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: ventas > 0 ? pct(ventas) : '0%' }}
            />
          </div>
        </div>

        {/* Gasto cajones */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block" />
              Cajones de pollo
            </span>
            <span className="text-xs font-bold text-orange-600">
              {formatCurrency(gastoCajones)}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-orange-400 rounded-full transition-all duration-500"
              style={{ width: gastoCajones > 0 ? pct(gastoCajones) : '0%' }}
            />
          </div>
        </div>

        {/* Gasto insumos */}
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-xs text-slate-600 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Insumos / Gastos
            </span>
            <span className="text-xs font-bold text-rose-600">
              {formatCurrency(gastoInsumos)}
            </span>
          </div>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-rose-500 rounded-full transition-all duration-500"
              style={{ width: gastoInsumos > 0 ? pct(gastoInsumos) : '0%' }}
            />
          </div>
        </div>
      </div>

      {/* Balance del período */}
      <div
        className={`mt-4 pt-3 border-t flex items-center justify-between ${
          positivo ? 'border-emerald-100' : 'border-rose-100'
        }`}
      >
        <span className="text-xs text-slate-500 font-medium">Balance del período</span>
        <span className={`text-sm font-extrabold ${positivo ? 'text-emerald-700' : 'text-rose-700'}`}>
          {balancePeriodo >= 0 ? '+' : ''}
          {formatCurrency(balancePeriodo)}
        </span>
      </div>

      {ventas === 0 && gastoCajones === 0 && gastoInsumos === 0 && (
        <p className="text-xs text-slate-400 text-center mt-3">
          Sin registros en {labelPeriodo}
        </p>
      )}
    </div>
  );
}
