import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Layers, Plus, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, getTipoHamburguesaLabel, getTipoHamburguesaEmoji, TIPOS_HAMBURGUESA } from '@todopolloyplus/shared';
import type { TipoHamburguesa } from '@todopolloyplus/shared';
import { crearCajon, registrarRendimientoCajon, eliminarCajon } from '../api/client';
import type { AppDataContextType } from '../components/layout/Layout';

type DistribucionPorTipo = Record<TipoHamburguesa, string>;

const distribucionVacia = (): DistribucionPorTipo => ({
  JAMON_QUESO: '',
  ESPINACA_QUESO: '',
  ZANAHORIA_QUESO: '',
});

export function Produccion() {
  const { cajones, fetchAll, showAlert, showConfirm } = useOutletContext<AppDataContextType>();

  const [nuevoCajonCosto, setNuevoCajonCosto] = useState('');
  const [nuevoCajonFecha, setNuevoCajonFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nuevoCajonProveedor, setNuevoCajonProveedor] = useState('');

  // Estado para el panel de rendimiento por tipo
  const [registrandoRendimientoId, setRegistrandoRendimientoId] = useState<string | null>(null);
  const [distribucion, setDistribucion] = useState<DistribucionPorTipo>(distribucionVacia());

  const handleRegistrarCajon = async (e: React.FormEvent) => {
    e.preventDefault();
    const costo = parseFloat(nuevoCajonCosto);
    if (!costo || !nuevoCajonFecha) return;
    try {
      await crearCajon({
        costoTotal: costo,
        fecha: nuevoCajonFecha,
        proveedor: nuevoCajonProveedor || undefined,
      });
      await fetchAll();
      setNuevoCajonCosto('');
      setNuevoCajonProveedor('');
      showAlert('¡Cajón Registrado!', 'Ahora ingresá cuántas hamburguesas de cada tipo salieron del cajón.', 'success');
    } catch (err: unknown) {
      showAlert('Error', err instanceof Error ? err.message : 'No se pudo registrar el cajón.', 'error');
    }
  };

  const abrirRendimiento = (cajonId: string) => {
    const cajon = cajones.find((c) => c.id === cajonId);
    if (!cajon) return;
    // Si ya tiene rendimiento, pre-cargar los valores
    const prevDistribucion = distribucionVacia();
    if (cajon.rendimientoPorTipo) {
      for (const r of cajon.rendimientoPorTipo) {
        prevDistribucion[r.tipo as TipoHamburguesa] = String(r.cantidad);
      }
    }
    setDistribucion(prevDistribucion);
    setRegistrandoRendimientoId(cajonId);
  };

  const handleGuardarRendimiento = async (cajonId: string) => {
    const distribucionNum: Record<TipoHamburguesa, number> = {
      JAMON_QUESO: 0,
      ESPINACA_QUESO: 0,
      ZANAHORIA_QUESO: 0,
    };
    for (const tipo of TIPOS_HAMBURGUESA) {
      distribucionNum[tipo] = parseInt(distribucion[tipo]) || 0;
    }
    const total = Object.values(distribucionNum).reduce((s, n) => s + n, 0);
    if (total <= 0) {
      showAlert('Error', 'Ingresá al menos una hamburguesa en algún tipo.', 'error');
      return;
    }
    try {
      await registrarRendimientoCajon(cajonId, distribucionNum);
      await fetchAll();
      setRegistrandoRendimientoId(null);
      setDistribucion(distribucionVacia());
      showAlert('¡Rendimiento Guardado!', `Se registraron ${total} hamburguesas en stock.`, 'success');
    } catch (err: unknown) {
      showAlert('Error', err instanceof Error ? err.message : 'No se pudo actualizar el cajón.', 'error');
    }
  };

  const handleEliminarCajon = (id: string) => {
    const c = cajones.find((x) => x.id === id);
    if (!c) return;
    showConfirm(
      '¿Eliminar Cajón?',
      `Vas a eliminar el cajón de ${formatCurrency(c.costoTotal)}${c.proveedor ? ` (${c.proveedor})` : ''}. Si tenía rendimiento registrado, se descontará del stock. Esta acción no se puede deshacer.`,
      async () => {
        try {
          await eliminarCajon(id);
          await fetchAll();
          showAlert('Cajón Eliminado', 'El cajón fue eliminado correctamente.', 'success');
        } catch (err: unknown) {
          showAlert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el cajón.', 'error');
        }
      }
    );
  };

  return (
    <div className="md:grid md:grid-cols-2 md:gap-8 items-start space-y-4 md:space-y-0">
      {/* Formulario de registro de Cajón */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Layers className="text-amber-500" size={20} />
          <h2 className="font-bold text-slate-800 text-sm">Ingreso de Cajón de Pechugas</h2>
        </div>

        <form onSubmit={handleRegistrarCajon} className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Precio del Cajón ($)
              </label>
              <input
                type="number"
                value={nuevoCajonCosto}
                onChange={(e) => setNuevoCajonCosto(e.target.value)}
                placeholder="Ej: 95000"
                className="w-full text-base font-semibold px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">
                Fecha de Compra
              </label>
              <input
                type="date"
                value={nuevoCajonFecha}
                onChange={(e) => setNuevoCajonFecha(e.target.value)}
                className="w-full text-sm px-3 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">
              Proveedor / Notas (Opcional)
            </label>
            <input
              type="text"
              value={nuevoCajonProveedor}
              onChange={(e) => setNuevoCajonProveedor(e.target.value)}
              placeholder="Ej: Avícola Sur"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-3 rounded-lg shadow active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Registrar Cajón</span>
          </button>
        </form>
      </div>

      {/* Listado de Cajones */}
      <div className="bg-white/50 p-1 rounded-2xl md:bg-transparent md:p-0">
        <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Cajones Registrados
        </h3>
        <div className="space-y-2">
          {cajones.map((c) => {
            const totalRendido = c.unidadesRendidas ?? 0;
            const tieneRendimiento = totalRendido > 0;
            const estaRegistrando = registrandoRendimientoId === c.id;

            return (
              <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
                {/* Cabecera del cajón */}
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-bold text-slate-700">{formatCurrency(c.costoTotal)}</p>
                    <p className="text-[11px] text-slate-500">
                      {c.proveedor || 'Sin proveedor'} • {formatDate(String(c.fecha))}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {tieneRendimiento ? (
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        {totalRendido} unid.
                      </span>
                    ) : (
                      <span className="text-[10px] bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">
                        Sin rendimiento
                      </span>
                    )}
                    <button
                      onClick={() => handleEliminarCajon(c.id)}
                      className="text-slate-300 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition"
                      title="Eliminar cajón"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Breakdown por tipo (si ya tiene rendimiento) */}
                {tieneRendimiento && !estaRegistrando && c.rendimientoPorTipo && c.rendimientoPorTipo.length > 0 && (
                  <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-slate-100">
                    {c.rendimientoPorTipo.map((r) => (
                      <div key={r.tipo} className="bg-slate-50 rounded-lg px-2 py-1.5 text-center">
                        <p className="text-base leading-none">{getTipoHamburguesaEmoji(r.tipo as TipoHamburguesa)}</p>
                        <p className="text-xs font-bold text-slate-700 mt-0.5">{r.cantidad}</p>
                        <p className="text-[9px] text-slate-400 leading-tight">{getTipoHamburguesaLabel(r.tipo as TipoHamburguesa)}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Panel de registro/edición de rendimiento */}
                {estaRegistrando ? (
                  <div className="space-y-2 pt-2 border-t border-amber-200">
                    <p className="text-xs font-semibold text-amber-700">Hamburguesas producidas por tipo:</p>
                    {TIPOS_HAMBURGUESA.map((tipo) => (
                      <div key={tipo} className="flex items-center gap-2">
                        <span className="text-lg w-7 text-center">{getTipoHamburguesaEmoji(tipo)}</span>
                        <span className="flex-1 text-xs text-slate-700 font-medium">{getTipoHamburguesaLabel(tipo)}</span>
                        <input
                          type="number"
                          min="0"
                          value={distribucion[tipo]}
                          onChange={(e) => setDistribucion((prev) => ({ ...prev, [tipo]: e.target.value }))}
                          placeholder="0"
                          className="w-20 text-sm font-semibold text-center px-2 py-1.5 rounded-lg border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                        />
                      </div>
                    ))}
                    {/* Total calculado */}
                    <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-t border-slate-100 pt-1.5">
                      <span>Total:</span>
                      <span className="text-amber-700">
                        {TIPOS_HAMBURGUESA.reduce((s, t) => s + (parseInt(distribucion[t]) || 0), 0)} hamburguesas
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleGuardarRendimiento(c.id)}
                        className="flex-1 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                      >
                        Guardar
                      </button>
                      <button
                        onClick={() => { setRegistrandoRendimientoId(null); setDistribucion(distribucionVacia()); }}
                        className="text-slate-400 hover:text-slate-600 text-xs px-3 py-2 rounded-lg transition"
                      >
                        ✕ Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => abrirRendimiento(c.id)}
                    className={`w-full border border-dashed text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                      tieneRendimiento
                        ? 'border-slate-300 text-slate-500 hover:bg-slate-50'
                        : 'border-amber-400 text-amber-600 hover:bg-amber-50'
                    }`}
                  >
                    <Plus size={14} />
                    {tieneRendimiento ? 'Editar rendimiento por tipo' : 'Ingresar hamburguesas rendidas por tipo'}
                  </button>
                )}
              </div>
            );
          })}
          {cajones.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No hay cajones registrados aún</p>
          )}
        </div>
      </div>
    </div>
  );
}
