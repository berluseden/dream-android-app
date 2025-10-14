# App Hipertrofia - Sistema de Planificación de Entrenamientos

## 🚀 Stack Tecnológico

- **Frontend**: React 18 + Vite + TypeScript
- **UI**: TailwindCSS + Radix UI (shadcn)
- **Backend**: Firebase (Auth, Firestore, Functions, Storage)
- **Estado**: TanStack Query
- **PWA**: vite-plugin-pwa
- **Routing**: React Router v6

## 📋 Configuración Inicial

### 1. Crear Proyecto en Firebase Console

1. Ir a [Firebase Console](https://console.firebase.google.com/)
2. Crear nuevo proyecto: "app-hipertrofia"
3. Habilitar servicios:
   - ✅ Authentication (Email/Password + Google)
   - ✅ Firestore Database (modo producción)
   - ✅ Cloud Storage
   - ✅ Firebase Functions (plan Blaze)

### 2. Obtener Credenciales

1. En Firebase Console: **Project Settings → General → Your apps → Web app**
2. Copiar las credenciales
3. Crear archivo `.env` en la raíz del proyecto:

```env
VITE_FIREBASE_API_KEY=tu_api_key
VITE_FIREBASE_AUTH_DOMAIN=tu_proyecto.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=tu_proyecto_id
VITE_FIREBASE_STORAGE_BUCKET=tu_proyecto.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=tu_sender_id
VITE_FIREBASE_APP_ID=tu_app_id
```

### 3. Desplegar Reglas de Seguridad

```bash
# Instalar Firebase CLI
npm install -g firebase-tools

# Login
firebase login

# Inicializar proyecto
firebase init firestore

# Desplegar reglas
firebase deploy --only firestore:rules,firestore:indexes
```

### 4. Seed de Datos Iniciales

1. Inicia sesión como usuario
2. En Firebase Console, abre **Firestore Database**
3. Ve a la colección `user_roles`
4. Crea un documento con:
   - `user_id`: tu user ID (cópialo de Authentication)
   - `role`: "admin"
5. Refresca la app y haz clic en "Ejecutar Seed de Datos Iniciales"

## 🏗️ Arquitectura del Sistema

### Modelo de Datos

```
users/                  # Perfiles de usuarios
user_roles/             # Roles separados (seguridad)
muscles/                # Catálogo de músculos
exercises/              # Biblioteca de ejercicios
mesocycles/             # Ciclos de entrenamiento
weekly_targets/         # Objetivos semanales de volumen
workouts/               # Sesiones de entrenamiento
sets/                   # Registro de series
messages/               # Mensajería coach-cliente
coach_assignments/      # Asignaciones coach-cliente
```

### Roles y Permisos

- **Admin**: Acceso completo, gestión de catálogos
- **Coach**: Ver/editar clientes asignados, crear rutinas
- **User**: Ver su plan, registrar entrenamientos

## 🎯 Funcionalidades Implementadas

### ✅ Fase 1: Infraestructura
- Firebase configurado con persistencia offline
- Autenticación con roles en tabla separada (seguridad)
- Reglas de Firestore granulares por rol
- Seed de músculos y ejercicios iniciales

### ✅ Fase 2: Biblioteca de Ejercicios
- Catálogo completo con filtros
- Búsqueda por nombre, músculo, equipamiento
- Vista detallada de ejercicios

### ✅ Fase 3: Gestión Coach-Cliente
- Panel de clientes para coaches
- Sistema de asignación
- Vista de progreso de clientes

### ✅ Navegación y Layout
- Sidebar responsive con colapso
- Protección de rutas por rol
- Navegación móvil con drawer

### ✅ PWA
- Service Worker configurado
- Instalable en dispositivos
- Caché de recursos
- Funciona offline

## 📱 Páginas Disponibles

- `/` - Dashboard con métricas
- `/exercises` - Biblioteca de ejercicios
- `/coach/clients` - Panel de clientes (Coach/Admin)
- `/workouts` - Entrenamientos programados
- `/progress` - Gráficos de progreso
- `/messages` - Mensajería
- `/settings` - Configuración de perfil

## 🔧 Próximas Fases

### Fase 4-5: Planificación y Entrenamientos
- Wizard de creación de mesociclos
- Cálculo automático de volumen progresivo
- Registro de series con RIR/RPE
- Feedback de pump/soreness

### Fase 6: Algoritmos de Autorregulación
- Progresión automática de carga por ejercicio
- Ajuste semanal de volumen por músculo
- Detección de fatiga y recuperación

### Fase 7: Dashboards Avanzados
- Gráficos de volumen vs target
- Tendencias de e1RM por ejercicio
- Indicadores de fatiga por músculo
- Análisis de adherencia

### Fase 8-9: Mensajería e Historial
- Chat en tiempo real coach-cliente
- Historial completo de entrenamientos
- Exportación PDF/CSV
- Comparativas entre períodos

## 🚀 Desarrollo

```bash
# Instalar dependencias
npm install

# Desarrollo
npm run dev

# Build
npm run build

# Preview
npm run preview
```

## 📦 Despliegue

La app está lista para desplegarse en:
- Vercel
- Netlify  
- Firebase Hosting
- Lovable: [Share → Publish](https://lovable.dev/projects/e166b65b-9e48-4c77-887b-1fc631e90581)

## 🔒 Seguridad

- Roles almacenados en tabla separada (no en client storage)
- Validación server-side en Firestore Rules
- Tokens JWT manejados por Firebase Auth
- Persistencia offline segura con IndexedDB

## 📚 Documentación

- [Firebase Docs](https://firebase.google.com/docs)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)
- [React Query](https://tanstack.com/query/latest)
- [Radix UI](https://www.radix-ui.com/)
