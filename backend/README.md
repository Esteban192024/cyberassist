# Asistencia Cibernética - Backend

Backend para la aplicación de ciberseguridad "Asistencia Cibernética".

## Tecnologías

- Node.js
- Express
- PostgreSQL (Neon)
- Prisma ORM
- JWT
- bcrypt
- dotenv
- Zod

## Configuración Inicial

### 1. Instalar dependencias

```bash
cd backend
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Edita `.env` con tus credenciales de Neon PostgreSQL:

```env
DATABASE_URL="postgresql://username:password@host:5432/database?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:5173"
```

### 3. Generar cliente Prisma

```bash
npm run prisma:generate
```

### 4. Ejecutar migraciones

```bash
npm run prisma:migrate
```

Esto creará todas las tablas en PostgreSQL según el schema.prisma.

### 5. (Opcional) Abrir Prisma Studio

```bash
npm run prisma:studio
```

## Ejecutar el servidor

### Desarrollo (con hot reload)

```bash
npm run dev
```

### Producción

```bash
npm start
```

El servidor estará disponible en `http://localhost:3001`

## Endpoints disponibles

### Health Check
- `GET /health` - Verifica que el servidor está funcionando

### Autenticación
- `POST /api/auth/register` - Registrar nuevo usuario
- `POST /api/auth/login` - Iniciar sesión

### Usuarios
- `GET /api/users/profile` - Obtener perfil del usuario (requiere autenticación)
- `PUT /api/users/profile` - Actualizar perfil del usuario (requiere autenticación)

## Estructura del proyecto

```
backend/
├── src/
│ ├── controllers/     # Controladores de lógica de negocio
│ ├── routes/          # Definición de rutas de la API
│ ├── middleware/      # Middleware de autenticación y validación
│ ├── services/        # Servicios adicionales
│ ├── prisma/          # Cliente de Prisma
│ ├── utils/           # Utilidades (JWT, bcrypt, etc.)
│ └── app.js           # Punto de entrada de la aplicación
├── prisma/
│ └── schema.prisma    # Esquema de base de datos
├── .env               # Variables de entorno (no versionado)
├── .env.example       # Ejemplo de variables de entorno
└── package.json       # Dependencias del proyecto
```

## Modelo de datos

### Entidades

- **User**: Usuarios del sistema (estudiantes y administradores)
- **Diagnostic**: Resultados de diagnósticos de ciberseguridad
- **Simulation**: Resultados de simulaciones prácticas
- **Achievement**: Logros desbloqueables
- **UserAchievement**: Relación entre usuarios y logros
- **Certificate**: Certificados emitidos
- **ActivityLog**: Registro de actividades de usuarios
- **UserProgress**: Progreso general del usuario en el programa

## Próximos pasos

1. Implementar controladores para diagnostics, simulations, achievements, certificates y activities
2. Crear rutas adicionales para estas entidades
3. Implementar servicios de lógica de negocio
4. Agregar tests unitarios y de integración
5. Configurar despliegue en producción
