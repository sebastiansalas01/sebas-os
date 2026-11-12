# KLIMB · Fulfillment, pagos y Shopify desde Ucrania

Autor: Claude Code · 2026-11-13 · Estado: **propuesta para debatir con ChatGPT y que decida Sebastián**.
No es asesoramiento legal ni fiscal: los puntos de IVA y sociedad deben confirmarse con un asesor.

## Resumen en 30 segundos

1. **Validar sin stock y sin cobrar** (ahora → ~1 dic): landing en Shopify con prueba de demanda, es decir, botón de compra que lleva a "agotado, avísame" o lista de espera, más contenido orgánico. Si Sebastián lo aprueba, también anuncios de bajo presupuesto. No requiere pasarela de pago.
2. **Primeras ventas con dropshipping desde almacén en la UE**, no desde China. Ningún producto pasa por Ucrania.
3. **Escalar el ganador comprando stock** que el proveedor envía directamente a un almacén de terceros en la UE: almacén europeo de CJ o Amazon FBA/MCF. Sebastián nunca toca el producto.
4. **El cuello de botella real son los cobros, no la logística**: Shopify Payments, Stripe y PayPal (para ventas) **no están disponibles para un vendedor residente en Ucrania**. Hay que decidir ya la vía de cobro, porque algunas tardan de 4 a 6 semanas.

## 1. Bloqueo de pagos (camino crítico)

| Vía | Qué permite | Tiempo / coste | Riesgos |
|---|---|---|---|
| Shopify Payments directo | Lo mejor para la conversión | — | **No disponible en Ucrania** (confirmado por Shopify en sus foros). |
| Stripe directo | — | — | **Ucrania no está entre los países admitidos por Stripe.** |
| PayPal directo | — | — | Desde Ucrania solo se pueden recibir pagos de amigos y familiares, **no por ventas**. Usarlo para vender puede provocar el bloqueo de la cuenta. |
| **Intermediario (p. ej. Western Bid)** | PayPal y Stripe en Shopify sin sociedad extranjera | Rápido (días) | Comisiones extra y dependencia de un tercero; hay que revisar sus condiciones y su reputación. |
| **LLC en EE. UU.** (Stripe Atlas ~500 $ u otros) | Stripe y, potencialmente, Shopify Payments con una sociedad de EE. UU. | ~4–6 semanas en total (LLC, EIN, banco, Stripe) | Obligaciones fiscales en EE. UU. (p. ej. el formulario 5472 para LLC de un solo socio extranjero); la aprobación de Stripe no está garantizada. |
| **Residencia o sociedad en la UE/España** (si Sebastián la tiene) | Shopify Payments directo | Depende | **Pregunta abierta para Sebastián**. |
| Pasarelas ucranianas (WayForPay, LiqPay) | Pago con tarjeta | Rápido | Pensadas para el mercado ucraniano; dudosas para clientes españoles. |

### Actualización 13-nov · dos vías concretas para comparar
- **Western Bid (merchant of record ucraniano):** permite poner PayPal y Stripe en Shopify sin sociedad extranjera. Cobra un **4 %** sobre lo recibido, después de las comisiones de PayPal o Stripe (PayPal: 2,9 % + 0,30 $ para compradores fuera de EE. UU.). Fuente: https://westernbid.com/en/westernbid-rates/ y https://westernbid.com/en/?p=23509. Pendiente: condiciones de alta, KYC, plazos de liquidación y reputación.
- **Contra reembolso (COD) en España:** muy usado por tiendas de dropshipping españolas (lo vimos en Meta Ad Library: LumirShop, Wortekshop). Plataformas como **Dropea** (app de Shopify para España y Portugal) hacen dropshipping contra reembolso sin comprar stock; el transportista cobra al cliente y la plataforma liquida al vendedor. Referencias de un tercero: comisión de COD del 3–5 % (mínimo ~2 €) y liquidación en 5–15 días hábiles. Riesgos: pedidos rechazados en la entrega (pagas ida y vuelta), flujo de caja más lento y saber **si liquidan a un vendedor residente en Ucrania**, que es lo primero que hay que preguntar. Fuentes: https://apps.shopify.com/dropea?locale=es · https://www.andreybusiness.com/blog/seur-espana-dropshipping-contra-entrega-2026 · https://www.shopify.com/es/blog/envio-pago-contrareembolso

**Recomendación:** tomar ahora la decisión de cobro, en paralelo con la validación. Con el plazo del 31-dic, una LLC que tarda 4–6 semanas deja muy poco margen. La opción más rápida para cobrar en diciembre es probablemente un intermediario, mientras se prepara la solución definitiva.

## 2. Logística: opciones comparadas

| Modelo | Stock propio | Entrega a España/UE | Aduanas | Encaje |
|---|---|---|---|---|
| Dropshipping desde China | No | 10–25 días | Desde el 1-jul-2026 hay un **derecho de aduana fijo de 3 € por artículo**; sin IOSS, el cliente puede pagar IVA y cargos al recibir | ❌ Mala experiencia, devoluciones, reseñas negativas |
| **Dropshipping desde almacén UE de CJ** (Polonia, Alemania, España…) | No | 2–7 días (según SKU) | Ninguna: envío dentro de la UE | ✅ **Opción recomendada para las primeras ventas** |
| BigBuy (Valencia) | No | 24–48 h a la mayoría de la UE | Ninguna | ✅ Si el producto ganador está en su catálogo; cuota mensual |
| **CJ con inventario propio en almacén UE** | Sí, comprado a CJ y enviado por ellos | 3–7 días, preparación en 24 h | Las paga el importador | ✅ **Escalado**: más margen y control |
| **Amazon FBA + MCF (Alemania/España…)** | Sí, enviado por el proveedor a Amazon | 1–3 días en la UE | Las paga el importador | ✅ Escalado y posible venta también en Amazon; más requisitos (cuenta de vendedor, etiquetado, IVA) |
| 3PL europeo independiente | Sí | 1–3 días | Las paga el importador | ⚠️ Opción posterior; más configuración |

**Notas importantes:**
- Que CJ tenga un almacén en Alemania no garantiza que *este* SKU esté allí: hay que comprobar el almacén de salida de cada producto y hacer un pedido de prueba antes de anunciar "envío desde Europa".
- Guardar stock en la UE siendo un negocio de fuera de la UE suele exigir **registro de IVA** en el país del almacén (y OSS para ventas a otros países). Confirmar con un asesor antes del escalado.
- Una muestra para revisar la calidad puede enviarse a una persona de confianza en la UE o directamente a un servicio de inspección, no a Ucrania.

## 3. Plan propuesto

| Fase | Fechas | Logística | Cobro |
|---|---|---|---|
| Validación | 13 nov – ~1 dic | Sin stock. Comprobar disponibilidad en almacén UE de CJ/BigBuy para cada finalista | Sin cobro (lista de espera o prueba de demanda) |
| Primeras ventas | ~1 – 15 dic | Dropshipping desde almacén UE | Intermediario o la vía que elija Sebastián |
| Escalado del ganador | 15 – 31 dic | Inventario propio en el almacén UE de CJ o en Amazon FBA/MCF | Vía definitiva |

**Criterio extra para los productos (añadir a la puntuación):** que el producto exista con stock en un almacén de la UE o que pueda colocarse en uno. Un producto ganador que solo se envía desde China queda penalizado.

## 4. Decisiones de Sebastián
1. ¿Tienes residencia, nacionalidad o sociedad en España u otro país de la UE? Cambia por completo el tema de los cobros.
2. ¿Autorizas investigar un intermediario de pagos o una LLC en EE. UU. como vía de cobro? No se abre nada sin tu aprobación.
3. Mercado objetivo: propongo **España** (idioma, entrega desde BigBuy o CJ España) y después el resto de la UE.

## Fuentes
- Shopify Community — Shopify Payments not available in Ukraine: https://community.shopify.com/t/shopify-payments-not-available-in-ukraine/385559
- Western Bid — Stripe in Ukraine 2026: https://westernbid.com/en/?p=23497
- Western Bid — PayPal in Ukraine 2026: https://westernbid.com/en/?p=23509
- PayPal Community — PayPal for business in Ukraine: https://paypal-community.com/t5/Transactions/How-can-I-arrange-PayPal-for-my-business-if-I-am-in-Ukraine/td-p/3116943
- US Stripe for international founders (plazos y requisitos): https://design.file.business/us-stripe-account-international-founder
- Hackceleration — European dropshipping suppliers 2026 (almacenes UE de CJ): https://hackceleration.com/labs/best/european-dropshipping-suppliers
- CJdropshipping — EU duty changes 2026: https://cjdropshipping.com/blogs/business-insights/How-EU-Duty-Changes-Impact-Your-2026-Dropshipping-EU-Business
- Trendtrack — BigBuy review: https://www.trendtrack.io/blog-post/bigbuy-review
- Amazon Supply Chain — EU de minimis y MCF: https://supplychain.amazon.co.uk/blog/eucustoms-deminimis
- Amazon — MCF app for Shopify in multiple countries: https://buywithprime.amazon.com/knowledge-center/multichannel-fulfillment-app-for-shopify/using-mcf-in-multiple-countries
- Landmark Global — EU customs reform 2026: https://landmarkglobal.com/eu/en/news-insights/eu-customs-reform-2026-3-euro-import-duty/
