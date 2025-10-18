# 🔐 Sistema de Creación de Usuarios por Admins

## ✅ Cambios Implementados

### 1. **Eliminación de Registro Público**
- ❌ Eliminado `signUp` público
- ❌ Eliminado `signInWithGoogle`
- ✅ Solo login con email/password
- ✅ Mensaje: "Los usuarios son creados por administradores"

### 2. **Nueva Página: Crear Usuario (Admin)**
**Ubicación**: `/admin/create-user`

**Características**:
- ✅ Formulario completo de creación de usuarios
- ✅ Asignación de roles (user, coach, admin)
- ✅ Validación de contraseñas (mín. 6 caracteres)
- ✅ Vista previa de usuarios creados
- ✅ Información de permisos por rol
- ✅ Integración con Firebase Cloud Functions

**Campos del formulario**:
- Nombre Completo
- Email
- Contraseña (con mostrar/ocultar)
- Rol (select: user, coach, admin)

### 3. **Integración con Cloud Functions**
La creación de usuarios usa la función `createUserWithRole` que:
- Crea usuario en Firebase Auth
- Crea perfil en Firestore (`users`)
- Asigna rol en `user_roles`
- Registra auditoría

---

## 🎯 Flujo de Creación de Usuarios

```
┌─────────────────────────────────────────────┐
│ 1. Admin ingresa a /admin/create-user      │
└─────────────────┬───────────────────────────┘
                  │
                  v
┌─────────────────────────────────────────────┐
│ 2. Completa formulario:                    │
│    - Nombre                                 │
│    - Email                                  │
│    - Contraseña                            │
│    - Rol                                    │
└─────────────────┬───────────────────────────┘
                  │
                  v
┌─────────────────────────────────────────────┐
│ 3. Cloud Function: createUserWithRole       │
│    ├─ Crea usuario en Firebase Auth        │
│    ├─ Crea documento en users/             │
│    ├─ Asigna rol en user_roles/            │
│    └─ Registra en audit_logs/              │
└─────────────────┬───────────────────────────┘
                  │
                  v
┌─────────────────────────────────────────────┐
│ 4. Usuario puede hacer login en /auth      │
└─────────────────────────────────────────────┘
```

---

## 📋 Cómo Crear un Usuario

### Método 1: Desde la Aplicación (Recomendado)

1. **Login como Admin**:
   ```
   URL: https://fitness-dfbb4.web.app/auth
   Email: tu-admin@example.com
   Password: tu-contraseña-admin
   ```

2. **Ir a Crear Usuario**:
   ```
   Panel Admin → Crear Usuario
   O directamente: /admin/create-user
   ```

3. **Completar Formulario**:
   ```
   Nombre:     Juan Pérez
   Email:      juan@example.com
   Contraseña: test123456
   Rol:        user | coach | admin
   ```

4. **Click en "Crear Usuario"**

5. **Usuario creado** ✅
   - Aparece en la tabla de usuarios
   - Puede hacer login inmediatamente

### Método 2: Desde Firebase Console (Backup)

1. **Ir a Firebase Console**:
   ```
   https://console.firebase.google.com/project/fitness-dfbb4/authentication/users
   ```

2. **Add User**:
   ```
   Email:    test@example.com
   Password: test123456
   ```

3. **Copiar User ID**

4. **Ir a Firestore**:
   ```
   https://console.firebase.google.com/project/fitness-dfbb4/firestore
   ```

5. **Crear documento en `user_roles`**:
   ```
   Document ID: {user-id-copiado}
   Field: role
   Value: "user" | "coach" | "admin"
   ```

6. **Crear documento en `users`**:
   ```
   Document ID: {user-id-copiado}
   Fields:
     email: test@example.com
     name: Test User
     equipment: []
     level: "novato"
     experience_years: 0
     goals: ""
     units: "kg"
     coach_id: null
     created_at: <timestamp>
     updated_at: <timestamp>
   ```

---

## 🔒 Roles y Permisos

### Usuario (user)
```
✅ Ver y registrar entrenamientos
✅ Ver su progreso personal
✅ Chat con su coach
❌ No puede ver otros usuarios
❌ No puede crear programas
```

### Coach (coach)
```
✅ Gestionar clientes asignados
✅ Crear y editar programas
✅ Monitorear progreso de clientes
✅ Chat con clientes
❌ No acceso al panel admin
```

### Administrador (admin)
```
✅ Acceso completo al sistema
✅ Crear y gestionar usuarios
✅ Gestionar roles y permisos
✅ Configuración del sistema
✅ Ver auditoría completa
```

---

## ⚠️ IMPORTANTE: Cloud Functions

### Requisitos:
- ✅ Firebase debe estar en **Plan Blaze** (pay-as-you-go)
- ✅ Cloud Functions desplegadas
- ✅ Función `createUserWithRole` activa

### Verificar si Functions está activo:

```bash
firebase functions:list
```

Debería mostrar:
```
✔ createUserWithRole (us-central1)
```

### Desplegar Functions:

```bash
cd functions
npm install
cd ..
firebase deploy --only functions
```

---

## 🚫 Seguridad Implementada

### 1. **No Registro Público**
- ❌ Eliminado endpoint de registro
- ❌ No hay formulario de sign-up
- ✅ Solo admins pueden crear usuarios

### 2. **Validación en Cloud Functions**
```javascript
// En functions/src/admin.ts
async function requireAdmin(context) {
  // Solo usuarios con rol 'admin' pueden ejecutar
}
```

### 3. **Firestore Rules**
```javascript
match /user_roles/{roleId} {
  allow read: if isAuthenticated();
  allow write: if isAdmin(); // Solo admins
}

match /users/{userId} {
  allow create: if isAdmin(); // Solo admins
  allow read: if isOwner(userId) || isAdmin();
}
```

---

## 📝 Ejemplo de Uso

### Crear primer usuario admin:

**Opción A**: Desde Firebase Console (primera vez)
```
1. Firebase Console → Authentication → Add user
   Email: admin@example.com
   Password: admin123456

2. Copiar UID del usuario

3. Firestore → user_roles → Add document
   Document ID: {uid-copiado}
   role: "admin"

4. Login en la app con admin@example.com
```

**Opción B**: Desde Cloud Function (requiere otro admin)
```javascript
// Ya implementado en la UI
```

---

## 🧪 Testing

### Test 1: Crear Usuario como Admin
```
1. Login como admin
2. /admin/create-user
3. Crear usuario "test@example.com"
4. Verificar aparece en tabla
5. Logout
6. Login como test@example.com
7. ✅ Debe funcionar
```

### Test 2: Usuario Normal NO puede crear usuarios
```
1. Login como user
2. Intentar acceder /admin/create-user
3. ✅ Debe redirigir a /unauthorized
```

### Test 3: No hay registro público
```
1. Ir a /auth
2. ✅ NO debe haber opción de "Registrarse"
3. ✅ NO debe haber botón de Google
4. ✅ Solo login con email/password
```

---

## 📊 Archivos Modificados

```
✅ src/pages/Auth.tsx
   - Eliminado signInWithGoogle
   - Eliminado formulario de registro
   - Mensaje: "Usuarios creados por admins"

✅ src/hooks/useAuth.tsx
   - Eliminado signUp()
   - Eliminado signInWithGoogle()
   - Simplificado interface

✅ src/components/admin/AdminLayout.tsx
   - Agregado item "Crear Usuario"

✅ src/App.tsx
   - Agregada ruta /admin/create-user

📄 src/pages/admin/AdminCreateUser.tsx (NUEVO)
   - Formulario completo de creación
   - Lista de usuarios
   - Info de roles
```

---

## 🎉 Resultado Final

### Pantalla de Login (/auth)
```
┌────────────────────────────────────┐
│    💪 App Hipertrofia ⚡           │
│                                    │
│  Email:    [________________]      │
│  Password: [________________]      │
│                                    │
│  [  Iniciar Sesión  ]              │
│                                    │
│  Los usuarios son creados por      │
│  administradores                   │
└────────────────────────────────────┘
```

### Panel Admin → Crear Usuario
```
┌────────────────────────────────────┐
│  🔐 Crear Usuario                  │
│                                    │
│  Nombre:     [________________]    │
│  Email:      [________________]    │
│  Contraseña: [________________] 👁  │
│  Rol:        [▼ Seleccionar]       │
│                                    │
│  [  Crear Usuario  ]               │
│                                    │
│  📋 Usuarios Registrados           │
│  ┌──────────────────────────────┐  │
│  │ Juan  │ juan@e.. │ 👤 user  │  │
│  │ María │ maria@.. │ 🎓 coach │  │
│  │ Admin │ admin@.. │ 👑 admin │  │
│  └──────────────────────────────┘  │
└────────────────────────────────────┘
```

---

**Fecha**: 2025-10-17  
**Estado**: ✅ Implementado y listo para usar  
**Requiere**: Plan Blaze de Firebase (para Cloud Functions)
