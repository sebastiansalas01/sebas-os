# Notificaciones: arquitectura pendiente de desplegar

GitHub Pages no ejecuta procesos de servidor. Esta versión no promete alertas con la app cerrada ni instala un backend ficticio.

## Contrato de la siguiente fase

1. Backend HTTPS autenticado para un único propietario. OAuth authorization-code con PKCE y token de renovación cifrado en servidor; Client Secret, clave VAPID y clave de cifrado únicamente en el gestor de secretos.
2. Persistir selección de IDs y snapshots privados por usuario. No almacenar títulos, tokens ni eventos en repositorio o logs públicos.
3. Crear canal Calendar `events.watch` por calendario autorizado; guardar resourceId/channelId/token y vencimiento. Validar cabeceras entrantes, responder rápido y procesar trabajos idempotentes. Renovar canales antes de expirar. Son señales de cambio, no contienen el evento completo.
4. Sincronización incremental con syncToken por calendario; paginación y borrado explícito de cancelados. Ante 410, invalidar token y reconstruir snapshot. Polling de respaldo con presupuesto y reintentos limitados.
5. Identidad de evento: usuario + calendarId + eventId (incluye instancia recurrente). Generar cambios respecto al snapshot anterior; deduplicar por ID y versión `updated`. No tratar una salida de la ventana como cancelación.
6. Suscripción Web Push autenticada (`POST /push/subscriptions`), VAPID y mensajes mínimos sin datos comerciales en pantalla bloqueada por defecto. Revocar suscripción al desconectar. Nunca aceptar URLs de push arbitrarias sin validación contra SSRF.
7. Service worker con `push`/`notificationclick`, deep link al evento y readback al abrir. iOS requiere validar compatibilidad en PWA instalada y permiso solicitado desde un gesto del usuario.

## Endpoints propuestos

- `GET /auth/google/start`, `GET /auth/google/callback`, `POST /auth/logout`
- `GET /calendar/events`, `PUT /calendar/selection`
- `POST /webhooks/google/calendar`
- `POST /push/subscriptions`, `DELETE /push/subscriptions/:id`
- Proceso programado: renovar canales y reconciliar cambios.

## Pruebas exigidas antes de anunciar push operativo

Crear, mover y cancelar un evento de prueba propio; duplicar y desordenar callbacks; expirar canal y syncToken; revocar OAuth; comprobar recuperación ante caída del proveedor; validar aislamiento de datos y ausencia de secretos en logs; verificar entrega con iPhone bloqueado, app cerrada, PWA instalada y permiso concedido. Medir latencia real. No modificar calendarios de Impulso para estas pruebas.

No está implementado ni publicado este backend. Se conserva Google Calendar en modo solo lectura en el cliente.
