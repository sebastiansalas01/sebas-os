# SEBAS OS 0.8.0

Inicio con prioridades estilo stories antes del encabezado, ordenadas por estrellas de llamadas confirmadas y déficit de tiempo registrado en los siete días anteriores. Un cero indica falta de registro, no prueba de que no se haya realizado el hábito.

Barra verde, naranja desde la mitad y roja con 15 minutos restantes en llamadas y cinco en otras actividades. En llamadas de 90 minutos, rojo y aviso a los 75. Las llamadas usan horas de Google, los hábitos activos usan cronómetro; las rutinas aún no iniciadas se identifican como sugeridas. Avisos locales requieren opt-in y permiso, con app activa. No se promete una Live Activity de iOS ni entrega con la PWA cerrada sin backend. El servidor soporta alertas push de llamadas confirmadas y temporizadores registrados; cancelar/pausar retira el temporizador. No hay garantía al segundo exacto ni sincronización de temporizadores entre dispositivos.

Calendario elegante monocromo con columnas diarias de 7 o 14 días desde hoy, hábitos sugeridos, eventos confirmados y comidas. Scroll horizontal en móvil. Engranaje para conexiones y selección. Google sigue en solo lectura; no se crean ni borran eventos. Las reservas pendientes se conservan en el apartado de originales y siguen bloqueando huecos de comida.

Almuerzo según huecos, 30 minutos tras una llamada. Cena tras la última llamada +15 minutos de descanso. Si no hay llamadas cargadas: descanso 19:45 y cena 20:00 orientativos. Cena de 30 minutos; si coincide con inglés, este pasa después de la cena. Si la última llamada termina demasiado tarde, no se inventa un hueco de cena tras medianoche. Sin tiempo ofrece tres cenas de 3–7 minutos. Cambiar receta no borra hábitos ni comidas completadas; no implica garantías nutricionales.

Ficha de llamada con nombre del lead y primera/segunda sesión cuando el texto lo indica; en caso contrario se muestra sin especificar. Se mantiene resumen, audio e Instagram verificado del recap. El botón de ChatGPT abre una nueva consulta con el contexto, preguntas comerciales y análisis de oferta para tráfico frío; no ejecuta por sí solo investigación profunda dentro de la PWA ni asegura acceso a Instagram. El contexto viaja a ChatGPT al pulsar el enlace; no se guarda en el repo.

El backend cambia el brief de las 06:00 por preparación del día siguiente a las 23:00 Europe/Kyiv; sigue revisando durante el día. Consulta 14 fechas y acepta recap del día anterior solo con fecha o mañana explícitos, además de identidad, hora y confirmación. Hace polling cada minuto, con reintento, invalidación por reprogramación y deduplicación. No modifica las automatizaciones de ChatGPT.

**Estado real:** backend sin desplegar/autorizado; la preparación nocturna y push en segundo plano no funcionan aún en producción. Solo están implementados y probados con proveedores simulados. No se han publicado datos de leads ni secretos. Falta validación real en iPhone con permisos y servicio privado.

Validación: 70 pruebas y comprobación sintáctica. QA visual de inicio, calendario y cenas rápidas.

## 0.8.1 · Ajuste de rutina

Despertar 06:45, oración 07:00–07:10, entrenamiento, lectura 30 min y desayuno/preparación 30 min, sin huecos ni overrides antiguos que alteren el orden. Con entrenamiento de 30 min: lectura 07:40 y desayuno 08:10. Roleplay solo martes 20:00, duración inicial 30 min, provisional y sin sincronización real con mentor. Fines de semana conservan hábitos y KLIMB, sin daily, preparación, seguimientos ni roleplay laboral. No se escribe en Google. 72 pruebas.
