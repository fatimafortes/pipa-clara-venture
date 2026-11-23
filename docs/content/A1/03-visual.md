# A1 · Role 3: Visual

Piece: **A1 "¿Te ha tocado poner de tu bolsa?"** (WhatsApp text, series A · Cuentas claras)

- **Date:** 2026-11-22
- **Chat:** <!-- not recorded in A1-process-evidence.md -->
- **Input given to this role (only this):** the Writing message + source (screenshot of /demo, step "Juntando para la pipa", labeled "DEMO · datos de ejemplo") + visual system (teal #12707a, amber #b45f06, WhatsApp green #1f9150, ink #16272b, background #f2f6f7, Inter, large text, flat).

Source: [`../A1-process-evidence.md`](../A1-process-evidence.md), section "03 · Visual". Text below copied verbatim.

## Output (verbatim)

I couldn't see the actual screenshot, so this spec assumes the usual layout for that step: a DEMO label, the step title, a progress block and a list of who has paid. Adjust it if the real screen is laid out differently.

1. What to capture and how to crop
Keep (top to bottom, in one frame):
* The "DEMO · datos de ejemplo" label in amber, uncut and with some space around it.
* The step title "Juntando para la pipa."
* The progress block: the count of who has paid (e.g. "9 de 12 ya dieron su parte"), the progress bar and the amount collected out of the total.
* The line or state that says the pipa gets ordered when everyone has paid, if it's on screen. That's the core promise of the message.
* The teal primary button, only if it sits right under the progress block. Otherwise leave it out.

Cut:
* The phone status bar (time, battery, carrier, notifications) and the browser URL bar. The link is already in the text.
* The list of who's missing, even with example names. The message says "el grupo, solo cuántos" ("the group only sees how many"). The image goes to the group, so it should show the count, not the names. This also keeps you safely inside the no-names rule.
* The keyboard, the bottom navigation and anything below the progress block.

Format: vertical 4:5 (1080 × 1350 px). WhatsApp crops very tall 9:16 images in the chat preview, so 4:5 shows whole without anyone tapping. Scale the crop so the smallest text left (probably the DEMO label) is at least ~28 px tall at 1080 wide. If the label ends up smaller, crop tighter rather than enlarging it artificially. If the crop doesn't fill 4:5, pad with the background color #f2f6f7, never with blur or a gradient.

2. Add anything? Nothing
* The text already explains the idea. A caption on the image would repeat it and make the image compete with the message.
* An untouched real screenshot is the proof that the product exists. Text, arrows or highlights would make it look like an ad or a mockup.
* The DEMO label already tells people the data is made up. A second warning would add noise.

The only allowed change is padding the margins with #f2f6f7. No frame, phone mockup or shadow.
Practical note: if you send the image with the message as its caption, WhatsApp won't show the link preview. That's fine, because the image already does that job and the URL stays clickable.

3. Verification checklist
1. DEMO and privacy: "DEMO · datos de ejemplo" is fully visible and readable. No name, phone number, face, plate or house appears anywhere, including small corners.
2. Phone readability: in a WhatsApp chat on a real phone, without zooming, you can read the title, the count ("X de Y") and the DEMO label. The image doesn't get cropped in the chat bubble.
3. One idea, real product: at a glance it says "we're collecting, X of Y are missing." It's an untouched screenshot, with no status bar, URL bar, keyboard or list of names.

## Quality check: real product, DEMO label visible, no names/faces/plates/homes, readable inside WhatsApp.

## What I (founder) rejected or changed here, and why

**Founder note:** the screenshot itself is taken by the founder on a phone from production /demo, following this spec. Status: pending (taken before sending to the encargada).
