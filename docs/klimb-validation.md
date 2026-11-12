# KLIMB — No-inventory product validation protocol
Version 0.1 · 2026-11-13 · Owner: Sebastián · Strategy: ChatGPT · Implementation: Claude Code

## Goal and market
Test whether a specific offer attracts **qualified buyers in Spain** before buying stock. Spain is a **provisional** launch hypothesis pending Sebastián's confirmation. Shopify is the intended platform. Target EUR 15,000/month gross revenue run rate by 2026-12-31 is aspirational, not a forecast.

**Non-negotiable:** no product inventory purchase, no real charge, no preorders, no paid ad launch, no publication of a live offer, and no irreversible financial action without owner authorization. A fake checkout or misleading “in stock” claim is prohibited. If accepting actual preorders later, first verify legal obligations, payment processing, refunds, delivery commitments and supplier capability.

## 0. Merchant feasibility gate (parallel to product research)
Before a paid checkout or preorder: identify selling legal entity, country of establishment, business address, bank account, beneficial owner and permitted payment provider; confirm actual Shopify checkout eligibility and test payment capture/refund. Shopify Payments is available to eligible businesses in Spain, but Ukraine is **not** on its supported-country list. Citizenship alone does not establish eligibility. Shopify documentation: https://help.shopify.com/en/manual/payments/shopify-payments/supported-countries and https://help.shopify.com/en/manual/payments/shopify-payments/onboarding/eligibility . Check third-party gateways by business location: https://help.shopify.com/en/manual/payments/third-party-providers/payment-gateway-availability . **No assumption of Spanish entity, residency or payment approval.** Fulfillment and payments research owned by Claude in klimb-fulfillment.md.

## 1. Desk research: candidate → shortlist
Start with K01, K10, K02, K08 and K14 in [candidate file](klimb-candidates.md); keep all 20 as hypotheses.
For each: (a) Spain-specific problem/search intent, dated source and comparison; (b) three independently observed competitor listings, real prices and offer differences; (c) 3–5 Meta Ad Library/TikTok creatives if available, with exact ad/advertiser URLs and date, hooks, CTA, landing; (d) two potential supplier product links with landed cost, dispatch origin, SLA, MOQ, returns and legal compliance **unverified until checked**; (e) realistic contribution-margin model. Distinguish category reports from SKU demand. No artificial score if evidence missing.

Official research entrypoints:
- Meta Ad Library https://www.facebook.com/ads/library/ — Spain, all ads, keyword or advertiser. Records active ads and EU archive, but not commercial ad profitability or actual ROAS. Reference: https://business.facebook.com/ads/library/
- TikTok Creative Center https://ads.tiktok.com/business/creativecenter/ — Top Ads by region/industry/objective, curated rather than comprehensive. Reference: https://ads.tiktok.com/resources/help/article/how-to-use-the-top-ads-dashboard
- Google Trends https://trends.google.com/trends/ — Spain, compare 12-month and 5-year relative interest; not absolute sales.
- Shopify category research https://www.shopify.com/blog/best-dropshipping-products — ideation only, not SKU validation.

## 2. Honest smoke test, without inventory
A. Write one explicit hypothesis per product: customer segment, problem, differentiator, plausible retail price, channel, expected action and max tolerable acquisition cost (if economics known).
B. Create **one landing per shortlisted product**, mobile-first, clear price and intended offer, real imagery rights/accurate AI disclosure as applicable, transparent **“Próximamente / Únete a la lista de espera”** CTA. Do not imply stock, guaranteed delivery or existing customer testimonials. Privacy notice, consent, opt-in storage and unsubscribe where required. Avoid fake checkout.
C. Measure unique visitors, qualified sessions, CTA clicks, valid consented emails, source/UTM, device and date; deduplicate, filter bots, distinguish organic/paid and returning/new. Test event logging before traffic.
D. Start with zero-cost traffic that does not spam or misrepresent. If owner approves, launch small paid experiments with explicit **budget ceiling, time window, campaign and stop rules**. Richard's approximate USD 10/day was an example, **not approval**.
E. Compare variants: price/offer, headline and two or three truthful creative hooks. Do not compare raw CTR alone; compare qualified opt-in rate and estimated acquisition economics with sample size/context.
F. Record user feedback, stated purchase intent and objections; a waitlist opt-in is a **weak demand signal**, not a paid order. Stronger evidence requires actual valid purchase behavior when checkout and fulfillment are ready.

## 3. Measurement and decision rules
Required schema: `experiment_id, product_id, country, offer_version, traffic_source, spend_approved, spend_actual, visitors_unique, cta_clicks, valid_opt_ins, qualified_leads, observations, timestamps, data_quality`.
Derived: `opt_in_rate=valid_opt_ins/visitors_unique`; `cost_per_opt_in=spend_actual/valid_opt_ins` (only when denominator>0); later checkout conversion, AOV, CPA and contribution margin. Label observed vs assumed vs simulated; no made-up metrics.

**Illustrative diagnostic thresholds only** (not automatic claims of product-market fit): with <100 relevant visitors, default `insufficient_sample`; with 100–300 qualified visitors, treat results as directional and examine confidence intervals, channel quality and intent; >300 may still be inconclusive if weak targeting or tiny conversions. No universal waitlist percentage proves a winner. Define experiment-specific minimum effect and stop rule before running.

Decision statuses:
- `blocked`: payment/legal/fulfillment/compliance critical unknown for real checkout.
- `research_more`: missing product-level demand, supplier or unit economics.
- `smoke_test_ready`: transparent landing, consent/tracking, explicit hypothesis and no-stock CTA ready.
- `inconclusive`: insufficient or ambiguous qualified traffic/intent.
- `promising`: reproducible qualified interest plus plausible unit economics, still not validated sales.
- `validated_for_sales_test`: real supplier and payment checkout ready, adequate demand signal and owner-approved sale test.
- `reject`: disqualifying compliance, impossible economics or repeated negative evidence.
- `scale_candidate`: observed sales with positive contribution margin after acquisition, acceptable returns/fulfillment and cash runway.

No universal gross-margin 60% gate. Calculate contribution after shipping, fees, taxes where applicable, refunds and acquisition; null if unknown. AOV and €15k target are planning tools, not proof of feasibility.

## 4. Fulfillment decision after demand signal
Compare: EU-origin dropshipping, third-party fulfillment (3PL) with prepositioned stock, Amazon FBA/MCF, and hybrid. Criteria: landed cost, shipping SLA Spain/EU, refund/returns address, MOQ, inventory financing, packaging, tax/compliance, customer experience, integration with Shopify, and no need for Sebastián to handle parcels in Ukraine. **No stock purchase before winner evidence and owner approval.** Prefer reversible low-risk arrangements for first orders.

## 5. NextAction integration contract for Claude
Priority sequence: legal/payment feasibility risk (for charging) > insufficient evidence > competitor/source verification > supplier due diligence > offer hypothesis > landing/waitlist + consent analytics > organic smoke test > authorized paid test > sales test > fulfill/scale. `nextAction()` should return one precise task, why, route, required evidence, done criteria and estimated minutes; date never forces skipping a gate. Show “Mercado provisional: España” until confirmed. Import K01–K20 as `idea` with no scores, no supplier, and no economics.
