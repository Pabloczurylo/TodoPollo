
import { useLocation } from 'react-router-dom';
import { Package } from 'lucide-react';

interface HeaderProps {
  stockActual: number;
}

const TITLES: Record<string, string> = {
  '/': 'Dashboard y Resumen',
  '/produccion': 'Gestión de Cajones',
  '/pedidos': 'Pedidos de Clientes',
  '/gastos': 'Gastos Operativos',
};

export function Header({ stockActual }: HeaderProps) {
  const { pathname } = useLocation();
  const title = TITLES[pathname] ?? 'TodoPollo y Más';

  return (
    <>
      {/* MOBILE HEADER */}
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

      {/* DESKTOP HEADER */}
      <header className="hidden md:flex bg-white border-b border-slate-200 px-8 py-5 items-center justify-between z-10 shadow-sm shrink-0">
        <h2 className="text-2xl font-black text-slate-800 tracking-tight">{title}</h2>
        <div className="bg-amber-50 border border-amber-200 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 text-amber-900 shadow-sm">
          <Package size={18} className="text-amber-500" />
          <span>{stockActual} hamburguesas en stock</span>
        </div>
      </header>
    </>
  );
}
