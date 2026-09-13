
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { Modal } from '../ui/Modal';
import { useAppData } from '../../hooks/useAppData';
import { useModal } from '../../hooks/useModal';
import { AlertTriangle, Loader2 } from 'lucide-react';
import type { StockPorTipo } from '@todopolloyplus/shared';

/**
 * AppDataContext — shared across all child routes via Outlet context
 */
export interface AppDataContextType {
  stockActual: number;
  stockPorTipo: StockPorTipo[];
  cajones: ReturnType<typeof useAppData>['cajones'];
  pedidos: ReturnType<typeof useAppData>['pedidos'];
  gastos: ReturnType<typeof useAppData>['gastos'];
  totalVentas: number;
  totalGastos: number;
  pedidosPendientesCount: number;
  fetchAll: () => Promise<void>;
  showAlert: ReturnType<typeof useModal>['showAlert'];
  showConfirm: ReturnType<typeof useModal>['showConfirm'];
}

export function Layout() {
  const {
    stockActual,
    stockPorTipo,
    cajones,
    pedidos,
    gastos,
    loading,
    error,
    fetchAll,
    totalVentas,
    totalGastos,
    pedidosPendientesCount,
  } = useAppData();

  const { modal, showAlert, showConfirm } = useModal();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex flex-col items-center gap-3 text-slate-500">
          <Loader2 size={40} className="animate-spin text-amber-500" />
          <p className="font-semibold text-sm">Conectando con el servidor...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-rose-200 p-8 max-w-sm w-full text-center">
          <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={28} className="text-rose-500" />
          </div>
          <h2 className="text-lg font-bold text-slate-800 mb-2">Sin conexión al backend</h2>
          <p className="text-sm text-slate-500 mb-5">{error}</p>
          <button
            onClick={fetchAll}
            className="bg-amber-500 hover:bg-amber-600 text-white font-bold px-6 py-3 rounded-xl transition w-full"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  const context: AppDataContextType = {
    stockActual,
    stockPorTipo,
    cajones,
    pedidos,
    gastos,
    totalVentas,
    totalGastos,
    pedidosPendientesCount,
    fetchAll,
    showAlert,
    showConfirm,
  };

  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 w-full overflow-hidden font-sans text-slate-800">
      <Sidebar pedidosPendientesCount={pedidosPendientesCount} />

      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        <Header stockActual={stockActual} />

        <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 space-y-4 md:space-y-6 overflow-y-auto w-full max-w-6xl mx-auto">
          {/* Child routes receive shared data via useOutletContext() */}
          <Outlet context={context} />
        </main>

        <BottomNav pedidosPendientesCount={pedidosPendientesCount} />
      </div>

      <Modal modal={modal} />
    </div>
  );
}
