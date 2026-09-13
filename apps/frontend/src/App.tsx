
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/layout/Layout';
import { Dashboard } from './pages/Dashboard';
import { Produccion } from './pages/Produccion';
import { Pedidos } from './pages/Pedidos';
import { Gastos } from './pages/Gastos';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="produccion" element={<Produccion />} />
          <Route path="pedidos" element={<Pedidos />} />
          <Route path="gastos" element={<Gastos />} />
          {/* Fallback: cualquier ruta desconocida redirige al dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
