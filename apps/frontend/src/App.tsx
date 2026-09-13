import React, { useState, useEffect, useCallback } from 'react';
import {
  Package,
  Layers,
  ShoppingBag,
  Receipt,
  Plus,
  TrendingUp,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
  ArrowUpRight,
  Edit3,
  Trash2,
  AlertTriangle,
  Info,
  X,
  Loader2,
} from 'lucide-react';
import {
  formatCurrency,
  formatDate,
  getEstadoPedidoLabel,
  getCategoriaGastoLabel,
  type Cajon,
  type Pedido,
  type Gasto,
  type CategoriaGasto,
} from '@todopolloyplus/shared';

const API_BASE = 'http://localhost:3001/api';

type Tab = 'stock' | 'produccion' | 'pedidos' | 'gastos';
type Periodo = 'semana' | 'mes';

// ── Componente de reporte de seguimiento ──────────────────────
function ReporteSeguimiento({
  cajones,
  pedidos,
  gastos,
  formatCurrency,
}: {
  cajones: Cajon[];
  pedidos: Pedido[];
  gastos: Gasto[];
  formatCurrency: (n: number) => string;
}) {
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
    .filter(p => p.estado === 'ENTREGADO' && inRange(p.fechaPedido))
    .reduce((acc, p) => acc + p.precioTotal, 0);

  const gastoCajones = cajones
    .filter(c => inRange(c.fecha))
    .reduce((acc, c) => acc + c.costoTotal, 0);

  const gastoInsumos = gastos
    .filter(g => inRange(g.fecha))
    .reduce((acc, g) => acc + g.monto, 0);

  const totalEgresos = gastoCajones + gastoInsumos;
  const balancePeriodo = ventas - totalEgresos;
  const positivo = balancePeriodo >= 0;

  // Barras proporcionales
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
            className={`px-3 py-1.5 rounded-md transition ${periodo === 'semana' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Semana
          </button>
          <button
            onClick={() => setPeriodo('mes')}
            className={`px-3 py-1.5 rounded-md transition ${periodo === 'mes' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
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
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
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
              <span className="w-2 h-2 rounded-full bg-orange-400 inline-block"></span>
              Cajones de pollo
            </span>
            <span className="text-xs font-bold text-orange-600">{formatCurrency(gastoCajones)}</span>
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
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
              Insumos / Gastos
            </span>
            <span className="text-xs font-bold text-rose-600">{formatCurrency(gastoInsumos)}</span>
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
      <div className={`mt-4 pt-3 border-t flex items-center justify-between ${positivo ? 'border-emerald-100' : 'border-rose-100'}`}>
        <span className="text-xs text-slate-500 font-medium">
          Balance del período
        </span>
        <span className={`text-sm font-extrabold ${positivo ? 'text-emerald-700' : 'text-rose-700'}`}>
          {balancePeriodo >= 0 ? '+' : ''}{formatCurrency(balancePeriodo)}
        </span>
      </div>

      {ventas === 0 && gastoCajones === 0 && gastoInsumos === 0 && (
        <p className="text-xs text-slate-400 text-center mt-3">Sin registros en {labelPeriodo}</p>
      )}
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('stock');

  // --- Estado de datos desde la API ---
  const [stockActual, setStockActual] = useState(0);
  const [cajones, setCajones] = useState<Cajon[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- Carga de datos desde la API ---
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockRes, cajonesRes, pedidosRes, gastosRes] = await Promise.all([
        fetch(`${API_BASE}/stock`),
        fetch(`${API_BASE}/cajones`),
        fetch(`${API_BASE}/pedidos`),
        fetch(`${API_BASE}/gastos`),
      ]);
      const [stockData, cajonesData, pedidosData, gastosData] = await Promise.all([
        stockRes.json(),
        cajonesRes.json(),
        pedidosRes.json(),
        gastosRes.json(),
      ]);
      if (stockData.success) setStockActual(stockData.data.stock.cantidadActual);
      if (cajonesData.success) setCajones(cajonesData.data);
      if (pedidosData.success) setPedidos(pedidosData.data);
      if (gastosData.success) setGastos(gastosData.data);
    } catch {
      setError('No se pudo conectar con el servidor. ¿Está corriendo el backend en el puerto 3001?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // --- Modal ---
  interface ModalConfig {
    isOpen: boolean;
    title: string;
    message: string;
    type?: 'success' | 'warning' | 'error' | 'info';
    onConfirm?: () => void;
    onCancel?: () => void;
    confirmText?: string;
    cancelText?: string;
  }

  const [modal, setModal] = useState<ModalConfig>({ isOpen: false, title: '', message: '' });

  const showAlert = (title: string, message: string, type: 'success' | 'warning' | 'error' | 'info' = 'info') => {
    setModal({ isOpen: true, title, message, type, confirmText: 'Aceptar', onConfirm: () => setModal(prev => ({ ...prev, isOpen: false })) });
  };

  const showConfirm = (title: string, message: string, onConfirm: () => void) => {
    setModal({
      isOpen: true,
      title,
      message,
      type: 'warning',
      confirmText: 'Confirmar',
      cancelText: 'Cancelar',
      onConfirm,
      onCancel: () => setModal(prev => ({ ...prev, isOpen: false }))
    });
  };

  // --- Form states ---
  const [nuevoCajonCosto, setNuevoCajonCosto] = useState<string>('');
  const [nuevoCajonFecha, setNuevoCajonFecha] = useState<string>(new Date().toISOString().slice(0, 10));
  const [nuevoCajonProveedor, setNuevoCajonProveedor] = useState<string>('');
  const [editandoUnidades, setEditandoUnidades] = useState<string | null>(null);
  const [unidadesEdit, setUnidadesEdit] = useState<string>('');

  const [nuevoPedidoCliente, setNuevoPedidoCliente] = useState<string>('');
  const [nuevoPedidoCantidad, setNuevoPedidoCantidad] = useState<string>('');
  const [nuevoPedidoPrecio, setNuevoPedidoPrecio] = useState<string>('');
  const [nuevoPedidoFechaEntrega, setNuevoPedidoFechaEntrega] = useState<string>('');

  const [nuevoGastoConcepto, setNuevoGastoConcepto] = useState<string>('');
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState<string>('');
  const [nuevoGastoCategoria, setNuevoGastoCategoria] = useState<CategoriaGasto>('SEPARADORES_BOLSAS');

  // --- Cálculos derivados ---
  const totalVentas = pedidos
    .filter((p) => p.estado === 'ENTREGADO')
    .reduce((acc, p) => acc + p.precioTotal, 0);

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);
  const pedidosPendientesCount = pedidos.filter((p) => p.estado === 'PENDIENTE').length;

  // --- Handlers con API ---
  const handleRegistrarCajon = async (e: React.FormEvent) => {
    e.preventDefault();
    const costo = parseFloat(nuevoCajonCosto);
    if (!costo || !nuevoCajonFecha) return;
    try {
      const res = await fetch(`${API_BASE}/cajones`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          costoTotal: costo,
          fecha: nuevoCajonFecha,
          proveedor: nuevoCajonProveedor || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchAll();
      setNuevoCajonCosto('');
      setNuevoCajonProveedor('');
      showAlert('¡Cajón Registrado!', 'Ingresá las hamburguesas rendidas cuando estén listas.', 'success');
    } catch (err: any) {
      showAlert('Error', err.message || 'No se pudo registrar el cajón.', 'error');
    }
  };

  const handleActualizarUnidades = async (id: string) => {
    const unidades = parseInt(unidadesEdit);
    if (!unidades || unidades <= 0) return;
    try {
      const res = await fetch(`${API_BASE}/cajones/${id}/unidades`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ unidadesRendidas: unidades }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchAll();
      setEditandoUnidades(null);
      setUnidadesEdit('');
    } catch (err: any) {
      showAlert('Error', err.message || 'No se pudo actualizar el cajón.', 'error');
    }
  };

  const handleCrearPedido = async (e: React.FormEvent) => {
    e.preventDefault();
    const cantidad = parseInt(nuevoPedidoCantidad);
    const precio = parseFloat(nuevoPedidoPrecio);
    if (!nuevoPedidoCliente || !cantidad || !precio) return;
    try {
      const res = await fetch(`${API_BASE}/pedidos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clienteNombre: nuevoPedidoCliente,
          cantidadHamburguesas: cantidad,
          precioTotal: precio,
          fechaEntrega: nuevoPedidoFechaEntrega || undefined,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchAll();
      setNuevoPedidoCliente('');
      setNuevoPedidoCantidad('');
      setNuevoPedidoPrecio('');
      setNuevoPedidoFechaEntrega('');
      showAlert('Pedido Registrado', `Pedido para ${nuevoPedidoCliente} en estado Pendiente.`, 'success');
    } catch (err: any) {
      showAlert('Error', err.message || 'No se pudo registrar el pedido.', 'error');
    }
  };

  const handleEntregarPedido = async (id: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido || pedido.estado === 'ENTREGADO') return;

    if (stockActual < pedido.cantidadHamburguesas) {
      showAlert('Stock Insuficiente', `Hay ${stockActual} hamburguesas en stock y el pedido requiere ${pedido.cantidadHamburguesas}.`, 'warning');
      return;
    }
    try {
      const res = await fetch(`${API_BASE}/pedidos/${id}/estado`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado: 'ENTREGADO' }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchAll();
    } catch (err: any) {
      showAlert('Error', err.message || 'No se pudo entregar el pedido.', 'error');
    }
  };

  const handleEliminarPedido = (id: string) => {
    const pedido = pedidos.find((p) => p.id === id);
    if (!pedido) return;
    showConfirm(
      '¿Cancelar Pedido?',
      `Vas a cancelar el pedido de ${pedido.clienteNombre}. Esta acción no se puede deshacer.`,
      async () => {
        setModal(prev => ({ ...prev, isOpen: false }));
        try {
          const res = await fetch(`${API_BASE}/pedidos/${id}/estado`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ estado: 'CANCELADO' }),
          });
          const json = await res.json();
          if (!json.success) throw new Error(json.error);
          await fetchAll();
        } catch (err: any) {
          showAlert('Error', err.message || 'No se pudo cancelar el pedido.', 'error');
        }
      }
    );
  };

  const handleRegistrarGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = parseFloat(nuevoGastoMonto);
    if (!nuevoGastoConcepto || !monto) return;
    try {
      const res = await fetch(`${API_BASE}/gastos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          concepto: nuevoGastoConcepto,
          monto,
          categoria: nuevoGastoCategoria,
        }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      await fetchAll();
      setNuevoGastoConcepto('');
      setNuevoGastoMonto('');
      showAlert('Gasto Registrado', '¡El gasto se guardó con éxito!', 'success');
    } catch (err: any) {
      showAlert('Error', err.message || 'No se pudo registrar el gasto.', 'error');
    }
  };

  // --- Pantalla de carga / error ---
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


  return (
    <div className="flex flex-col md:flex-row h-screen bg-slate-50 w-full overflow-hidden font-sans text-slate-800">
      
      {/* DESKTOP SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 shadow-2xl z-50">
        <div className="p-5 bg-slate-950/50 flex items-center gap-3 border-b border-slate-800">
          <span className="text-3xl drop-shadow-sm">🍗</span>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight text-white">TodoPollo y Más</h1>
            <p className="text-[11px] text-amber-500 font-bold uppercase tracking-wider">Gestión Interna</p>
          </div>
        </div>
        <div className="p-4 flex-1 space-y-2 mt-2">
          <button
            onClick={() => setActiveTab('stock')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === 'stock' ? 'bg-amber-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Package size={20} />
            <span>Dashboard</span>
          </button>
          
          <button
            onClick={() => setActiveTab('produccion')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === 'produccion' ? 'bg-amber-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Layers size={20} />
            <span>Cajones</span>
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium relative ${
              activeTab === 'pedidos' ? 'bg-amber-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <ShoppingBag size={20} />
            <span>Pedidos de Venta</span>
            {pedidosPendientesCount > 0 && (
              <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gastos')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${
              activeTab === 'gastos' ? 'bg-amber-500 text-white shadow-md' : 'hover:bg-slate-800 hover:text-white'
            }`}
          >
            <Receipt size={20} />
            <span>Gastos</span>
          </button>
        </div>
      </aside>

      {/* CONTENT WRAPPER */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        
        {/* HEADER MOBILE */}
        <header className="md:hidden sticky top-0 z-30 bg-amber-500 text-white px-4 py-3.5 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="text-2xl drop-shadow-sm">🍗</span>
          <div>
            <h1 className="font-bold text-lg leading-tight tracking-tight">TodoPollo y Más</h1>
            <p className="text-[11px] text-amber-100 font-medium">Gestión de Hamburguesas Crudas</p>
          </div>
        </div>
        <div className="bg-amber-600/60 px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 border border-amber-400/40">
          <Package size={13} />
          <span>{stockActual} en stock</span>
        </div>
      </header>

        {/* HEADER DESKTOP */}
        <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-5 items-center justify-between z-10 shadow-sm shrink-0">
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">
            {activeTab === 'stock' && 'Dashboard y Resumen'}
            {activeTab === 'produccion' && 'Gestión de Cajones'}
            {activeTab === 'pedidos' && 'Pedidos de Clientes'}
            {activeTab === 'gastos' && 'Gastos Operativos'}
          </h2>
          <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-amber-900 shadow-sm">
            <Package size={18} className="text-amber-500" />
            <span>{stockActual} hamburguesas en stock</span>
          </div>
        </header>

      {/* CONTENIDO PRINCIPAL SCROLLEABLE */}
      <main className="flex-1 p-4 md:p-8 pb-24 md:pb-8 space-y-4 md:space-y-6 overflow-y-auto w-full max-w-6xl mx-auto">
        {/* ========================================================= */}
        {/* TAB: STOCK & DASHBOARD */}
        {/* ========================================================= */}
        {activeTab === 'stock' && (
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
                onClick={() => setActiveTab('produccion')}
                className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center gap-1 active:scale-95 transition"
              >
                <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                  <Layers size={18} />
                </div>
                <span className="text-xs font-bold text-slate-700">+ Cajón</span>
              </button>

              <button
                onClick={() => setActiveTab('pedidos')}
                className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center gap-1 active:scale-95 transition"
              >
                <div className="w-9 h-9 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                  <ShoppingBag size={18} />
                </div>
                <span className="text-xs font-bold text-slate-700">+ Pedido</span>
              </button>

              <button
                onClick={() => setActiveTab('gastos')}
                className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center gap-1 active:scale-95 transition"
              >
                <div className="w-9 h-9 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
                  <Receipt size={18} />
                </div>
                <span className="text-xs font-bold text-slate-700">+ Gasto</span>
              </button>
            </div>

            {/* ── Métricas principales ── */}
            {(() => {
              const totalCajones = cajones.reduce((acc, c) => acc + c.costoTotal, 0);
              const balanceNeto = totalVentas - totalCajones - totalGastos;
              const balancePositivo = balanceNeto >= 0;

              return (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                    {/* Ventas */}
                    <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
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
                        <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                        <span className="text-xs text-slate-500 font-medium">Cajones</span>
                      </div>
                      <div className="text-lg md:text-2xl font-bold text-orange-500">
                        {formatCurrency(totalCajones)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">{cajones.length} cajón{cajones.length !== 1 ? 'es' : ''} comprado{cajones.length !== 1 ? 's' : ''}</div>
                    </div>

                    {/* Gasto insumos */}
                    <div className="bg-white p-4 md:p-5 rounded-xl border border-slate-200 shadow-sm">
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className="w-2 h-2 rounded-full bg-rose-500"></div>
                        <span className="text-xs text-slate-500 font-medium">Insumos</span>
                      </div>
                      <div className="text-lg md:text-2xl font-bold text-rose-600">
                        {formatCurrency(totalGastos)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Bolsas, separadores…</div>
                    </div>

                    {/* Balance neto */}
                    <div className={`p-4 md:p-5 rounded-xl border shadow-sm ${balancePositivo ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <div className={`w-2 h-2 rounded-full ${balancePositivo ? 'bg-emerald-500' : 'bg-rose-500'}`}></div>
                        <span className="text-xs text-slate-500 font-medium">Balance Neto</span>
                      </div>
                      <div className={`text-lg md:text-2xl font-bold ${balancePositivo ? 'text-emerald-700' : 'text-rose-700'}`}>
                        {balanceNeto >= 0 ? '+' : ''}{formatCurrency(balanceNeto)}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-1">Ventas − cajones − insumos</div>
                    </div>
                  </div>

                  {/* ── Reporte de Seguimiento ── */}
                  <ReporteSeguimiento
                    cajones={cajones}
                    pedidos={pedidos}
                    gastos={gastos}
                    formatCurrency={formatCurrency}
                  />
                </>
              );
            })()}

            {/* Alerta de pedidos pendientes */}
            {pedidosPendientesCount > 0 && (
              <div
                onClick={() => setActiveTab('pedidos')}
                className="bg-amber-50 border border-amber-200 p-3.5 rounded-xl flex items-center justify-between cursor-pointer active:bg-amber-100 transition"
              >
                <div className="flex items-center gap-2.5">
                  <Clock className="text-amber-600" size={20} />
                  <div>
                    <p className="text-xs font-bold text-amber-900">
                      {pedidosPendientesCount} {pedidosPendientesCount === 1 ? 'pedido pendiente' : 'pedidos pendientes'}
                    </p>
                    <p className="text-[11px] text-amber-700">Toca para revisar y marcar entregado</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-200/70 px-2 py-1 rounded-md">
                  Ver
                </span>
              </div>
            )}

            {/* Últimos movimientos reales */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
                Actividad Reciente
              </h3>
              <div className="space-y-2.5">
                {[
                  ...cajones.slice(0, 3).map(c => ({
                    tipo: 'cajon' as const,
                    label: `Cajón comprado${c.proveedor ? ` — ${c.proveedor}` : ''}`,
                    sub: `Costo: ${formatCurrency(c.costoTotal)}`,
                    fecha: String(c.fecha),
                    id: c.id,
                  })),
                  ...pedidos.filter(p => p.estado === 'ENTREGADO').slice(0, 3).map(p => ({
                    tipo: 'entrega' as const,
                    label: `Entrega a ${p.clienteNombre}`,
                    sub: `${p.cantidadHamburguesas} hamburguesas · ${formatCurrency(p.precioTotal)}`,
                    fecha: String(p.fechaPedido),
                    id: p.id,
                  })),
                ]
                  .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
                  .slice(0, 5)
                  .map(item => (
                    <div key={item.id} className="flex items-center justify-between text-xs border-b border-slate-50 pb-2 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2">
                        <span className={`p-1 rounded-full ${item.tipo === 'cajon' ? 'bg-orange-100 text-orange-600' : 'bg-emerald-100 text-emerald-700'}`}>
                          {item.tipo === 'cajon' ? <ArrowDownLeft size={13} /> : <ArrowUpRight size={13} />}
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
                  <p className="text-xs text-slate-400 text-center py-2">Sin actividad registrada aún</p>
                )}
              </div>
            </div>
          </div>
        )}


        {/* ========================================================= */}
        {/* TAB: PRODUCCIÓN (CAJONES DE PECHUGAS) */}
        {/* ========================================================= */}
        {activeTab === 'produccion' && (
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

            {/* Listado de Cajones Anteriores */}
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
                    ) : c.unidadesRendidas == null && (
                      <button
                        onClick={() => { setEditandoUnidades(c.id); setUnidadesEdit(''); }}
                        className="w-full border border-dashed border-amber-400 text-amber-600 text-xs font-semibold py-2 rounded-lg flex items-center justify-center gap-1.5 hover:bg-amber-50 transition"
                      >
                        <Plus size={14} /> Ingresar hamburguesas rendidas
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: PEDIDOS (VENTAS) */}
        {/* ========================================================= */}
        {activeTab === 'pedidos' && (
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
                    value={nuevoPedidoCliente}
                    onChange={(e) => setNuevoPedidoCliente(e.target.value)}
                    placeholder="Ej: Juan Pérez"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Cantidad
                    </label>
                    <input
                      type="number"
                      value={nuevoPedidoCantidad}
                      onChange={(e) => setNuevoPedidoCantidad(e.target.value)}
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
                      value={nuevoPedidoPrecio}
                      onChange={(e) => setNuevoPedidoPrecio(e.target.value)}
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
                    value={nuevoPedidoFechaEntrega}
                    onChange={(e) => setNuevoPedidoFechaEntrega(e.target.value)}
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
                            isEntregado ? 'w-full bg-slate-100 text-slate-500 hover:bg-rose-50 hover:text-rose-600' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'
                          }`}
                        >
                          <Trash2 size={16} />
                          <span>Eliminar</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: GASTOS (INSUMOS, SEPARADORES, BOLSAS) */}
        {/* ========================================================= */}
        {activeTab === 'gastos' && (
          <div className="md:grid md:grid-cols-2 md:gap-8 items-start space-y-4 md:space-y-0">
            {/* Formulario nuevo gasto */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
              <div className="flex items-center gap-2 mb-3">
                <Receipt className="text-rose-500" size={20} />
                <h2 className="font-bold text-slate-800 text-sm">Registrar Gasto Operativo</h2>
              </div>

              <form onSubmit={handleRegistrarGasto} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-slate-600 mb-1">
                    Concepto
                  </label>
                  <input
                    type="text"
                    value={nuevoGastoConcepto}
                    onChange={(e) => setNuevoGastoConcepto(e.target.value)}
                    placeholder="Ej: Separadores x2000, Bolsas 20x30, Pimienta"
                    className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Monto ($)
                    </label>
                    <input
                      type="number"
                      value={nuevoGastoMonto}
                      onChange={(e) => setNuevoGastoMonto(e.target.value)}
                      placeholder="Ej: 15000"
                      className="w-full text-sm px-3 py-2 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-rose-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      Categoría
                    </label>
                    <select
                      value={nuevoGastoCategoria}
                      onChange={(e) => setNuevoGastoCategoria(e.target.value as CategoriaGasto)}
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
                  <div key={g.id} className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{g.concepto}</p>
                      <p className="text-[10px] text-slate-500">
                        {getCategoriaGastoLabel(g.categoria)} • {formatDate(g.fecha)}
                      </p>
                    </div>
                    <span className="text-sm font-bold text-rose-600">
                      -{formatCurrency(g.monto)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR MOBILE */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 z-40 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
        <div className="grid grid-cols-4 h-16">
          <button
            onClick={() => setActiveTab('stock')}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === 'stock' ? 'text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Package size={22} />
            <span className="text-[11px]">Stock</span>
          </button>

          <button
            onClick={() => setActiveTab('produccion')}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === 'produccion' ? 'text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Layers size={22} />
            <span className="text-[11px]">Cajones</span>
          </button>

          <button
            onClick={() => setActiveTab('pedidos')}
            className={`flex flex-col items-center justify-center gap-1 relative transition ${
              activeTab === 'pedidos' ? 'text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <ShoppingBag size={22} />
            <span className="text-[11px]">Pedidos</span>
            {pedidosPendientesCount > 0 && (
              <span className="absolute top-2 right-6 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('gastos')}
            className={`flex flex-col items-center justify-center gap-1 transition ${
              activeTab === 'gastos' ? 'text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-600'
            }`}
          >
            <Receipt size={22} />
            <span className="text-[11px]">Gastos</span>
          </button>
        </div>
      </nav>
      </div>

      {/* MODAL COMPONENT */}
      {modal.isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm overflow-hidden animate-in zoom-in-95 p-6 relative">
            <button 
              onClick={modal.onCancel || modal.onConfirm}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-full p-1.5 transition"
            >
              <X size={18} />
            </button>
            <div className="flex flex-col items-center text-center mt-2">
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 ${
                modal.type === 'success' ? 'bg-emerald-100 text-emerald-600' : 
                modal.type === 'warning' ? 'bg-amber-100 text-amber-600' : 
                modal.type === 'error' ? 'bg-rose-100 text-rose-600' : 
                'bg-blue-100 text-blue-600'
              }`}>
                {modal.type === 'success' ? <CheckCircle2 size={28} /> : 
                 modal.type === 'warning' ? <AlertTriangle size={28} /> : 
                 modal.type === 'error' ? <AlertTriangle size={28} /> : 
                 <Info size={28} />}
              </div>
              <h3 className="text-xl font-black text-slate-800 mb-2">{modal.title}</h3>
              <p className="text-sm text-slate-500 font-medium mb-6 leading-relaxed">{modal.message}</p>
              
              <div className="flex gap-3 w-full">
                {modal.cancelText && (
                  <button
                    onClick={modal.onCancel}
                    className="flex-1 py-3 rounded-xl text-sm font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 transition"
                  >
                    {modal.cancelText}
                  </button>
                )}
                <button
                  onClick={modal.onConfirm}
                  className={`flex-1 py-3 rounded-xl text-sm font-bold text-white transition shadow-sm ${
                    modal.type === 'warning' || modal.type === 'error' ? 'bg-rose-500 hover:bg-rose-600' : 'bg-emerald-500 hover:bg-emerald-600'
                  }`}
                >
                  {modal.confirmText || 'Aceptar'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
