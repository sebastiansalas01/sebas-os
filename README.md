# SEBAS OS

PWA personal existente, publicada en https://sebastiansalas01.github.io/sebas-os/.
HTML, CSS y JavaScript estáticos; sin dependencias de ejecución ni módulo de finanzas.

## Versión 0.6.0

Inicio con reloj de Kyiv, actividad actual/siguiente y navegación directa. Gimnasio de 30/45/60 min, fases guiadas y vídeos originales. Lectura de 30 min. El circuito es propio; no se afirma que sus ejercicios provengan de Jaeho. Dos vídeos probados bloquean su incrustación y se abren en YouTube.

La interfaz de investigación de llamadas y su backend Node están implementados. El backend NO está desplegado ni autorizado. La conexión Slack de ChatGPT no se puede reutilizar automáticamente desde la PWA. Ver [configuración y límites del servicio](docs/private-service.md) y [fuentes de entrenamiento](docs/workout-sources.md).

## Desarrollo y validación

Node 24: `npm run check` y `npm test`. GitHub Actions ejecuta ambas comprobaciones en cada push/PR. Servir la raíz por HTTP para desarrollo; no requiere compilación. GitHub Pages sirve la raíz de `main`.

- `index.html`: estructura y navegación.
- `styles.css`: presentación responsive y accesibilidad.
- `core.js`: fechas Kyiv, cronómetros, selección y comparación de calendarios; compartido con tests.
- `planner-core.js`: agenda por hora, prioridad de eventos y fases de entrenamiento.
- `planner-ui.js`: inicio, actividades guiadas, vídeos, investigación privada y lectura en voz alta.
- `server/`: servicio privado opcional, separado del hosting estático; sin secretos.
- `app.js`: vistas, OAuth de lectura, persistencia e interacción.
- `sw.js`: shell offline versionado; nunca almacena respuestas de Google ni tokens.
- `tests/`: pruebas de lógica y renderizado con DOM simulado. No sustituyen Safari real.

## Datos y privacidad

Los datos permanecen en localStorage de este origen/dispositivo. Se conservan las claves anteriores `sebasos`, `sebasTrackedV1`, `sebasAllowedCalendars`. El cronómetro activo se almacena en `sebasActiveTrack`. Borrar los datos del sitio elimina estos registros; no hay sincronización entre dispositivos ni copias de seguridad automáticas. Usar una sola pestaña para registrar actividad: todavía no hay coordinación de escrituras entre pestañas.

Los cronómetros cuentan desde la marca de inicio incluso tras cerrar la app, hasta pausar/terminar o la siguiente medianoche de Kyiv. No son una medición de presencia: pausa al dejar de hacer la actividad. Marcar terminado no inventa minutos. El temporizador de enfoque antiguo sigue siendo una utilidad separada no persistente, sin alarmas de fondo.

## Google Calendar

OAuth sigue usando exclusivamente `calendar.readonly`. Client ID público conservado; tokens solo en memoria, reconexión necesaria al recargar/expirar. No usar client secrets en una PWA; revocar/rotar cualquier secreto que se haya compartido fuera de Google Cloud.

Por defecto solo se incluyen el calendario primario y calendarios identificados como Impulso; B360 Agencia y JustSales se excluyen. Selección explícita persistida por ID, incluso lista vacía. Las selecciones explícitas anteriores se conservan: revísalas en Calendario. Ventana: hoy y próximos siete días según Kyiv. Los offsets de Google resuelven Madrid/Kyiv y DST. Reprogramaciones comparadas por ID de calendario/evento y campos `updated`, inicio y fin. Cambios fuera de la ventana se describen como retirados, sin afirmar que fueron cancelados. Un error conserva la última sincronización y muestra el fallo; no se presenta como sincronización correcta.

Sin backend autorizado, solo hay avisos dentro de la app durante sincronización. La integración privada de Slack requiere desplegar y configurar `server/`: un evento de Google no implica una llamada comercial confirmada. No se publican datos comerciales ni credenciales. Importador ICS heredado: no interpreta correctamente todas las reglas TZID/recurrencia; revisar horas o preferir Google.

## Validación de esta versión

35 tests automatizados locales aprobados: vistas, persistencia, pausas, medianoche y DST, selección de calendarios, reprogramación por ID, errores 401 y escaping. Navegador Chromium: inicio, cronómetro con recarga/pausa, guardado de lectura y persistencia. Inicio comprobado en contenedores de 375, 390, 768 y 1280 px sin overflow horizontal del documento. Es comprobación responsive, no emulación de iPhone ni prueba en hardware.

Pendientes de validación real: OAuth del usuario contra Google en esta versión, instalación/offline en Safari iPhone, VoiceOver y push. Fotos heredadas de Unsplash se etiquetan como ilustrativas; faltan imágenes propias exactas y paquete offline de fotografías.

Ver `CHANGELOG.md` y `docs/notifications.md`.
