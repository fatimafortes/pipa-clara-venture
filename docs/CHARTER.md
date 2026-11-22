# Pipa Clara — Product Charter

**Founder:** Fátima Fortes Ortega · **Venture weeks:** 12–17 · **Source ship:** Week 11, *Dreaming of Plenitude*
**Version:** v2 (Week 15) — the organizer line now follows the 100% rule. v1 (Week 12) is kept under [History](#history). This charter is the referee for every scope decision.

> **The product in one line:** households that share a cistern check how much water a truck actually delivered (the liters the driver claims vs. the liters that entered the cistern) and split the cost on evidence instead of suspicion.

---

## VISION

In three years, Pipa Clara is how any place that buys water by truck knows what it actually received. It grows the way trust grows: one community first, then the communities around it, then a network of small communities, and only then wider exposure, in CDMX and beyond. Vecindades, buildings, housing units, and any site that shares a cistern can use it. Once the measurement is proven safe and accurate, water companies accept it as evidence: households can file a complaint about a specific delivery, and a pattern of short loads becomes something the company must fix. The driver is only the messenger; the responsibility for delivering in full belongs to the company from day one, not after the first short load.

## USERS

**Primary user: the organizer.** In a group of households that share a cistern, one person collects each household's share, orders the water truck **only when every household has given its share** (the 100% rule), pays the driver, keeps the record, measures, registers the delivery and sends the summary to her neighbors. She never covers anyone from her own pocket. Pipa Clara never holds money: she collects in cash, as today, and the app only records it. Nobody is ever excluded from water: the pipa waits for everyone, and the date is the group's decision, not the app's. Separate-tank groups are included: whoever pays the driver collects the money. The app is useless to anyone who isn't keeping the record, so it is built for her.

**Secondary: the neighbors.** They don't open the app. They receive the summary (liters claimed vs. measured, their share, how many households have paid) and pay the organizer.

### Who pays

The households that share the cistern. A small fee is added to each delivery and split among them, inside the same share the organizer already collects. The water company and the driver never pay and never sponsor anything: the party being measured cannot fund the measurement.

- **Pilot price:** MXN 2 per household per delivery (about MXN 10 for a 5-household cistern), low enough that nobody thinks twice.
- **Sustainable price:** about MXN 4 per household (MXN 20 per delivery), roughly 1% of a MXN 1,800 load.
- To be tested in Week 13 (pricing).

## PRINCIPLES

1. **No measurement counts if only one side controls it.** The "before" reading is taken with the driver present, in a timestamped photo, so both sides witness it.
2. **Every measurement can be challenged.** A verdict is evidence, not a sentence: the driver or a neighbor can dispute it, and the dispute is recorded next to the result.
3. **Neighbors see what is fair and nothing more:** how much water entered, what each household owes, and how many households have paid ("7 of 12"), never who. Only the organizer sees which household still owes. No extra personal data.

## NON-GOALS

1. **It never sells or advertises water trucks.** Pipa Clara is not a marketplace and never compares drivers' prices.
2. **It never rates or ranks individual drivers.** Complaints go to the company, because the driver is only the messenger.
3. **It never measures water quality,** only quantity.
4. **It is never a neighbors' social network:** no chat, no posts. WhatsApp already does that; Pipa Clara only sends the summary.

## NORTH STAR

**Communities still measuring on their 5th delivery without anyone reminding them.**

Short loads are rare, so the measurement only matters if it is still happening the day one arrives. If a community stops measuring after a few uneventful deliveries, Pipa Clara isn't working, however good the verdicts look.

## CORE CONCEPTS

If a feature doesn't speak these nouns, it doesn't belong in Pipa Clara.

- **Organizer:** the person who collects each household's share, orders the truck once everyone has paid, pays the driver and keeps the record.
- **Collection:** the shares gathered before ordering a delivery; the delivery is ordered only when every share is received (a promise doesn't count). The group sees how many have given, never who.
- **Household:** one of the homes that share the cistern and split the cost.
- **Cistern:** the shared tank, defined by its dimensions; every centimeter of level equals its floor area × 10 liters.
- **Delivery:** one water truck arrival, with the liters the driver claims and the price paid.
- **Reading:** a level measurement of the cistern, before or after the delivery, with a timestamped photo.
- **Verdict:** the result of comparing claimed vs. measured liters: consistent, short, or couldn't measure.
- **Challenge:** a dispute about a verdict, recorded next to it, never deleted.
- **Share:** what each household owes for a delivery, and whether it has been paid (visible to the organizer only; the group sees a count).

---

## History

### v1 (Week 12) — primary user, as first written

> **Primary user: the organizer.** In a group of households that share a cistern, one person orders the water truck, pays the driver in full at the door (cash or transfer), keeps the record, and collects each household's share afterwards. She is the one who measures, registers the delivery and sends the summary to her neighbors. The app is useless to anyone who isn't keeping the record, so it is built for her.

**Why it changed (Week 15):** in the Week 15 Brain Bending session, families said problems with piperos are rare; the pain I actually heard is late payments between neighbors, absorbed by the organizer who pays first and chases each household for weeks (one encargada: collecting "becomes a disaster because they don't pay on time", as recorded in the Week 15 packet; A, n=1). v1 described that workaround as the normal flow. v2 makes the 100% rule part of who she is in the product. See `docs/PACKET.md` §1–2.

*Not changed in v2:* the price lines under "Who pays" still show the Week 12 pilot price; the decision that replaced them ($10 per pipa for families, not collected in the pilot) is in `docs/DECISIONS.md`, Week 14.
