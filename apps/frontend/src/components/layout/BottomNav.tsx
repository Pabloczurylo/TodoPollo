
import { NavLink } from 'react-router-dom';
import { Package, Layers, ShoppingBag, Receipt } from 'lucide-react';

interface BottomNavProps {
  pedidosPendientesCount: number;
}

const navItems = [
  { to: '/', label: 'Stock', icon: Package, end: true },
  { to: '/produccion', label: 'Cajones', icon: Layers, end: false },
  { to: '/pedidos', label: 'Pedidos', icon: ShoppingBag, end: false },
  { to: '/gastos', label: 'Gastos', icon: Receipt, end: false },
];

export function BottomNav({ pedidosPendientesCount }: BottomNavProps) {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 w-full bg-white border-t border-slate-200 z-40 safe-bottom shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
      <div className="grid grid-cols-4 h-16">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-1 transition relative ${
                isActive ? 'text-amber-600 font-bold' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            <Icon size={22} />
            <span className="text-[11px]">{label}</span>
            {to === '/pedidos' && pedidosPendientesCount > 0 && (
              <span className="absolute top-2 right-6 w-2.5 h-2.5 bg-amber-500 rounded-full border-2 border-white" />
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  );
}
