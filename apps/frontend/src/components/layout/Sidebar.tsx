
import { NavLink } from 'react-router-dom';
import { Package, Layers, ShoppingBag, Receipt } from 'lucide-react';

interface SidebarProps {
  pedidosPendientesCount: number;
}

const navItems = [
  { to: '/', label: 'Dashboard', icon: Package, end: true },
  { to: '/produccion', label: 'Cajones', icon: Layers, end: false },
  { to: '/pedidos', label: 'Pedidos de Venta', icon: ShoppingBag, end: false },
  { to: '/gastos', label: 'Gastos', icon: Receipt, end: false },
];

export function Sidebar({ pedidosPendientesCount }: SidebarProps) {
  return (
    <aside className="hidden md:flex flex-col w-64 bg-slate-900 text-slate-300 border-r border-slate-800 shrink-0 shadow-2xl z-50">
      <div className="p-5 bg-slate-950/50 flex items-center gap-3 border-b border-slate-800">
        <span className="text-3xl drop-shadow-sm">🍗</span>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-white">
            TodoPollo y Más
          </h1>
          <p className="text-[11px] text-amber-500 font-bold uppercase tracking-wider">
            Gestión Interna
          </p>
        </div>
      </div>

      <div className="p-4 flex-1 space-y-2 mt-2">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium relative ${
                isActive
                  ? 'bg-amber-500 text-white shadow-md'
                  : 'hover:bg-slate-800 hover:text-white'
              }`
            }
          >
            <Icon size={20} />
            <span>{label}</span>
            {to === '/pedidos' && pedidosPendientesCount > 0 && (
              <span className="absolute top-1/2 -translate-y-1/2 right-4 w-2.5 h-2.5 bg-amber-400 rounded-full animate-pulse" />
            )}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
