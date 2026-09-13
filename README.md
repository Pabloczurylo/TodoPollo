# 🍗 TodoPollo y Más - Sistema de Gestión

Sistema web full-stack diseñado **mobile-first** (pensado para uso en smartphones desde el local o cocina) para la gestión integral de un negocio de venta y producción de hamburguesas de pollo crudas.

---

## 🏗️ Arquitectura del Monorepo

El proyecto está organizado utilizando **npm workspaces**:

```
TodoPolloyMas/
├── package.json              # Configuración de workspaces y scripts unificados
├── packages/
│   └── shared/               # Tipos TypeScript, DTOs y utilidades de cálculo compartidas
└── apps/
    ├── backend/              # API REST (Node.js + Express + TypeScript + Prisma ORM)
    └── frontend/             # SPA Mobile-First (React + Vite + TypeScript + Tailwind CSS)
```

### 1. `/packages/shared`
- Tipos de TypeScript e interfaces para:
  - `Cajon`: Costo de compra de pechugas, rendimiento en hamburguesas, cálculo automático de costo unitario por hamburguesa.
  - `Stock` & `MovimientoStock`: Control de inventario en tiempo real con trazabilidad (ingresos por producción, egresos por pedidos entregados).
  - `Pedido`: Clientes, cantidades, precios y estados (`PENDIENTE`, `EN_PREPARACION`, `ENTREGADO`, `CANCELADO`).
  - `Gasto`: Gastos operativos adicionales (separadores, bolsas camiseta, condimentos, etc.).
  - `DashboardStats`: Métricas clave y KPIs del negocio.
- Funciones utilitarias:
  - `formatCurrency()`: Formateador en moneda argentina (ARS).
  - `calculateCostPerBurger()`: Cálculo de costo de producción unitario.
  - `formatDate()` / `formatDateTime()`.

### 2. `/apps/backend`
- API REST construida con Express, TypeScript y Prisma ORM con PostgreSQL.
- Modelos Prisma estructurados en `apps/backend/prisma/schema.prisma`:
  - `Cajon`: Registro de materia prima y hamburguesas obtenidas.
  - `Stock`: Balance general centralizado.
  - `MovimientoStock`: Registro auditable de cada ingreso y egreso de hamburguesas.
  - `Pedido`: Registro de venta y entrega de pedidos a clientes.
  - `Gasto`: Costos operativos extras categorizados.
- Transacciones seguras:
  - Al ingresar un **Cajón**, automáticamente se incrementa el `Stock` y se crea el `MovimientoStock` de tipo `INGRESO_PRODUCCION`.
  - Al marcar un **Pedido** como `ENTREGADO`, se decrementa el `Stock` y se registra el egreso.

### 3. `/apps/frontend`
- SPA React + Vite + TypeScript + Tailwind CSS.
- **Diseño 100% Mobile-First**:
  - Meta tags para vista de aplicación móvil (`viewport-fit=cover`, prevención de zoom accidental y retraso táctil).
  - Soporte para áreas seguras (`safe-area-inset-bottom` en iPhone y Android con gestos).
  - Barra de navegación inferior fija (Bottom Nav) ergonómica para uso con una sola mano.
  - Botones de acción rápida (+ Cajón, + Pedido, + Gasto).
  - Calculador en vivo de costo por hamburguesa al ingresar un cajón.
  - Indicadores visuales de estado y alertas de pedidos pendientes.
  - `host: true` en `vite.config.ts` para poder ingresar desde cualquier celular conectado a la misma red Wi-Fi.

---

## 🚀 Puesta en Marcha

### Prerrequisitos
- Node.js v18+ (recomendado v20+)
- Base de datos PostgreSQL (local, Docker o en la nube como Neon / Supabase)

### Instalación de dependencias
Desde la raíz del proyecto:
```bash
npm install
```

### Configuración de la Base de Datos
1. Modificá el archivo `apps/backend/.env` con tu cadena de conexión a PostgreSQL:
```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/todopollo?schema=public"
PORT=3001
```

2. Ejecutá la migración de Prisma:
```bash
npm run prisma:migrate
```

3. (Opcional) Abrí Prisma Studio para inspeccionar visualmente la base de datos:
```bash
npm run prisma:studio
```

---

## 💻 Scripts Disponibles

Todos los comandos se pueden ejecutar directamente desde la **raíz**:

| Comando | Descripción |
|---|---|
| `npm run dev` | Levanta en paralelo el **backend** (`:3001`) y el **frontend** (`:5173`) |
| `npm run dev:frontend` | Levanta únicamente el frontend Vite con soporte LAN |
| `npm run dev:backend` | Levanta el backend con recarga en caliente (`tsx watch`) |
| `npm run build` | Compila todos los workspaces (`shared`, `backend` y `frontend`) |
| `npm run prisma:generate` | Genera el cliente de Prisma |
| `npm run prisma:migrate` | Aplica migraciones pendientes a PostgreSQL |
| `npm run prisma:studio` | Abre la interfaz web de Prisma Studio |

---

## 📱 Cómo probar la app desde tu Celular

1. Asegurate de que tu computadora y tu celular estén conectados a la misma red Wi-Fi.
2. Ejecutá `npm run dev` en la raíz.
3. En la consola de Vite verás la dirección de red local (ej: `http://192.168.1.XX:5173`).
4. Abrí esa URL en el navegador de tu celular (Chrome o Safari) y agregala a la pantalla de inicio para utilizarla como una app nativa.
