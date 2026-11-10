# Slack directo en SEBAS OS

La PWA de GitHub Pages no puede guardar el secreto OAuth. El servicio Node privado incluye el flujo de autorización y almacenamiento cifrado; debe publicarse por HTTPS antes de activarlo en la PWA. No publicar credenciales en GitHub ni pegarlas en la PWA.

## Configuración del servicio

Además de `SEBAS_ACCESS_KEY`, `APP_ORIGIN` y las variables existentes de Google, configurar mediante el gestor de secretos del alojamiento:

- `SLACK_CLIENT_ID` y `SLACK_CLIENT_SECRET`: credenciales de una app de Slack propia.
- `SLACK_REDIRECT_URI`: URL HTTPS exacta del servicio terminada en `/api/slack/callback`, también registrada en OAuth & Permissions de Slack.
- `SLACK_ENCRYPTION_KEY`: clave aleatoria hexadecimal de 64 caracteres (32 bytes).
- `SLACK_CREDENTIALS_PATH`: ruta privada en almacenamiento persistente, por defecto `/var/lib/sebas-os/slack.enc.json`.

Permiso OAuth de usuario: `search:read`. No se solicitan permisos de escritura. La implementación actual necesita tokens sin rotación habilitada; rechaza tokens con caducidad/rotación para evitar indicar una conexión que dejaría de funcionar sin renovación.

## Flujo

En Ajustes, conectar el servicio privado y luego pulsar **Conectar con Slack**. Slack muestra el consentimiento; el callback valida un estado aleatorio de un solo uso y cinco minutos, verifica el token y lo cifra en el servidor. La PWA recibe únicamente el estado, el workspace y el canal. Elegir el nombre del canal de investigación y guardar. El estado conectado se confirma con `auth.test`; errores conservan los datos anteriores y se muestran como conexión no verificada.

La clave del servicio permanece en memoria de la PWA y se vuelve a introducir al abrir una sesión nueva. El servicio es de un solo propietario. No es un servicio multiusuario y no debe compartirse su clave.

## Verificación

`npm test` desde la raíz del proyecto prueba estados caducados, repetición, ausencia de permisos, cifrado, protección de endpoints y desconexión. Falta verificar OAuth contra el workspace real después de publicar el servicio y registrar la app de Slack.

Referencia oficial: https://docs.slack.dev/authentication/installing-with-oauth/
