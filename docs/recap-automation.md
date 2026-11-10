# Agenda nocturna SEBAS OS

Estado de esta entrega: tarea activa a las 00:00 Europe/Kyiv. El propietario autorizó explícitamente el 10 de noviembre de 2026 el almacenamiento de nombres, horarios, informes e Instagram en su Supabase privado para SEBAS OS. La tarea ya permite la entrega a ese destino; no requiere volver a pedir el mismo permiso. Se mantiene la privacidad: ningún dato de clientes se publica en GitHub ni Pages.

## Destino preparado

Proyecto Supabase existente `jrkrwayspxifcbngqmsf` (organización del usuario, plan gratuito). Función `sebas-recap`, con autenticación propia mediante token aleatorio de dispositivo de 256 bits; sin acceso público a datos. Tablas `sebas_os_snapshots`, `sebas_os_devices`, `sebas_os_pairings`: RLS habilitado, sin permisos anon/authenticated, acceso exclusivo de servicio. Función SQL `sebas_os_claim`: security invoker, ejecución solo por service_role.

El PWA usa únicamente una clave publicable, que no autoriza la lectura. Emparejamiento mediante código privado aleatorio de 96 bits, de un solo uso y con caducidad. Tokens de dispositivo almacenados solo como SHA-256 en el servidor; caducidad 90 días. El navegador conserva su token y la última agenda para continuidad. Desconectar revoca ese dispositivo y borra su caché local.

## Datos de cada agenda

`version:1`, `day` YYYY-MM-DD (Kyiv), `generatedAt` ISO, `sessions[]`:

- `id`: estable por timestamp fuente, fecha y nombre completo.
- `name`, `start` ISO con zona explícita, `status`: confirmed/pending.
- `report`: informe del bloque de ese cliente, sin enlaces web ajenos a Instagram.
- `sourceText`: bloque original de ese cliente, usado para acreditar Instagram.
- `instagram`: solo perfil explícito en ese mismo bloque; vacío si no figura.
- `sourceTs`, `sourceUrl` opcional solo Slack.

`recap-core.js` fuerza 90 minutos y calcula el final. No usar duración de Google para recortar una llamada del recap. Coincidencias de nombre completo y hora se fusionan conservando el enlace de reunión de Google. Recaps pendientes no bloquean el horario como si estuvieran confirmados. La fecha del encabezado manda sobre la publicación. Respetar Europe/Madrid→Europe/Kyiv y cambios de hora.

## Flujo autorizado

1. Verificar otra vez la conexión y los permisos de Slack #recaps-comercial `C095R1FMXL6`.
2. Obtener recap actual completo, aislar a Sebas y contrastar modificaciones/reasignaciones. Validar el objeto con `SebasRecap.snapshot` o parsear con `SebasRecap.parse`; no mezclar informes entre clientes.
3. `server/recap-ingest.mjs` acepta JSON en stdin y genera un upsert SQL con carga codificada. Ejecutarlo con el conector Supabase exclusivamente en el proyecto aprobado. No subir datos a GitHub. La escritura solo reemplaza snapshots más antiguos.
4. Comprobar fecha, número de sesiones y cada duración tras el guardado. Un error no equivale a agenda vacía; conservar la última válida.
5. La tarea nocturna existente ya permite únicamente este destino aprobado. Su ID se conserva en la conversación; no crear una tarea duplicada.
6. Generar un código de emparejamiento privado de un solo uso, guardar únicamente su hash y entregar el código al propietario en privado. No poner códigos ni tokens en el repositorio.
7. El usuario lo pega una vez en Más → Ajustes → Conexiones → Agenda nocturna. Verificar recepción real antes de afirmar que la entrega funciona.

## Verificación realizada

Pruebas unitarias: filtrado Sebas/otros closers, aislamiento Instagram, duración 90, fechas y DST, deduplicación Google, payload inválido, upsert codificado, UI y escapes. Prueba del servicio desplegado con datos vacíos: emparejamiento 200, lectura autenticada 200, repetición de código 401, origen no autorizado 403, desconexión 200 y token revocado 401. Tras la autorización explícita posterior, se ha validado una entrega real de la agenda del día con informes y cambios de asignación, lectura autenticada HTTP 200 y todas las duraciones a 90 minutos. El dispositivo temporal de QA quedó revocado. La primera ejecución nocturna programada todavía no está verificada.


## Actualización manual

El botón **Actualizar** abre ChatGPT con una petición preparada de ejecutar la tarea existente. El usuario debe enviar esa petición. Al volver a SEBAS OS se consulta el resultado; cargar datos guardados no se presenta como una revisión nueva de Slack. Se muestra la hora real de `generatedAt`, y si hay una petición manual sin snapshot posterior se indica que todavía no hay resultado nuevo.

La tarea personal no dispone de un endpoint HTTP que esta PWA pueda invocar directamente. El lanzamiento externo automático requeriría un agente de workspace publicado con canal API y un Workspace Agent access token del propietario, configurado exclusivamente en el servidor. No reutilizar sesiones de navegador ni exponer tokens de ChatGPT para simular esa capacidad. No afirmar que el botón ejecuta la tarea en segundo plano.

La identidad Slack verificada es `U0AMLG2HBHP`, y se contrastan las asignaciones nuevas y cambios en el canal comercial `C09635Y0Y56`, además del recap. Las horas originales son siempre Europe/Madrid; el destino Europe/Kyiv es una hora más en la fecha de esta entrega.
