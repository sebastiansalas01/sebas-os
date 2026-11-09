# Hábitos, lectura, comidas y confirmaciones · 0.7.0

## Hábitos y tiempo

Descanso deja de aparecer como hábito y no cuenta para sus estadísticas; los registros antiguos no se borran. El bloque nocturno de desconexión sigue en la rutina sin checkbox de hábito. Oración, entrenamiento, lectura, role play, seguimientos, inglés y KLIMB se ordenan por la hora propuesta del día; cuando no hay hueco se indica en vez de inventar uno.

Los desplegables guardan su estado en `sebasUiOpenSections`. Terminado pausa el cronómetro correspondiente y pide confirmar el objetivo o introducir otros minutos. Confirmar sustituye el total diario de esa actividad por lo declarado, no lo suma dos veces. `seconds` es el tiempo registrado; `measuredSeconds` conserva lo medido por el cronómetro; `source: reported/mixed` distingue los registros editados. Nunca se presenta una declaración manual como una medición real. Cancelar conserva el hábito pendiente y el cronómetro pausado. La confirmación conserva el día original si cruza medianoche.

## Libro actual

Hábitos atómicos, James Clear. Solo página actual, guardar e historial de páginas; sin editor de notas. La portada se carga desde la fuente editorial, con crédito y alternativa visual si no hay conexión:

https://www.planetadelibros.com/libro-habitos-atomicos/310441

No se redistribuye texto del libro. Las notas antiguas no se borran del almacenamiento; dejan de aparecer en la interfaz. Si había otro libro guardado, se conserva antes de guardar el nuevo.

## Comidas y horario

26 opciones: seis desayunos, seis almuerzos, seis cenas y ocho meriendas. Se incluyen huevos con verduras, huevos cocidos con tostada/mantequilla de maní y café con leche, y bol de yogur/leche/avena/proteína/arándanos/banano. Las selecciones se guardan por día y tipo de comida. Las ilustraciones son iconos de alimentos, no fotografías atribuidas falsamente a una receta.

Snacks orientativos a las 11:00 y 17:00, desplazados a un hueco entre reservas. El almuerzo busca 30 minutos libres entre las 13:00 y las 17:00, con al menos 30 minutos tras el final de una llamada/reserva. También protege las reservas de Google pendientes de confirmar, aunque no se anuncien como llamadas confirmadas. El usuario puede cambiar la hora de hoy; si hay conflicto se propone una alternativa y no se guarda como libre. Sin Google conectado, se muestra explícitamente que la hora es orientativa. Si no hay hueco, se pide revisar el horario.

Las meriendas se muestran como actividades del horario y accesos a comida; no incrementan el contador de hábitos. No son notificaciones de fondo sin backend.

## Confirmaciones, investigación y estrellas

El horario comercial usa solo tarjetas con `confirmed: true`, `eventUpdated` y `sessionStart` coincidentes con el evento actual. Una reprogramación no conserva por error la confirmación anterior. Las reservas pendientes siguen disponibles en Calendario y, separadas, en Impulso.

El adaptador de Slack compara email o nombre completo, día de publicación del recap, hora convertida desde Google a la zona configurada de Slack (Europe/Madrid por defecto), y un marcador explícito de confirmación. Una marca de check requiere contexto de sesiones confirmadas/“contamos con”; encontrar un nombre o un horario por sí solos no basta. Cancelación explícita prevalece. El parser es conservador: formatos no reconocidos, recaps de otro día o sin hora quedan pendientes. No sustituye una revisión humana de identidad ni una integración transaccional de confirmación.

Estrellas orientativas basadas solo en evidencia comercial del extracto Slack:

- 3: oferta/clientes activos, necesidad comercial explícita y presupuesto/capacidad de inversión mencionados.
- 2: señales parciales de oferta o necesidad, con motivos mostrados.
- 1: limitación explícita de presupuesto u oferta.
- Sin valorar: información insuficiente; no se inventa una estrella negativa.

No se usan rasgos protegidos, salud, origen ni aspectos personales para valorar leads. No se predice una compra ni se afirma haber investigado perfiles de Instagram que no se hayan consultado. La fuente del recap es accesible desde la ficha.

## Consulta de las 06:00: estado real

El proceso privado está preparado para iniciar consultas a las 06:00 Europe/Kyiv, enviar un único brief matinal y revisar durante el día. Su intervalo es de un minuto, sin garantía de ejecución al segundo exacto. Los adaptadores y el primer brief se prueban con proveedores simulados.

**El backend continúa sin desplegar ni autorizar contra Google/Slack. No hay una consulta automática funcionando a las 06:00 en la PWA publicada.** Se requieren alojamiento privado y autorizaciones del servidor. La conexión de ChatGPT no se copia al frontend, y no se han publicado recaps, credenciales ni leads reales en el repositorio. La automatización existente de ChatGPT no se sustituye por esta configuración del producto.

Ver private-service.md para los requisitos. Falta verificar los datos reales, entrega push y Safari/iPhone tras autorizar el backend.
