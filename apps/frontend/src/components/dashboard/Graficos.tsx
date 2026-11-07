import { useMemo, useState } from 'react';
import type { Cajon, Pedido, Gasto, StockPorTipo, TipoHamburguesa } from '@todopolloyplus/shared';
import {
  formatCurrency,
  getCategoriaGastoLabel,
  getTipoHamburguesaLabel,
  getTipoHamburguesaEmoji,
  TIPOS_HAMBURGUESA,
} from '@todopolloyplus/shared';

interface GraficosProps {
  cajones: Cajon[];
  pedidos: Pedido[];
  gastos: Gasto[];
  stockPorTipo: StockPorTipo[];
  reservadoPorTipo: Record<TipoHamburguesa, number>;
}

const COLORES_TIPO: Record<TipoHamburguesa, string> = {
  JAMON_QUESO: '#f59e0b',
  ESPINACA_QUESO: '#10b981',
  ZANAHORIA_QUESO: '#f97316',
};

const dayKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const compact = (n: number) =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(Math.round(n));

function Card({ title, subtitle, children, right }: { title: string; subtitle?: string; children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4 md:p-5">
      <div className="flex items-start justify-between mb-3 gap-2">
        <div>
          <h3 className="text-sm font-bold text-slate-800">{title}</h3>
          {subtitle && <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

export function Graficos({ cajones, pedidos, gastos, stockPorTipo, reservadoPorTipo }: GraficosProps) {
  const [dias, setDias] = useState<7 | 30>(7);

  const entregados = useMemo(() => pedidos.filter((p) => p.estado === 'ENTREGADO'), [pedidos]);

  // ── KPIs ────────────────────────────────────────────────────
  const kpis = useMemo(() => {
    const ventas = entregados.reduce((s, p) => s + p.precioTotal, 0);
    const unidadesVendidas = entregados.reduce((s, p) => s + p.cantidadHamburguesas, 0);
    const costoCajones = cajones.reduce((s, c) => s + c.costoTotal, 0);
    const totalGastos = gastos.reduce((s, g) => s + g.monto, 0);
    const egresos = costoCajones + totalGastos;
    const unidadesProducidas = cajones.reduce((s, c) => s + (c.unidadesRendidas ?? 0), 0);
    const cajonesConRendimiento = cajones.filter((c) => (c.unidadesRendidas ?? 0) > 0);
    const costoConRendimiento = cajonesConRendimiento.reduce((s, c) => s + c.costoTotal, 0);
    return {
      ticketPromedio: entregados.length ? ventas / entregados.length : 0,
      precioPorUnidad: unidadesVendidas ? ventas / unidadesVendidas : 0,
      costoPorUnidad: unidadesProducidas ? costoConRendimiento / unidadesProducidas : 0,
      margen: ventas > 0 ? ((ventas - egresos) / ventas) * 100 : null,
      unidadesVendidas,
      entregas: entregados.length,
    };
  }, [entregados, cajones, gastos]);

  // ── Evolución diaria (ventas vs egresos) ────────────────────
  const serie = useMemo(() => {
    const hoy = new Date();
    hoy.setHours(0, 0, 0, 0);
    const lista: { key: string; fecha: Date; ventas: number; egresos: number }[] = [];
    for (let i = dias - 1; i >= 0; i--) {
      const f = new Date(hoy);
      f.setDate(hoy.getDate() - i);
      lista.push({ key: dayKey(f), fecha: f, ventas: 0, egresos: 0 });
    }
    const idx = new Map(lista.map((d, i) => [d.key, i]));
    for (const p of entregados) {
      const i = idx.get(dayKey(new Date(p.fechaPedido)));
      if (i !== undefined) lista[i].ventas += p.precioTotal;
    }
    for (const c of cajones) {
      const i = idx.get(dayKey(new Date(c.fecha)));
      if (i !== undefined) lista[i].egresos += c.costoTotal;
    }
    for (const g of gastos) {
      const i = idx.get(dayKey(new Date(g.fecha)));
      if (i !== undefined) lista[i].egresos += g.monto;
    }
    return lista;
  }, [dias, entregados, cajones, gastos]);

  const maxSerie = Math.max(...serie.map((d) => Math.max(d.ventas, d.egresos)), 1);
  const totalSerieVentas = serie.reduce((s, d) => s + d.ventas, 0);
  const totalSerieEgresos = serie.reduce((s, d) => s + d.egresos, 0);

  // ── Ventas por tipo (donut) ─────────────────────────────────
  const ventasPorTipo = useMemo(() => {
    const m: Record<TipoHamburguesa, number> = { JAMON_QUESO: 0, ESPINACA_QUESO: 0, ZANAHORIA_QUESO: 0 };
    for (const p of entregados) for (const it of p.items ?? []) m[it.tipo as TipoHamburguesa] += it.cantidad;
    return m;
  }, [entregados]);
  const totalVendidasTipo = TIPOS_HAMBURGUESA.reduce((s, t) => s + ventasPorTipo[t], 0);

  // ── Gastos por categoría ────────────────────────────────────
  const gastosPorCategoria = useMemo(() => {
    const m = new Map<string, number>();
    for (const g of gastos) m.set(g.categoria, (m.get(g.categoria) ?? 0) + g.monto);
    const costoCajones = cajones.reduce((s, c) => s + c.costoTotal, 0);
    const filas = Array.from(m.entries()).map(([cat, monto]) => ({ label: getCategoriaGastoLabel(cat), monto, color: '#f43f5e' }));
    if (costoCajones > 0) filas.push({ label: 'Cajones de pollo', monto: costoCajones, color: '#fb923c' });
    return filas.sort((a, b) => b.monto - a.monto);
  }, [gastos, cajones]);
  const maxGasto = Math.max(...gastosPorCategoria.map((g) => g.monto), 1);

  // ── Donut geometry ──────────────────────────────────────────
  const R = 40;
  const C = 2 * Math.PI * R;
  let acumulado = 0;

  return (
    <div className="space-y-4 md:space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {[
          { label: 'Ticket promedio', value: formatCurrency(kpis.ticketPromedio), sub: `${kpis.entregas} entregas`, color: 'text-emerald-600' },
          { label: 'Precio por unidad', value: formatCurrency(kpis.precioPorUnidad), sub: `${kpis.unidadesVendidas} vendidas`, color: 'text-sky-600' },
          { label: 'Costo por unidad', value: formatCurrency(kpis.costoPorUnidad), sub: 'Solo cajones (sin insumos)', color: 'text-orange-500' },
          {
            label: 'Margen',
            value: kpis.margen === null ? '—' : `${kpis.margen.toFixed(0)}%`,
            sub: 'Ventas vs. todos los egresos',
            color: kpis.margen !== null && kpis.margen < 0 ? 'text-rose-600' : 'text-emerald-700',
          },
        ].map((k) => (
          <div key={k.label} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">{k.label}</span>
            <div className={`text-lg md:text-2xl font-bold mt-1 ${k.color}`}>{k.value}</div>
            <div className="text-[11px] text-slate-400 mt-1">{k.sub}</div>
          </div>
        ))}
      </div>

      {/* Evolución diaria */}
      <Card
        title="Ventas vs. Egresos"
        subtitle={`Por día · últimos ${dias} días`}
        right={
          <div className="flex bg-slate-100 rounded-lg p-0.5 text-[11px] font-semibold">
            {([7, 30] as const).map((d) => (
              <button
                key={d}
                onClick={() => setDias(d)}
                className={`px-3 py-1.5 rounded-md transition ${dias === d ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'}`}
              >
                {d} días
              </button>
            ))}
          </div>
        }
      >
        <div className="flex gap-4 text-[11px] mb-2">
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Ventas <b className="text-emerald-700">{formatCurrency(totalSerieVentas)}</b>
          </span>
          <span className="flex items-center gap-1.5 text-slate-600">
            <span className="w-2.5 h-2.5 rounded-sm bg-rose-400" /> Egresos <b className="text-rose-600">{formatCurrency(totalSerieEgresos)}</b>
          </span>
        </div>
        {totalSerieVentas === 0 && totalSerieEgresos === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8">Sin movimientos en este período</p>
        ) : (
          <svg viewBox="0 0 300 140" className="w-full h-auto" role="img" aria-label="Ventas vs egresos por día">
            {[0, 0.5, 1].map((f) => (
              <g key={f}>
                <line x1="28" x2="300" y1={110 - f * 100} y2={110 - f * 100} stroke="#e2e8f0" strokeWidth="0.5" />
                <text x="25" y={113 - f * 100} fontSize="7" textAnchor="end" fill="#94a3b8">
                  {compact(maxSerie * f)}
                </text>
              </g>
            ))}
            {serie.map((d, i) => {
              const slot = 272 / serie.length;
              const x = 28 + i * slot;
              const bw = Math.max(slot * 0.38, 1.5);
              const hV = (d.ventas / maxSerie) * 100;
              const hE = (d.egresos / maxSerie) * 100;
              const mostrarLabel = dias === 7 || i % 5 === 0 || i === serie.length - 1;
              return (
                <g key={d.key}>
                  <title>{`${d.fecha.toLocaleDateString('es-AR')} — Ventas ${formatCurrency(d.ventas)} · Egresos ${formatCurrency(d.egresos)}`}</title>
                  <rect x={x + slot * 0.08} y={110 - hV} width={bw} height={hV} rx="1" fill="#10b981" />
                  <rect x={x + slot * 0.08 + bw + 0.5} y={110 - hE} width={bw} height={hE} rx="1" fill="#fb7185" />
                  {mostrarLabel && (
                    <text x={x + slot / 2} y="124" fontSize="6.5" textAnchor="middle" fill="#94a3b8">
                      {dias === 7
                        ? d.fecha.toLocaleDateString('es-AR', { weekday: 'short' }).replace('.', '')
                        : `${d.fecha.getDate()}/${d.fecha.getMonth() + 1}`}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        )}
      </Card>

      <div className="md:grid md:grid-cols-2 md:gap-5 space-y-4 md:space-y-0">
        {/* Stock libre vs reservado */}
        <Card title="Stock por tipo" subtitle="Libre vs. reservado en pedidos pendientes">
          <div className="space-y-3">
            {TIPOS_HAMBURGUESA.map((tipo) => {
              const stock = stockPorTipo.find((s) => s.tipo === tipo)?.cantidadActual ?? 0;
              const reservado = reservadoPorTipo[tipo] ?? 0;
              const reservadoVisible = Math.min(reservado, stock);
              const libre = stock - reservadoVisible;
              const faltante = Math.max(reservado - stock, 0);
              const base = Math.max(stock, reservado, 1);
              return (
                <div key={tipo}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-slate-700">
                      {getTipoHamburguesaEmoji(tipo)} {getTipoHamburguesaLabel(tipo)}
                    </span>
                    <span className="text-slate-500">
                      <b className="text-slate-800">{stock}</b> en stock
                    </span>
                  </div>
                  <div className="h-3 bg-slate-100 rounded-full overflow-hidden flex">
                    <div className="h-full bg-emerald-500 transition-all duration-500" style={{ width: `${(libre / base) * 100}%` }} />
                    <div className="h-full bg-amber-400 transition-all duration-500" style={{ width: `${(reservadoVisible / base) * 100}%` }} />
                    <div className="h-full bg-rose-500 transition-all duration-500" style={{ width: `${(faltante / base) * 100}%` }} />
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    Libre {libre} · Reservado {reservado}
                    {faltante > 0 && <span className="text-rose-600 font-semibold"> · Faltan {faltante}</span>}
                  </p>
                </div>
              );
            })}
            <div className="flex gap-3 text-[10px] text-slate-500 pt-1">
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-emerald-500" />Libre</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-amber-400" />Reservado</span>
              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm bg-rose-500" />Faltante</span>
            </div>
          </div>
        </Card>

        {/* Donut ventas por tipo */}
        <Card title="Ventas por tipo" subtitle="Hamburguesas entregadas (histórico)">
          {totalVendidasTipo === 0 ? (
            <p className="text-xs text-slate-400 text-center py-8">Todavía no hay entregas</p>
          ) : (
            <div className="flex items-center gap-4">
              <svg viewBox="0 0 100 100" className="w-32 h-32 shrink-0 -rotate-90">
                <circle cx="50" cy="50" r={R} fill="none" stroke="#f1f5f9" strokeWidth="16" />
                {TIPOS_HAMBURGUESA.map((tipo) => {
                  const largo = (ventasPorTipo[tipo] / totalVendidasTipo) * C;
                  const el = (
                    <circle
                      key={tipo}
                      cx="50"
                      cy="50"
                      r={R}
                      fill="none"
                      stroke={COLORES_TIPO[tipo]}
                      strokeWidth="16"
                      strokeDasharray={`${largo} ${C - largo}`}
                      strokeDashoffset={-acumulado}
                    />
                  );
                  acumulado += largo;
                  return el;
                })}
              </svg>
              <div className="space-y-2 flex-1 min-w-0">
                {TIPOS_HAMBURGUESA.map((tipo) => (
                  <div key={tipo} className="flex items-center justify-between text-xs gap-2">
                    <span className="flex items-center gap-1.5 text-slate-600 truncate">
                      <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORES_TIPO[tipo] }} />
                      {getTipoHamburguesaLabel(tipo)}
                    </span>
                    <span className="font-bold text-slate-800 whitespace-nowrap">
                      {ventasPorTipo[tipo]} <span className="text-slate-400 font-medium">({Math.round((ventasPorTipo[tipo] / totalVendidasTipo) * 100)}%)</span>
                    </span>
                  </div>
                ))}
                <p className="text-[11px] text-slate-400 pt-1">Total: {totalVendidasTipo} unidades</p>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Egresos por categoría */}
      <Card title="¿En qué se va la plata?" subtitle="Egresos por categoría (histórico)">
        {gastosPorCategoria.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">Sin egresos registrados</p>
        ) : (
          <div className="space-y-2.5">
            {gastosPorCategoria.map((g) => (
              <div key={g.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-600 font-medium">{g.label}</span>
                  <span className="font-bold text-slate-800">{formatCurrency(g.monto)}</span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500" style={{ width: `${(g.monto / maxGasto) * 100}%`, background: g.color }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

