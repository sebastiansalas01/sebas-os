# Servicio privado de llamadas · 0.6.0

## Estado real

Código implementado en `server/`, con pruebas locales de proveedores simulados y API HTTP real en loopback. No está desplegado ni autorizado contra los proveedores. GitHub Pages sirve la PWA; no puede ejecutar este servidor. La conexión Slack de ChatGPT permite consultar desde la conversación, no concede un token reutilizable a una aplicación externa. No se reutilizaron ni copiaron credenciales de conectores.

Falta un host Node HTTPS con proceso permanente y disco privado, autorización Google de servidor con refresh token, token de usuario Slack con `search:read`, y claves VAPID. La cuenta de infraestructura consultada no tenía un backend SEBAS OS activo. No se creó infraestructura de pago ni se modificaron otros proyectos.

## Ejecutar cuando exista alojamiento autorizado

Ejecutar una sola instancia del proceso; el archivo privado no es una base de datos distribuida. Node >=22. Instalar dependencias dentro de `server` con `npm install`. Copiar `.env.example` a `.env` únicamente en el host privado, completar las variables y ejecutar `npm start` desde `server`. Alternativamente, inyectar las variables desde el gestor de secretos del alojamiento y ejecutar `node server/index.mjs` desde la raíz. El servidor requiere una clave de acceso de al menos 32 caracteres aleatorios y rechaza el ejemplo por defecto. Generarla con `crypto.randomBytes(32).toString('base64url')`, sin imprimir ni guardar claves en el repositorio.

- `APP_ORIGIN`: origen exacto de Pages, sin `/sebas-os/`.
- `OWNER_EMAIL`, `OWNER_NAME`: propietario real para identificar sus sesiones y excluirlo como lead.
- `GOOGLE_CALENDAR_IDS`: lista explícita de calendarios autorizados. `primary` se resuelve a su ID real para no duplicar eventos en el cliente. En calendarios compartidos solo se muestran eventos donde participa o figura como organizador el propietario. La selección del servidor debe mantenerse alineada con el selector del cliente; no hay edición remota de esta configuración todavía.
- `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GOOGLE_REFRESH_TOKEN`: configuración de OAuth de servidor con acceso offline y `calendar.readonly`. El flujo de consentimiento inicial se debe configurar en Google Cloud; esta versión no incorpora un asistente de OAuth de servidor. Rotar/revocar cualquier client secret compartido anteriormente; no reutilizarlo aquí.
- `SLACK_USER_TOKEN`, `SLACK_CHANNEL`: token de usuario con `search:read` y canal autorizado. El método `search.messages` no admite un bot token convencional. Puede requerir aprobación administrativa del workspace.
- `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`: par VAPID estable y contacto real; usar `web-push.generateVAPIDKeys()` en el host. No usar un subject localhost para Apple Push.
- `STATE_PATH`: archivo privado fuera de cualquier raíz web, persistente entre reinicios. Permisos 0600 para el archivo y 0700 para el directorio creado por el servicio. Configurar el alojamiento para no servir ese directorio. Contiene investigación de leads y suscripciones; limitar el acceso al propietario.

En la PWA, Ajustes → Investigación de llamadas: introducir URL HTTPS del servicio y su clave de acceso. No pegar tokens Slack ni secretos Google en el navegador. La clave de acceso se conserva solo en memoria de la sesión; al recargar se necesita volver a conectar para leer las fichas. El proceso de servidor y las suscripciones push continúan por separado cuando la app se cierra.

## Comportamiento implementado

- Polling cada minuto, exclusivamente entre 06:00 y 21:00 Europe/Kyiv por defecto. Configuración en `DAY_START`/`DAY_END`. No es un webhook ni una garantía de latencia exacta.
- Brief matinal de una sola entrega entre 06:00 y 09:00 cuando existen suscripciones; no se envía retroactivamente un supuesto mensaje matinal al arrancar por la tarde.
- Detecta sesiones nuevas por calendarId + eventId. Solo notifica sesiones futuras del mismo día. La primera carga crea una línea base sin anunciar todas las citas existentes como nuevas.
- Google: solo lectura, paginación y tiempo de Kyiv. Sincronización fallida conserva la última instantánea y muestra el error.
- Slack: busca primero email exacto; si no aparece, usa nombre completo de asistente/título. Consulta acotada al canal y 5 resultados. No usa coincidencias por un solo nombre. Un nombre encontrado no confirma asistencia: desde 0.7.0 se exigen además día, hora de recap (SLACK_TIME_ZONE, Europe/Madrid por defecto) y confirmación explícita. Cancelaciones y datos ambiguos quedan pendientes.
- Ficha: extracto real del mensaje Slack, enlace a fuente e Instagram cuando hay una URL/etiqueta explícita. No inventa dolor, facturación ni objetivos ausentes.
- Push: outbox persistente, reintentos de fallos transitorios, deduplicación por sesión y endpoint, eliminación de suscripciones 404/410. Contenido genérico en pantalla bloqueada; el lead se consulta dentro de la app.
- Acceso: bearer de alta entropía, comparación constante, CORS de origen exacto, resultados private/no-store, límites de payload, endpoints de push acotados a proveedores conocidos contra SSRF. No hay proxy arbitrario a Slack ni escritura en calendarios.
- Desconectar intenta retirar la suscripción de servidor y navegador; si falla, se avisa y se cierra la sesión local. Revocar permisos en los proveedores sigue siendo una operación separada.

## Verificación que falta antes de anunciarlo operativo

Desplegar el backend, completar autorizaciones, consultar una sesión propia real, comprobar la coincidencia de identidad, pulsar leer resumen y escuchar el resultado en iPhone. Crear una sesión de prueba propia para el mismo día, esperar detección, cerrar/bloquear la PWA y verificar entrega. Probar revocación de permisos, reinicio del servidor, quiet hours, entrega tras fallos y eliminación de suscripciones. No usar citas ni calendarios de Impulso como entorno de pruebas de escritura.

El socket HTTP local y los adaptadores simulados no acreditan acceso real a Google/Slack ni entrega APNs/Web Push.
