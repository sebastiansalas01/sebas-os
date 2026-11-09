# Cambios

## 0.6.1 — 2026-11-09

- Selector persistente Casa / Gimnasio. Casa mantiene vídeos y circuito; Gimnasio usa rutinas de fuerza con series, repeticiones objetivo y descansos.
- Rutina por día de la semana y botón Cambiar rutina: pierna, empuje, tirón, torso, core/abs, cuerpo completo y recuperación/movilidad. El override solo dura hoy.
- En gimnasio, 30/45/60 min seleccionan 4/5/6 ejercicios; 2/3 series por ejercicio y descanso orientativo de 75 s. La duración es tiempo reservado, no una promesa de completar la rutina exacta en ese plazo.
- Registro manual de series realizadas y progreso de la sesión/resto del descanso persistentes. El descanso no cuenta tiempo mientras el cronómetro está pausado. No se inventan repeticiones realizadas ni peso usado.
- Actualización de caché: assets frescos por versión y aviso de recarga, evitando reinstalar ficheros antiguos de la caché HTTP.
- 43 pruebas automatizadas aprobadas; Casa/Gimnasio, cambio a pierna y persistencia de series/resto del descanso verificados en navegador. Ver docs/verification-0.6.md.

## 0.6.0 — 2026-11-09

- Inicio guiado por la hora actual de Kyiv: ahora, siguiente actividad con hora y acceso directo; reuniones reales tienen prioridad sobre bloques sugeridos.
- Accesos rápidos a gimnasio, lectura, inglés y oración; horarios habituales editables; descanso nocturno y siguiente bloque de mañana.
- Entrenamiento 30/45/60 min: 5/7/10 ejercicios, fases 40/20, calentamiento y vuelta a la calma, pausa y recuperación tras recarga.
- Biblioteca de seis vídeos originales de Jaeho Fitness con enlaces y reproductor cuando el canal lo permite. Los dos vídeos probados con bloqueo de incrustación muestran enlace externo explícito.
- Lectura fijada a 30 minutos y pantalla de cronómetro para cualquier actividad.
- Pantalla Impulso con fichas privadas, fuente Slack, enlace Instagram y lectura en español. Sin fichas de ejemplo presentadas como leads reales.
- Backend Node implementado: Google offline, consulta acotada de Slack, polling diurno, brief matinal, outbox/reintentos Web Push, API autenticada y sin caché pública. No desplegado ni autorizado: requiere host y credenciales propias.
- 35 pruebas automatizadas locales aprobadas, incluyendo reloj, prioridad de citas, sesiones, API HTTP, aislamiento de origen, enlaces seguros y notificaciones simuladas. Ver docs/private-service.md y docs/workout-sources.md para límites.

## 0.5.0 — 2026-11-09

Continuación sobre `5f1a79c`, sin reconstrucción.

- Separación de CSS, lógica compartida y aplicación; pruebas Node sin dependencias.
- Cronómetros persistentes, pausa/reanudación, cierre en medianoche Kyiv y respeto a DST.
- Estadísticas con ventanas civiles exactas de 7/30 días y tiempo activo en la consulta.
- Home con siguiente hábito/evento, controles de pausa y actividades plegables.
- Metas editables; inglés mínimo 60 minutos; descanso y KLIMB de fin de semana.
- Eventos que cruzan medianoche o duran varios días; orden por instante real y deduplicación por ID.
- Calendar: inclusión predeterminada restringida, IDs persistentes, cambios por ID/updated, errores visibles y protección frente a respuestas obsoletas.
- Registro de libro, páginas, notas e historial; registro de series/repeticiones/peso.
- Lista de compra desde menú diario, snack y desayuno ampliado; fotos identificadas como ilustrativas.
- Escape de contenido editable, recuperación ante JSON dañado, aviso de fallo al guardar, foco visible, navegación activa y modal con Escape/foco restaurado.
- Shell offline v6 con assets locales instalados juntos.

### Todavía pendiente

Backend/push con app cerrada, confirmaciones reales Slack, prueba OAuth en Safari/iPhone, biblioteca de varios libros con edición, rachas, registro avanzado de progreso de gimnasio, fotos exactas/offline y respaldo/sincronización de datos entre dispositivos.
