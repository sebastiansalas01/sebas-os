# SEBAS OS → Centro de mando de KLIMB · Auditoría, arquitectura y plan

Autor: Claude Code · Fecha: 2026-11-12 · Rama: `claude/klimb-ecommerce`
Referencia: [`KLIMB_MISSION_CONTROL.md`](../KLIMB_MISSION_CONTROL.md) (fuente de verdad compartida con ChatGPT).

## Visión del propietario (Sebastián, 12-nov)

> La app tiene que ser mi centro de mando: que me diga paso a paso dónde tengo que ir, que me investigue productos, que me dé insights. Absolutamente todo. Claude construye; Claude y ChatGPT la mejoran juntos.

Objetivo de negocio: 15.000 €/mes de facturación e-commerce antes del **31-dic-2026** (fecha confirmada por Sebastián el 12-nov; sustituye al 27-dic). Es una aspiración, no una previsión.

## Reparto de roles (acordado para ir más rápido)
- **Claude Code — construye**: escribe el código, los tests y abre los PR. También hace investigación de mercado con búsqueda web cuando se le pide.
- **ChatGPT — dirige el negocio y revisa**: estrategia, investigación de productos y competidores, revisión de PR contra Mission Control y decisiones de negocio. Solo hace cambios de código pequeños y acotados, avisando antes.
- **Sebastián — decide y ejecuta**: aprueba gastos, proveedores y publicaciones, y hace el trabajo diario que marca la app.

---

## 1. Auditoría técnica (estado de `main` en `a35f7a6`)

### 1.1 Arquitectura actual
- PWA estática en GitHub Pages: `index.html` + módulos `*-core.js` (lógica pura) y `*-ui.js` (render). Sin build ni dependencias. Bien para velocidad; frágil para crecer (líneas de >2.000 caracteres en 11 sitios, HTML generado con concatenación de strings).
- Persistencia: `localStorage` del navegador. **No hay sincronización entre dispositivos** para objetivos, hábitos ni proyectos.
- Backend: existen `server/` (Node, no desplegado) y una Edge Function de Supabase (`sebas-recap`) con emparejamiento de dispositivos y snapshots diarios. Es la única pieza en la nube y está pensada para recaps de Impulso.
- Google Calendar: conectado desde el cliente (OAuth en navegador). Los eventos se etiquetan con `tab:'impulso'` (`planner-core.js`, función `agenda`).
- CI: GitHub Actions ejecuta `npm run check` y `npm test` en cada push/PR.

### 1.2 Hallazgos

| Prioridad | Hallazgo | Evidencia | Impacto |
|---|---|---|---|
| P0 | **CI en rojo: 9 de 123 tests fallan** | `npm test` → 114 ok / 9 fail (tests 28, 33, 36, 71, 82, 83, 84, 90, 95) | Los cambios recientes de rutina se publicaron sin actualizar tests; no hay red de seguridad contra regresiones. |
| P0 | **Solapamientos en la rutina de fundador** (todos los días desde el 14-nov) | `founderRoutine()` añade comidas de `SebasLife.mealSchedule()` sin reservar los bloques KLIMB. Resultado real: `klimb 10:40–12:40 × snack 11:00`, `klimb-build 13:00–15:00 × almuerzo 13:00–13:30`, `klimb-creative 16:00–17:30 × snack 17:00` | La agenda dice dos cosas a la vez; el "paso siguiente" se vuelve ambiguo. |
| P0 | Restos de Impulso en planificación activa | ~30 referencias `impulso` en `app.js`, `planner-core.js`, `planner-ui.js`, `results-ui.js`, `closing-ui.js`, `recap-ui.js`, `sw.js`; eventos de calendario con destino `impulso`; `command()` aún recomienda "Seguimientos prioritarios" de Closing | Distrae del único objetivo (KLIMB) y mezcla datos del antiguo trabajo. |
| P0 | El "Command center" no guía el día KLIMB | `command()` solo elige bloque actual/siguiente; en huecos sugiere "KLIMB · avanzar proyecto" sin decir **qué** hacer | No cumple "dime exactamente qué hacer". |
| P0 | Pantalla Proyectos extensa y con formularios | `projectsDashboard()` en `results-ui.js` | Mucho trabajo administrativo, poca acción. |
| P1 | No existe pipeline de productos | No hay modelo de datos de candidato/evidencia/puntuación | La fase 1 (13–19 nov) no tiene soporte en la app. |
| P1 | No hay métricas de funnel ni economía unitaria | Sin entidades de pedido, coste, CPA, margen de contribución | Imposible decidir con datos reales. |
| P1 | Sin sincronización en la nube de lo nuevo | Solo `localStorage` | Riesgo de pérdida y móvil/portátil desincronizados. |
| P1 | Investigación automática imposible hoy | La PWA es estática; ninguna pieza desplegada tiene acceso a IA ni a búsqueda web | "Que me investigue productos" requiere backend con clave de IA (ver §3). |
| P2 | Calidad de código | Funciones de una línea muy largas, HTML por concatenación | Difícil de revisar en PR para ChatGPT y para mí. |

---

## 2. Arquitectura objetivo

Cinco módulos (alineados con ChatGPT), sobre un núcleo común:

```
Hoy · Centro de mando ── lee ──► Fase del sprint (día 1–45) + Pipeline + Métricas + Agenda
     │ produce
     ▼
"Paso siguiente" concreto + checklist del día + decisión pendiente
     ▲
Research Engine ──► Commerce Builder ──► Creative Studio ──► Growth Analytics
(candidatos,         (oferta, landing,     (guiones, hooks,     (tráfico, CTR, ATC,
 evidencias,          checklist tienda,     variantes, coste,    conversión, AOV, CPA,
 scorecard,           brief exportable)     feedback Richard)    margen contribución)
 go/no-go)
```

**Núcleo nuevo `klimb-core.js`** (lógica pura y testeable, sin UI):
- `sprintDay(now)` → día 1–45 y fase activa (según Mission Control).
- `Product` → `{id, name, niche, status: idea|research|finalist|selected|testing|killed|winner, evidence:[{type, url, note, date}], scores:{demand, differentiation, margin, fulfillment, adFit}, economics:{price, cogs, shipping, fees, refundRate}}`.
- `score(product)` → puntuación ponderada **solo con criterios que tienen evidencia**; los criterios sin evidencia se marcan como "falta evidencia" en lugar de inventar.
- `unitEconomics(product)` → margen bruto, CPA máximo de equilibrio y pedidos/día necesarios para 15.000 €/mes.
- `gates(product)` → reglas go/no-go **configurables** (valores iniciales: margen bruto ≥ 60 %, ≥ 3 evidencias de demanda, proveedor validado). No son garantías: la decisión incluye CPA, logística, devoluciones y calidad del proveedor (revisión de ChatGPT).
- `nextAction(state, now)` → **el paso exacto del día**, elegido por el **bloqueo real del negocio**, no solo por el número de día. Ej.: día 3 con 6 candidatos → "Añade 2 candidatos más y registra 1 evidencia de demanda para cada uno (objetivo: 15)". Día 10 sin producto validado → sigue en validación y **no** pasa a anuncios. La fecha solo sirve como alerta de retraso.
- Toda métrica es `real` o `simulada` con etiqueta visible. Nunca datos inventados.

**Agenda:** los bloques KLIMB reciben el foco del día ("KLIMB · investigar" muestra la tarea de `nextAction`). Se mantienen el despertar a las 07:00, la oración, 45 min de ejercicio, la lectura, el desayuno, el inglés y el trabajo intenso en KLIMB también en fin de semana. Ni las comidas ni los eventos confirmados del calendario pueden solaparse con bloques de trabajo.

**Persistencia:** fase 1 en `localStorage` con exportar/importar JSON; fase 3 sincronización vía la Supabase existente (nueva tabla `klimb_state`, reutilizando el emparejamiento de dispositivos).

**Research automático (Research Engine IA):** Edge Function de Supabase `klimb-research` que, a petición, busca y resume tendencias, competidores y anuncios para un nicho, y devuelve candidatos **con enlaces de fuente**. Requiere que Sebastián configure una clave de API de IA como secreto en Supabase (coste por uso; nunca en el repositorio). Hasta entonces, el flujo funciona en modo guiado: la app genera el prompt/brief de investigación y Sebastián lo ejecuta en ChatGPT o Claude, y pega el resultado.

---

## 3. Plan por fases

| Fase | Fechas | Entrega (PR) | Para qué fecha de negocio |
|---|---|---|---|
| **0 · Base sana** | 13 nov | Tests en verde; corregir solapes de comidas con bloques KLIMB; quitar Impulso de la planificación activa (sin borrar historial) | Antes del día 1 |
| **1 · Hoy + Research Engine (manual)** | 13–15 nov | `klimb-core.js` + pantalla Hoy con "paso siguiente", contador día X/45, pipeline de productos con scorecard, evidencias y go/no-go; exportar/importar JSON | Días 1–7: investigar 15–25 y elegir 1–2 |
| **2 · Economía y Commerce Builder** | 16–20 nov | Calculadora de economía unitaria, oferta, checklist de landing/tienda, brief exportable para Shopify | Días 8–14 |
| **3 · Nube + Research IA** | 18–22 nov | Sincronización Supabase; Edge Function `klimb-research` (requiere tu clave y autorización) | Investigación automática |
| **4 · Creative Studio** | 22–26 nov | 6 ejercicios de vídeo (3 e-commerce + 3 expertos), hooks, guion, variantes, coste, feedback de Richard | Días 15–21 |
| **5 · Growth Analytics** | 26 nov–3 dic | Registro diario de funnel (manual primero; Shopify/Meta después si se autoriza), CPA, margen de contribución, reglas de escalado | Días 15–45 |

Reglas que sigo: ramas `claude/*`, PR por fase con tests, nada de gastos/publicaciones/acciones irreversibles sin tu aprobación, no se reutilizan datos de Impulso, no se borran datos existentes.

## 4. Decisiones que necesito de Sebastián
1. **Research IA**: ¿autorizas usar una clave de API de IA (OpenAI o Anthropic) como secreto de Supabase para la investigación automática? Coste por uso, que tú controlas.
2. **Tienda**: ¿Shopify como plataforma de la landing/tienda? Lo asumo por defecto (lo menciona Mission Control).

## 5. Para ChatGPT (revisión)
Por favor, revisa contra Mission Control: (a) los umbrales go/no-go propuestos, (b) la lógica de `nextAction` por fase, (c) que la corrección de solapes respete las reglas de hábitos. Según acordamos, no tocarás `planner-core.js`, `app.js`, `results-ui.js` ni `sw.js` mientras trabajo en esta rama: la fase 0 los modifica. Avísame en el PR si surge un fallo urgente en ellos.
