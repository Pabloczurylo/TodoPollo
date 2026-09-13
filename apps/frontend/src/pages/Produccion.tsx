import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Layers, Plus, Edit3, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate } from '@todopolloyplus/shared';
import { crearCajon, actualizarUnidadesCajon, eliminarCajon } from '../api/client';
import type { AppDataContextType } from '../components/layout/Layout';

export function Produccion() {
  const { cajones, fetchAll, showAlert, showConfirm } = useOutletContext<AppDataContextType>();

  const [nuevoCajonCosto, setNuevoCajonCosto] = useState('');
  const [nuevoCajonFecha, setNuevoCajonFecha] = useState(new Date().toISOString().slice(0, 10));
  const [nuevoCajonProveedor, setNuevoCajonProveedor] = useState('');
  const [editandoUnidades, setEditandoUnidades] = useState<string | null>(null);
  const [unidadesEdit, setUnidadesEdit] = useState('');

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
      showAlert('¡Cajón Registrado!', 'Ingresá las hamburguesas rendidas cuando estén listas.', 'success');
    } catch (err: unknown) {
      showAlert('Error', err instanceof Error ? err.message : 'No se pudo registrar el cajón.', 'error');
    }
  };

  const handleActualizarUnidades = async (id: string) => {
    const unidades = parseInt(unidadesEdit);
    if (!unidades || unidades <= 0) return;
    try {
      await actualizarUnidadesCajon(id, unidades);
      await fetchAll();
      setEditandoUnidades(null);
      setUnidadesEdit('');
    } catch (err: unknown) {
      showAlert('Error', err instanceof Error ? err.message : 'No se pudo actualizar el cajón.', 'error');
    }
  };

  const handleEliminarCajon = (id: string) => {
    const c = cajones.find((x) => x.id === id);
    if (!c) return;
    showConfirm(
      '¿Eliminar Cajón?',
      `Vas a eliminar el cajón de ${formatCurrency(c.costoTotal)}${c.proveedor ? ` (${c.proveedor})` : ''}. Esta acción no se puede deshacer.`,
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
          {cajones.map((c) => (
            <div key={c.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-xs font-bold text-slate-700">{formatCurrency(c.costoTotal)}</p>
                  <p className="text-[11px] text-slate-500">
                    {c.proveedor || 'Sin proveedor'} • {formatDate(String(c.fecha))}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {c.unidadesRendidas != null ? (
                    <div className="text-right">
                      <p className="text-xs font-bold text-emerald-700">{c.unidadesRendidas} hamburguesas</p>
                      <button
                        onClick={() => { setEditandoUnidades(c.id); setUnidadesEdit(String(c.unidadesRendidas)); }}
                        className="text-[10px] text-slate-400 hover:text-amber-600 flex items-center gap-0.5 ml-auto transition"
                      >
                        <Edit3 size={10} /> editar
                      </button>
                    </div>
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

              {/* Edición inline de hamburguesas rendidas */}
              {editandoUnidades === c.id ? (
                <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
                  <input
                    type="number"
                    value={unidadesEdit}
                    onChange={(e) => setUnidadesEdit(e.target.value)}
                    placeholder="Cantidad de hamburguesas"
                    className="flex-1 text-sm font-semibold px-3 py-2 rounded-lg border border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    autoFocus
                  />
                  <button
                    onClick={() => handleActualizarUnidades(c.id)}
                    className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                  >
                    Guardar
                  </button>
                  <button
                    onClick={() => setEditandoUnidades(null)}
                    className="text-slate-400 hover:text-slate-600 text-xs px-2 py-2 rounded-lg transition"
                  >
                    ✕
                  </button>
                </div>
              ) : c.unidadesRendidas == null ? (
                <button
                  onClick={() => { setEditandoUnidades(c.id); setUnidadesEdit(''); }}
                  className="w-full border border-dashed border-amber-400 text-amber-600 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-amber-50 transition"
                >
                  <Plus size={14} /> Ingresar hamburguesas rendidas
                </button>
              ) : null}
            </div>
          ))}
          {cajones.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No hay cajones registrados aún</p>
          )}
        </div>
      </div>
    </div>
  );
}
