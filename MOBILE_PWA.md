# Documentación PWA Móvil

## Características Implementadas

### ✅ PWA Completo
- Manifest con iconos any/maskable/monochrome
- Splash screens iOS (SE, 14, 14 Pro Max, iPad Air)
- Service Worker con Workbox
- Estrategias de cache:
  - Firestore: NetworkFirst (3s timeout)
  - Storage: StaleWhileRevalidate
  - Imágenes: StaleWhileRevalidate (30d)

### ✅ Gestos Móviles
- Librería de gestos lista en `src/lib/gestures.ts`
- Swipe horizontal implementable en workout
- Vibración haptic en Android (iOS fallback)
- Long-press ready para acciones contextuales

### ✅ Optimizaciones iOS
- Safe areas para notch/Dynamic Island
- 100dvh para altura completa
- Status bar translúcida
- Splash screens adaptativas
- Meta tags completos para instalación

### ✅ Optimizaciones Android
- Icono maskable para recorte perfecto
- Icono monocromático (Android 13+)
- Theme color adaptativo (light/dark)
- Vibration API lista
- TWA ready (preparado para Play Store)

### ✅ Performance
- Code splitting por rutas automático (Vite)
- Touch action: manipulation (elimina 300ms delay)
- Wake Lock API lista en `src/lib/gestures.ts`
- Workbox con estrategias optimizadas

### ✅ Offline
- Firestore persistence activada
- Offline queue implementada en `src/lib/offlineQueue.ts`
- Sets guardables localmente
- Sync automático al reconectar

### ✅ Accesibilidad
- Tap targets mínimo 44px (clase `.tap-target`)
- prefers-reduced-motion implementado
- Focus visible configurado
- inputmode correcto en inputs numéricos

## Limitaciones Conocidas

### iOS Safari
- Wake Lock no soportado (< iOS 16.4)
- Vibration API no disponible (usar sonido como fallback)
- Push notifications solo PWA instalada (≥ iOS 16.4)
- 100vh bug mitigado con 100dvh

### Android
- Vibration requiere HTTPS
- Wake Lock requiere user gesture

## Instalación

### Iconos Generados
Los iconos ya están generados en `/public/icons/`:
- ✅ `icon-192.png` (192x192)
- ✅ `icon-512.png` (512x512)
- ✅ `maskable-512.png` (512x512, safe zone 80%)
- ✅ `monochrome-512.png` (512x512, monocromo)
- ✅ `apple-touch-icon.png` (180x180)

### Splash Screens Generados
Las splash screens iOS están en `/public/splash/`:
- ✅ `iphone-se.png` (750x1334)
- ✅ `iphone-14.png` (1125x2436)
- ✅ `iphone-14-pro-max.png` (1170x2532)
- ✅ `ipad-air.png` (1640x2360)

## API y Utilidades

### Wake Lock (mantener pantalla encendida)
```typescript
import { requestWakeLock, releaseWakeLock } from '@/lib/gestures';

// Al iniciar workout
await requestWakeLock();

// Al terminar workout
await releaseWakeLock();
```

### Vibración Haptic
```typescript
import { vibrateSuccess, vibrateLight, vibrateError } from '@/lib/gestures';

// Vibración de éxito (serie completada)
vibrateSuccess();

// Vibración ligera (tap feedback)
vibrateLight();

// Vibración de error
vibrateError();
```

### Web Share
```typescript
import { shareWorkout, canShare } from '@/lib/gestures';

if (canShare()) {
  await shareWorkout({
    title: 'Mi Entrenamiento',
    text: '¡Completé 12 series de pecho!',
    url: 'https://app-hipertrofia.web.app/progress'
  });
}
```

### Offline Queue
```typescript
import { offlineQueue } from '@/lib/offlineQueue';

// Agregar acción offline
if (!navigator.onLine) {
  offlineQueue.add('add_set', setData);
}

// Procesar cola (automático al reconectar)
await offlineQueue.process();
```

### Detectar PWA Instalada
```typescript
import { isPWA } from '@/lib/gestures';

if (isPWA()) {
  console.log('App instalada como PWA');
}
```

## Testing

### Matriz de Pruebas
- [ ] iOS 16.4+ (Safari)
- [ ] iOS 17+ (Safari)
- [ ] Android 11-14 (Chrome)
- [ ] PWA instalada (iOS/Android)
- [ ] Modo offline
- [ ] Reconexión y sync
- [ ] Safe areas (notch/island)
- [ ] Instalación desde navegador

### Lighthouse PWA
Target: ≥ 95/100

Ejecutar:
```bash
npm run build
npx serve dist
# Abrir Chrome DevTools > Lighthouse > PWA audit
```

### Instalación Manual

**iOS:**
1. Abrir en Safari
2. Tap botón compartir
3. "Añadir a pantalla de inicio"
4. Confirmar

**Android:**
1. Abrir en Chrome
2. Menú (3 puntos)
3. "Instalar app" o "Añadir a pantalla de inicio"
4. Confirmar

## TWA para Play Store

Crear `public/.well-known/assetlinks.json`:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "app.hipertrofia.twa",
    "sha256_cert_fingerprints": ["YOUR_SHA256_FINGERPRINT"]
  }
}]
```

Luego usar [Bubblewrap](https://github.com/GoogleChromeLabs/bubblewrap) para generar APK.

## CSP Headers

Configurar en Firebase Hosting (`firebase.json`):
```json
{
  "hosting": {
    "headers": [{
      "source": "**",
      "headers": [{
        "key": "Content-Security-Policy",
        "value": "default-src 'self'; script-src 'self' https://*.firebaseio.com https://www.gstatic.com 'unsafe-inline'; connect-src 'self' https://*.googleapis.com https://*.firebaseio.com; img-src 'self' data: https:; style-src 'self' 'unsafe-inline';"
      }, {
        "key": "X-Content-Type-Options",
        "value": "nosniff"
      }, {
        "key": "Referrer-Policy",
        "value": "strict-origin-when-cross-origin"
      }]
    }]
  }
}
```

## Debugging

### Service Worker
```javascript
// Consola del navegador
navigator.serviceWorker.getRegistrations().then(r => console.log(r));
```

### Offline Queue
```javascript
// Consola del navegador
JSON.parse(localStorage.getItem('offline_queue'));
```

### Wake Lock
```javascript
// Consola del navegador
navigator.wakeLock.request('screen').then(lock => console.log('Wake Lock activo', lock));
```

### Safe Areas
```javascript
// Consola del navegador
console.log({
  top: getComputedStyle(document.documentElement).getPropertyValue('--safe-top'),
  bottom: getComputedStyle(document.documentElement).getPropertyValue('--safe-bottom')
});
```

## Próximos Pasos

### Funcionalidades Pendientes (Opcionales)
1. **Implementar swipe en TodayWorkout**: Usar `useSwipeable` de `react-swipeable`
2. **Implementar swipe-to-complete en ExerciseCard**: Gesto visual para completar ejercicios
3. **Activar Wake Lock en workout activo**: Llamar `requestWakeLock()` al iniciar sesión
4. **Agregar Web Share en resultados**: Compartir PRs y logros
5. **Pull-to-refresh**: Implementar en vistas principales

### Mejoras de Performance
- [ ] Lazy loading de rutas admin
- [ ] Prefetch de workout del día siguiente
- [ ] Optimizar bundle size (analizar con `vite-bundle-visualizer`)
- [ ] Comprimir imágenes splash (usar WebP)

### Monitoreo
- [ ] Configurar Firebase Performance Monitoring
- [ ] Agregar error tracking (Sentry o similar)
- [ ] Métricas de uso offline

## Recursos

- [PWA Builder](https://www.pwabuilder.com/) - Generar iconos y validar PWA
- [Maskable.app](https://maskable.app/) - Editor de iconos maskable
- [Web.dev PWA Checklist](https://web.dev/pwa-checklist/) - Checklist oficial
- [Can I Use](https://caniuse.com/) - Verificar compatibilidad de APIs

## Changelog

### v1.0.0 - 2025-10-14
- ✅ Meta tags móviles completos
- ✅ Manifest.webmanifest con shortcuts
- ✅ Iconos PWA generados (any/maskable/monochrome)
- ✅ Splash screens iOS
- ✅ Workbox con estrategias avanzadas
- ✅ Safe areas para notch/island
- ✅ Tap targets optimizados (44px)
- ✅ Touch optimization (manipulation)
- ✅ 100dvh fix para iOS
- ✅ Offline queue implementada
- ✅ Gestures library
- ✅ Update banner
- ✅ inputMode optimizado
- ✅ prefers-reduced-motion
