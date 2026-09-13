import { useState, useEffect, useCallback } from 'react';
import type { Cajon, Pedido, Gasto } from '@todopolloyplus/shared';
import {
  fetchStock,
  fetchCajones,
  fetchPedidos,
  fetchGastos,
} from '../api/client';

export function useAppData() {
  const [stockActual, setStockActual] = useState(0);
  const [cajones, setCajones] = useState<Cajon[]>([]);
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stockData, cajonesData, pedidosData, gastosData] = await Promise.all([
        fetchStock(),
        fetchCajones(),
        fetchPedidos(),
        fetchGastos(),
      ]);
      setStockActual(stockData.cantidadActual);
      setCajones(cajonesData);
      setPedidos(pedidosData);
      setGastos(gastosData);
    } catch {
      setError(
        'No se pudo conectar con el servidor. ¿Está corriendo el backend en el puerto 3001?'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // Derived values
  const totalVentas = pedidos
    .filter((p) => p.estado === 'ENTREGADO')
    .reduce((acc, p) => acc + p.precioTotal, 0);

  const totalGastos = gastos.reduce((acc, g) => acc + g.monto, 0);

  const pedidosPendientesCount = pedidos.filter((p) => p.estado === 'PENDIENTE').length;

  return {
    // Raw state
    stockActual,
    cajones,
    pedidos,
    gastos,
    loading,
    error,
    // Actions
    fetchAll,
    // Derived
    totalVentas,
    totalGastos,
    pedidosPendientesCount,
  };
}
