# 🍗 TodoPollo y Más - Sistema de Gestión

Sistema web full-stack diseñado **mobile-first** (pensado para uso en smartphones desde el local o cocina) para la gestión integral de un negocio de venta y producción de hamburguesas de pollo crudas.

---

## 🚀 Nuevas Funcionalidades (Última Actualización)

El sistema ahora soporta un **Inventario Multi-Tipo** de forma nativa. Podés registrar el stock, producción y venta diferenciando entre distintos tipos de hamburguesas de pollo:
- 🧀 **Jamón y Queso**
- 🌿 **Espinaca y Queso**
- 🥕 **Zanahoria y Queso**

Además, ahora podés:
- **Editar y eliminar Cajones**: Si te equivocaste al registrar un cajón de materia prima, podés eliminarlo y automáticamente se descontarán las hamburguesas rendidas del stock general y por tipo.
- **Gestión total de Gastos**: Ahora los gastos (insumos, servicios, logística, etc.) se pueden **editar** y **eliminar**.
- **Cancelación y Eliminación real de Pedidos**: Los pedidos ahora pueden borrarse permanentemente de la base de datos (y su stock se restablece automáticamente).

---

## 🏗️ Arquitectura del Monorepo

El proyecto está organizado utilizando **npm workspaces**:

```
TodoPolloyMas/
├── package.json              # Configuración de workspaces y scripts unificados
├── packages/
│   └── shared/               # Tipos TypeScript, DTOs y utilidades compartidas (enums, helpers, formatters)
└── apps/
    ├── backend/              # API REST (Node.js + Express + TypeScript + Prisma ORM)
    └── frontend/             # SPA Mobile-First (React + Vite + TypeScript + Tailwind CSS)
```

### 1. `/packages/shared`
Paquete transversal que garantiza el tipado fuerte entre frontend y backend:
- Tipos de TypeScript e interfaces:
  - `TipoHamburguesa`: Define las variantes disponibles (JAMON_QUESO, ESPINACA_QUESO, ZANAHORIA_QUESO).
  - `StockPorTipo` & `ItemPedido`: Tipos para manejo de breakdown por sabores.
  - `Cajon`: Costo de compra de pechugas, rendimiento por tipo y total de unidades.
  - `Stock` & `MovimientoStock`: Control de inventario en tiempo real.
  - `Pedido`: Clientes, cantidades, desglose por tipo, precios y estados.
  - `Gasto`: Gastos operativos extras categorizados.
- Funciones utilitarias (`formatCurrency`, `getTipoHamburguesaLabel`, `getTipoHamburguesaEmoji`).

### 2. `/apps/backend`
- API REST construida con **Express, TypeScript y Prisma ORM** con PostgreSQL.
- Modelos Prisma estructurados en `apps/backend/prisma/schema.prisma`.
- Funciona con **transacciones atómicas**:
  - Al ingresar la distribución de hamburguesas de un **Cajón**, automáticamente se incrementa el `Stock` total, el `StockPorTipo` y se crea el registro en `MovimientoStock`.
  - Al marcar un **Pedido** como `ENTREGADO`, se verifica disponibilidad, se decrementa el `Stock` general y el de cada tipo de hamburguesa involucrada, manteniendo cuadratura perfecta.

### 3. `/apps/frontend`
- SPA **React + Vite + TypeScript + Tailwind CSS**.
- **Diseño 100% Mobile-First**:
  - Vistas adaptadas a pantallas chicas, con áreas seguras para muescas/notches de iPhone y Android.
  - Barra de navegación inferior fija (Bottom Nav) ergonómica.
  - Interfaces fluidas para cargar **cantidades por tipo de hamburguesa** al registrar un pedido o ingresar rendimientos de cajones.
  - Panel de confirmación modal propio (vía `useModal`).
  - `host: true` en `vite.config.ts` para poder ingresar desde el navegador de cualquier celular en la red local.

---

## 🛠️ Puesta en Marcha

### Prerrequisitos
- Node.js v18+ (recomendado v20+)
- Base de datos PostgreSQL (local, Docker o en la nube como Neon / Supabase)

### Instalación de dependencias
Desde la raíz del proyecto:
```bash
npm install
```

### Configuración de la Base de Datos
1. Copiá el archivo de ejemplo a uno real:
```bash
cp apps/backend/.env.example apps/backend/.env
```
2. Modificá el `apps/backend/.env` recién creado con tu cadena de conexión a PostgreSQL real.

3. Ejecutá la migración de Prisma para preparar la estructura (y el esquema multi-tipo):
```bash
npm run prisma:migrate
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
| `npm run build -w @todopolloyplus/shared` | Recompila el paquete compartido (necesario tras cambios en types) |
| `npm run prisma:generate` | Genera el cliente de Prisma |
| `npm run prisma:migrate` | Aplica migraciones pendientes a PostgreSQL |
| `npm run prisma:studio` | Abre la interfaz web de Prisma Studio |

---

## 📱 Cómo probar la app desde tu Celular

1. Asegurate de que tu computadora y tu celular estén conectados a la **misma red Wi-Fi**.
2. Ejecutá `npm run dev` en la raíz.
3. En la consola del terminal verás la dirección de red local bajo "Network" (ej: `http://192.168.1.XX:5173`).
4. Abrí esa URL en el navegador de tu celular (Chrome o Safari) y agregala a la pantalla de inicio para utilizarla como una app nativa a pantalla completa.
