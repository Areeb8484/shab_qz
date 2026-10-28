# SHAB Quarter-Zip — Image & Animation Prompts

Tools: **Higgsfield** (GPT Image or Nano Banana for stills, Kling 3.0 for video).
Always upload `assets/src/design.jpg` (your design sheet) as the reference image.

> AI image tools often mangle Arabic. Zoom in on every back-view result and regenerate
> if the calligraphy `مَنْ شَبَّ عَلَى شَيْءٍ شَابَ عَلَيْهِ` is wrong. Also check that the
> SHAB crest and the MENTOR patch match your design.

---

## Part 1: The four turntable views (most important)

These four images become the start and end frames of the 360° spin. Use **the same
background, lighting and framing in all four**. Paste the shared block first, then the
line for each view.

**Shared block (paste first every time):**
```
Professional e-commerce product photograph of the exact quarter-zip sweatshirt from the
reference image, invisible ghost-mannequin style (garment holds a natural worn 3D shape,
no person, no hanger). Bone/off-white heavyweight brushed fleece, forest-green collar lining
and zip placket, gold-tone metal zip, embroidered "SHAB" crest on the left chest, ribbed cuffs
and hem. Keep every logo, patch and text identical to the reference. Centered, full garment
in frame with even margin, camera at chest height, 85mm lens. Seamless solid mid-grey studio
background (#7a7a7a), soft large key light from upper left, gentle rim light, soft contact
shadow below. Ultra-sharp fabric texture, 4K, square 1:1.
```

| # | File name | Add this line |
|---|-----------|---------------|
| 1 | `view-front.png` | `View: straight-on FRONT, zip and crest facing camera.` |
| 2 | `view-right.png` | `View: exact RIGHT SIDE PROFILE (garment rotated 90° to its left), sleeve toward camera, collar in profile.` |
| 3 | `view-back.png`  | `View: straight-on BACK. Green "MENTOR" woven patch below the collar, Arabic calligraphy in forest-green embroidery across the shoulder blades, exactly as in the reference.` |
| 4 | `view-left.png`  | `View: exact LEFT SIDE PROFILE (garment rotated 90° to its right), sleeve toward camera.` |

Once you have #1, upload it as a **second reference** for #2–#4 so the lighting stays consistent.

---

## Part 2: The 360° spin (Kling 3.0, start + end frame)

Make 4 clips at 5 s each, 1080p. Use the same prompt for all four:

```
Smooth slow turntable rotation of the ghost-mannequin quarter-zip, rotating clockwise in
place around its vertical axis at constant speed. Locked-off static camera, no zoom, no
camera movement. Fabric stays still, logos stay intact, studio lighting and grey background
unchanged. No people, no hands, no added objects.
```

| Clip | Start frame | End frame | Save as |
|------|-------------|-----------|---------|
| A | view-front | view-right | `turn-1.mp4` |
| B | view-right | view-back  | `turn-2.mp4` |
| C | view-back  | view-left  | `turn-3.mp4` |
| D | view-left  | view-front | `turn-4.mp4` |

If one clip spins the wrong way, keep it. I can mirror it in code instead of you paying to
regenerate.

---

## Part 3: Detail macros (optional, makes the details section sick)

Shared block plus one line each. Background: `extreme close-up macro, shallow depth of field,
soft directional light raking across the fabric`.

| File | Line |
|------|------|
| `macro-crest.png`  | `Macro of the embroidered SHAB crest on the chest, thread texture visible, gold star stitch catching light.` |
| `macro-zip.png`    | `Macro of the gold-tone metal zip pull and forest-green placket, collar slightly open.` |
| `macro-patch.png`  | `Macro of the woven green "MENTOR" patch with gold lettering below the back collar.` |
| `macro-script.png` | `Macro across the forest-green Arabic calligraphy embroidery on the back.` |
| `macro-cuff.png`   | `Macro of the ribbed cuff and hem, fleece texture.` |

---

## Part 4: Editorial / lifestyle (optional, for the gallery)

```
Editorial campaign photograph, a young man wearing the exact quarter-zip from the reference
(keep logo and colours identical), [SCENE]. Cinematic natural light, muted warm tones,
35mm film grain, shot on Leica, 4:5 portrait.
```
Scene ideas:
- `standing in a sunlit stone courtyard with arches, looking off-camera`
- `group of four young men in matching quarter-zips walking side by side, back view showing the calligraphy`
- `sitting on mosque steps at golden hour, relaxed`

---

## Handing them back to me

Put everything in a folder (for example `Downloads/shab-renders`) and tell me where it is. I'll:
1. Trim each clip to the moving part, stitch A→D into one seamless 360°, and remove the background from every frame.
2. Export a frame sequence (`frames/0001.webp`…) that the site plays on scroll.
3. Swap the macros and editorial shots into the details and gallery sections.
