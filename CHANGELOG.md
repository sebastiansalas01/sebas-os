# Cambios

## 0.8.0 — 2026-11-09

- Prioridades tipo stories basadas en llamadas confirmadas y tiempo registrado durante siete días.
- Barras de progreso verde/naranja/rojo. Aviso 15 minutos antes del fin en llamadas y cinco en hábitos; opt-in local y soporte privado push, sin prometer segundo plano sin servidor.
- Calendario monocromo de 7/14 días, engranaje de Google, fichas de leads y acceso contextual a ChatGPT.
- Cena tras última llamada y 15 minutos de descanso; alternativas de 3–7 minutos sin borrar registros.
- Preparación nocturna de mañana a las 23:00 Kyiv, recaps explícitos de mañana y ventana de 14 fechas. Backend todavía sin desplegar/autorizar.
- 70 pruebas aprobadas. Ver docs/release-0.8.md.


## 0.7.0 — 2026-11-09

- Hábitos sin Descanso, ordenados por hora propuesta. Cronómetros visibles en cada tarjeta y desplegables que conservan su estado al iniciar, pausar, terminar, cambiar de pantalla y recargar.
- Terminar abre confirmación del objetivo o edición de minutos. No se completa antes de aceptar. Se conserva por separado el tiempo medido y el tiempo declarado por el usuario; cancelar no rellena la meta.
- Lectura simplificada a libro actual Hábitos atómicos, portada de la editorial, página actual y guardado; sin campo de notas. Los datos antiguos se conservan, sin mostrarlos como notas nuevas.
- 26 recetas fáciles: seis desayunos (incluidos los tres habituales), seis almuerzos, seis cenas y ocho meriendas. Selección diaria persistente, ingredientes, pasos y lista de compra.
- Snacks de mañana/tarde en la rutina. Propuesta de almuerzo según las reservas reales, 30 minutos después de una llamada; edición de la hora solo para hoy y detección de conflictos. Sin calendario conectado, la propuesta se identifica como orientativa.
- Horario de llamadas: solo incluye sesiones con confirmación explícita de recap, coincidencia de identidad, fecha y hora; cambios de Google invalidan confirmaciones anteriores. Las pendientes permanecen separadas y siguen visibles en Calendario.
- Valoración orientativa de 1–3 estrellas con motivos comerciales del recap. Sin evidencia suficiente se muestra Sin valorar; no se equipara ausencia de datos a mala calidad.
- Backend preparado para cruce a las 06:00 Kyiv y revisiones diurnas. Sigue sin desplegar/autorizar; no se anuncia sincronización automática real.
- 62 pruebas locales aprobadas. Shell offline v14 con los nuevos módulos de hábitos/comidas.

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
