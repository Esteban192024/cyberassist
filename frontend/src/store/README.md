# Store Global - Fuente Única de Verdad

## Resumen de la Auditoría de Consistencia

Se ha creado un **Store Global Centralizado** (`userStore.js`) que actúa como la única fuente de verdad para todos los datos del usuario, garantizando consistencia entre todos los módulos.

## Problemas Identificados y Solucionados

### Antes de la Migración:
- ❌ Cada módulo calculaba estadísticas localmente
- ❌ Lectura directa de localStorage en múltiples componentes
- ❌ Cálculos duplicados de contadores y promedios
- ❌ Posibles desincronizaciones entre pantallas

### Después de la Migración:
- ✅ Todas las estadísticas provienen de `userStore.js`
- ✅ Cálculos centralizados y consistentes
- ✅ Garantía de que todos los módulos muestran los mismos datos

## Módulos Migrados

### 1. DashboardStudent.jsx
- **Antes**: Calculaba `diagnosticsCount`, `simulationsCompleted`, `badgesEarned` localmente
- **Ahora**: Usa `getDashboardStats()` y `getEvolutionData()` del store
- **Estado**: ✅ Migrado

### 2. Profile.jsx
- **Antes**: Calculaba `diagnosticsCount`, `simulationsCount`, `avgScore`, `avgSimulationScore` localmente
- **Ahora**: Usa `getProfileStats()` del store
- **Estado**: ✅ Migrado

### 3. Results.jsx
- **Antes**: Calculaba `diagnosticsComplete`, `simulationsComplete`, `certificateUnlocked` localmente
- **Ahora**: Usa `getResultsData()`, `getCombinedHistory()`, `getEvolutionData()` del store
- **Estado**: ✅ Migrado

### 4. Simulations.jsx
- **Antes**: Calculaba `diagnosticsComplete`, `simulationsComplete`, `certificateUnlocked` localmente
- **Ahora**: Usa `getSimulationsData()` del store
- **Estado**: ✅ Migrado

### 5. Diagnostic.jsx
- **Estado**: ✅ No requiere migración (solo escribe datos, no lee estadísticas)

## Datos Centralizados en userStore.js

### Estadísticas de Usuario:
- `xp`: Puntos de experiencia
- `level`: Nivel actual (1-5)
- `levelName`: Nombre del nivel
- `levelIcon`: Icono del nivel
- `nextLevelXP`: XP necesaria para el siguiente nivel
- `currentLevelXP`: XP del nivel actual
- `progressPercentage`: Porcentaje de progreso al siguiente nivel

### Diagnósticos:
- `diagnosticsCount`: Cantidad de diagnósticos completados (máx 5)
- `diagnosticsComplete`: Si ha completado 5 diagnósticos
- `results`: Array de todos los resultados
- `latestResult`: Último diagnóstico completado
- `avgScore`: Promedio de puntajes
- `bestScore`: Mejor puntaje obtenido
- `lastScore`: Puntaje del último diagnóstico
- `securityLevel`: Nivel de seguridad (Alto/Medio/Bajo)

### Simulaciones:
- `simulationsCount`: Cantidad de simulaciones completadas (máx 5)
- `simulationsComplete`: Si ha completado 5 simulaciones
- `simulationsResults`: Array de todos los resultados
- `latestSimulationResult`: Última simulación completada
- `avgSimulationScore`: Promedio de puntajes

### Logros:
- `unlockedAchievements`: Array de IDs de logros desbloqueados
- `allAchievements`: Array de todos los logros disponibles
- `achievementProgress`: Objeto con progreso de logros
- `badgesEarned`: Cantidad de insignias obtenidas

### Certificados:
- `certificateUnlocked`: Si el certificado está desbloqueado
- `canUnlockCertificate`: Si puede desbloquear el certificado

## Funciones del Store

### Funciones Principales:
- `getUserData()`: Obtiene todos los datos del usuario
- `getDashboardStats()`: Estadísticas resumidas para el dashboard
- `getProfileStats()`: Estadísticas detalladas para el perfil
- `getResultsData()`: Datos para la página de resultados
- `getSimulationsData()`: Datos para la página de simulaciones

### Funciones Auxiliares:
- `checkAchievementUnlocked()`: Verifica si un logro está desbloqueado
- `getCombinedHistory()`: Historial combinado de diagnósticos y simulaciones
- `getEvolutionData()`: Datos para gráficos de evolución
- `useUserData()`: Hook React para reactividad (opcional)

## Garantía de Consistencia

Todos los módulos ahora muestran exactamente:
- ✅ **Mismo XP**: Proviene de `getUserLevelData()` en `levelHelper.js`
- ✅ **Mismo Nivel**: Calculado por `calculateLevel()` en `levelHelper.js`
- ✅ **Mismos Logros**: Proviene de `getUnlockedAchievements()` en `achievementsHelper.js`
- ✅ **Mismas Simulaciones Completadas**: Calculado en `getUserData()`
- ✅ **Mismos Diagnósticos Completados**: Calculado en `getUserData()`

## Accesos Directos a localStorage (Aceptables)

Los siguientes accesos directos a localStorage se mantienen intencionalmente:
- `currentUser`: Necesario para autenticación
- Escritura de resultados: Necesaria para guardar nuevos datos
- Lectura de `results` en DashboardStudent: Solo para `latestResult`

Estos no afectan la consistencia de las estadísticas mostradas.
