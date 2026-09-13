import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Receipt, Plus, Edit3, Trash2 } from 'lucide-react';
import { formatCurrency, formatDate, getCategoriaGastoLabel } from '@todopolloyplus/shared';
import type { CategoriaGasto } from '@todopolloyplus/shared';
import { crearGasto, eliminarGasto, actualizarGasto } from '../api/client';
import type { AppDataContextType } from '../components/layout/Layout';

export function Gastos() {
  const { gastos, fetchAll, showAlert, showConfirm } = useOutletContext<AppDataContextType>();

  const [concepto, setConcepto] = useState('');
  const [monto, setMonto] = useState('');
  const [categoria, setCategoria] = useState<CategoriaGasto>('SEPARADORES_BOLSAS');

  // Estado para edición inline
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [editConcepto, setEditConcepto] = useState('');
  const [editMonto, setEditMonto] = useState('');
  const [editCategoria, setEditCategoria] = useState<CategoriaGasto>('SEPARADORES_BOLSAS');

  const handleRegistrarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    const montoNum = parseFloat(monto);
    if (!concepto || !montoNum) return;
    try {
      await crearGasto({ concepto, monto: montoNum, categoria });
      await fetchAll();
      setConcepto('');
      setMonto('');
      showAlert('Gasto Registrado', '¡El gasto se guardó con éxito!', 'success');
    } catch (err: unknown) {
      showAlert('Error', err instanceof Error ? err.message : 'No se pudo registrar el gasto.', 'error');
    }
  };

  const startEditar = (id: string) => {
    const g = gastos.find((x) => x.id === id);
    if (!g) return;
    setEditandoId(id);
    setEditConcepto(g.concepto);
    setEditMonto(String(g.monto));
    setEditCategoria(g.categoria as CategoriaGasto);
  };

  const handleGuardarEdicion = async (id: string) => {
    const montoNum = parseFloat(editMonto);
    if (!editConcepto || !montoNum) return;
    try {
      await actualizarGasto(id, { concepto: editConcepto, monto: montoNum, categoria: editCategoria });
      await fetchAll();
      setEditandoId(null);
      showAlert('Gasto Actualizado', 'El gasto fue modificado con éxito.', 'success');
    } catch (err: unknown) {
      showAlert('Error', err instanceof Error ? err.message : 'No se pudo actualizar el gasto.', 'error');
    }
  };

  const handleEliminarGasto = (id: string) => {
    const g = gastos.find((x) => x.id === id);
    if (!g) return;
    showConfirm(
      '¿Eliminar Gasto?',
      `Vas a eliminar el gasto "${g.concepto}" de ${formatCurrency(g.monto)}. Esta acción no se puede deshacer.`,
      async () => {
        try {
          await eliminarGasto(id);
          await fetchAll();
          showAlert('Gasto Eliminado', 'El gasto fue eliminado correctamente.', 'success');
        } catch (err: unknown) {
          showAlert('Error', err instanceof Error ? err.message : 'No se pudo eliminar el gasto.', 'error');
        }
      }
    );
  };

  return (
    <div className="md:grid md:grid-cols-2 md:gap-8 items-start space-y-4 md:space-y-0">
      {/* Formulario nuevo gasto */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
        <div className="flex items-center gap-2 mb-3">
          <Receipt className="text-rose-500" size={20} />
          <h2 className="font-bold text-slate-800 text-sm">Registrar Gasto Operativo</h2>
        </div>

        <form onSubmit={handleRegistrarGasto} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Concepto</label>
            <input
              type="text"
              value={concepto}
              onChange={(e) => setConcepto(e.target.value)}
              placeholder="Ej: Separadores x2000, Bolsas 20x30, Pimienta"
              className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Monto ($)</label>
              <input
                type="number"
                value={monto}
                onChange={(e) => setMonto(e.target.value)}
                placeholder="Ej: 15000"
                className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Categoría</label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value as CategoriaGasto)}
                className="w-full text-xs px-2.5 py-2.5 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
              >
                <option value="SEPARADORES_BOLSAS">Separadores/Bolsas</option>
                <option value="CONDIMENTOS_INSUMOS">Condimentos/Insumos</option>
                <option value="SERVICIOS_LUZ_GAS">Servicios (Luz/Gas)</option>
                <option value="ENVIO_LOGISTICA">Envíos</option>
                <option value="OTROS">Otros</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-rose-500 hover:bg-rose-600 text-white font-bold py-3 rounded-lg shadow active:scale-[0.98] transition flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            <span>Registrar Gasto</span>
          </button>
        </form>
      </div>

      {/* Listado de Gastos */}
      <div className="bg-white/50 p-1 rounded-2xl md:bg-transparent md:p-0">
        <h3 className="text-xs md:text-sm font-bold uppercase tracking-wider text-slate-400 mb-3 px-1">
          Historial de Gastos
        </h3>
        <div className="space-y-2">
          {gastos.map((g) => (
            <div
              key={g.id}
              className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm space-y-2.5"
            >
              {/* Vista normal */}
              {editandoId !== g.id ? (
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-xs font-bold text-slate-800">{g.concepto}</p>
                    <p className="text-[10px] text-slate-500">
                      {getCategoriaGastoLabel(g.categoria)} • {formatDate(g.fecha)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-rose-600">-{formatCurrency(g.monto)}</span>
                    <button
                      onClick={() => startEditar(g.id)}
                      className="text-slate-400 hover:text-rose-500 p-1 rounded-lg hover:bg-rose-50 transition"
                      title="Editar gasto"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button
                      onClick={() => handleEliminarGasto(g.id)}
                      className="text-slate-400 hover:text-rose-600 p-1 rounded-lg hover:bg-rose-50 transition"
                      title="Eliminar gasto"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ) : (
                /* Edición inline */
                <div className="space-y-2">
                  <input
                    type="text"
                    value={editConcepto}
                    onChange={(e) => setEditConcepto(e.target.value)}
                    className="w-full text-sm px-3 py-2 rounded-lg border border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    autoFocus
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="number"
                      value={editMonto}
                      onChange={(e) => setEditMonto(e.target.value)}
                      className="text-sm px-3 py-2 rounded-lg border border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    />
                    <select
                      value={editCategoria}
                      onChange={(e) => setEditCategoria(e.target.value as CategoriaGasto)}
                      className="text-xs px-2.5 py-2 rounded-lg border border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-500 bg-white"
                    >
                      <option value="SEPARADORES_BOLSAS">Separadores/Bolsas</option>
                      <option value="CONDIMENTOS_INSUMOS">Condimentos/Insumos</option>
                      <option value="SERVICIOS_LUZ_GAS">Servicios (Luz/Gas)</option>
                      <option value="ENVIO_LOGISTICA">Envíos</option>
                      <option value="OTROS">Otros</option>
                    </select>
                  </div>
                  <div className="flex gap-2 pt-1 border-t border-slate-100">
                    <button
                      onClick={() => handleGuardarEdicion(g.id)}
                      className="flex-1 bg-rose-500 hover:bg-rose-600 text-white text-xs font-bold px-3 py-2 rounded-lg transition"
                    >
                      Guardar
                    </button>
                    <button
                      onClick={() => setEditandoId(null)}
                      className="text-slate-400 hover:text-slate-600 text-xs px-3 py-2 rounded-lg transition"
                    >
                      ✕ Cancelar
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {gastos.length === 0 && (
            <p className="text-xs text-slate-400 text-center py-4">No hay gastos registrados aún</p>
          )}
        </div>
      </div>
    </div>
  );
}
