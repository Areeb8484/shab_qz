"""Generate SHAB product renders with fal.ai (needs FAL_KEY in the environment).

Usage:
  python tools/generate.py view front [n]
  python tools/generate.py view right|back|left [n] --ref renders/views/front-1.png
  python tools/generate.py macro crest|zip|patch|script|cuff [n] --ref renders/views/front-1.png
  python tools/generate.py turn <start.png> <end.png> <out.mp4>
"""
import sys, pathlib
import fal_client
import httpx

ROOT = pathlib.Path(__file__).resolve().parent.parent
DESIGN = ROOT / "assets/src/design.jpg"
LOGO = ROOT / "assets/src/logo-original.jpg"
IMAGE_MODEL = "fal-ai/nano-banana-pro/edit"
VIDEO_MODEL = "fal-ai/kling-video/v3/pro/image-to-video"

GARMENT = (
    "The garment is the exact quarter-zip sweatshirt from the first reference image (a design sheet: "
    "front on the left, back on the right). Bone/off-white heavyweight brushed fleece, stand collar with "
    "forest-green collar lining and a forest-green zip placket, gold-tone metal zip, side-seam pockets, "
    "ribbed cuffs and hem. The second reference image is the official SHAB logo: the chest crest is that "
    "logo embroidered in forest green and gold, small, on the wearer's left chest. On the back: a small "
    "forest-green woven patch reading MENTOR in gold just below the collar, and the Arabic calligraphy "
    "line exactly as on the design sheet, embroidered in forest green across the shoulder blades. "
    "Reproduce every logo, patch and letter exactly; do not invent extra graphics, tags or text."
)
STUDIO = (
    "Professional high-end e-commerce product photograph, invisible ghost-mannequin style: the garment "
    "holds a natural worn 3D shape with no person, no mannequin and no hanger visible. Centered, the "
    "whole garment in frame with an even margin, camera at chest height, 85mm lens, no perspective "
    "distortion. Seamless solid mid-grey studio background (#7a7a7a), soft large key light from upper "
    "left, gentle rim light, soft contact shadow. Ultra-sharp, realistic fleece texture and embroidery "
    "stitching, true-to-life colour, no stylisation."
)
VIEWS = {
    "front": "View: straight-on FRONT, zip and chest crest facing the camera.",
    "right": "View: exact 90-degree RIGHT SIDE PROFILE, the mirror-image counterpart of the side-view reference: the "
             "garment's front (zip opening) faces IMAGE-RIGHT and its back faces image-left. We see the wearer's right "
             "side: plain fleece sleeve and side panel only. The chest crest is on the far side, so it is NOT visible; "
             "only the very end of the back calligraphy may show at the back edge. Clean single garment, no ghosting, "
             "no motion blur. Match the lighting, scale and framing of the references exactly.",
    "back":  "View: straight-on BACK. Match the lighting, scale and framing of the front-view reference exactly.",
    "left":  "View: exact LEFT SIDE PROFILE, the garment turned 90 degrees so its left sleeve faces the camera "
             "and the collar is seen in profile. Match the lighting, scale and framing of the front-view reference exactly.",
}
MACROS = {
    "crest":  "Extreme close-up macro of the embroidered SHAB crest on the chest, thread texture visible, gold star stitching catching the light.",
    "zip":    "Extreme close-up macro of the gold-tone metal zip pull and forest-green placket, collar slightly open.",
    "patch":  "Extreme close-up macro of the woven forest-green MENTOR patch with gold lettering below the back collar.",
    "script": "Close-up macro across the forest-green Arabic calligraphy embroidery on the back, the full line in frame.",
    "cuff":   "Extreme close-up macro of the ribbed cuff and hem, brushed fleece texture.",
}
MACRO_STUDIO = (
    "Macro product photograph, shallow depth of field, soft directional light raking across the fabric, "
    "neutral warm-grey background. Ultra-sharp, realistic, true-to-life colour."
)
TURN_PROMPT = (
    "Smooth slow turntable rotation of the ghost-mannequin quarter-zip, rotating in place around its "
    "vertical axis at constant speed. Locked-off static camera, no zoom, no camera movement. Fabric stays "
    "still, logos stay intact, studio lighting and grey background unchanged. No people, no hands, no added objects."
)


def upload(path):
    return fal_client.upload_file(str(path))


def save(url, out):
    print("result", url, flush=True)  # printed first so a failed download never loses a paid result
    out.parent.mkdir(parents=True, exist_ok=True)
    with httpx.stream("GET", url, follow_redirects=True, timeout=120) as r:
        r.raise_for_status()
        with open(out, "wb") as f:
            for chunk in r.iter_bytes():
                f.write(chunk)
    print("saved", out.relative_to(ROOT))


def images(kind, name, n, ref):
    refs = [upload(DESIGN), upload(LOGO)] + [upload(r) for r in ref]
    if kind == "view":
        prompt = f"{STUDIO} {GARMENT} {VIEWS[name]}"
        if ref:
            prompt += (" The third reference image is the approved front view: keep identical garment, colours, lighting and background."
                       + (" The fourth reference image is the approved opposite side view." if len(ref) > 1 else ""))
        args = dict(aspect_ratio="1:1", resolution="2K")
        folder = "views"
    else:
        prompt = f"{MACRO_STUDIO} {GARMENT} {MACROS[name]}"
        args = dict(aspect_ratio="4:5", resolution="2K")
        folder = "macros"
    res = fal_client.subscribe(IMAGE_MODEL, arguments=dict(prompt=prompt, image_urls=refs, num_images=n, output_format="png", **args))
    for i, img in enumerate(res["images"], 1):
        save(img["url"], ROOT / f"renders/{folder}/{name}-{i}.png")


def turn(start, end, out):
    res = fal_client.subscribe(VIDEO_MODEL, arguments=dict(
        prompt=TURN_PROMPT, start_image_url=upload(start), end_image_url=upload(end),
        duration="5", generate_audio=False,
        negative_prompt="camera movement, zoom, people, hands, morphing logo, distorted text, blur, low quality"))
    save(res["video"]["url"], ROOT / out)


if __name__ == "__main__":
    a = sys.argv[1:]
    ref = []
    while "--ref" in a:
        i = a.index("--ref"); ref.append(ROOT / a[i + 1]); del a[i:i + 2]
    if a[0] in ("view", "macro"):
        images(a[0], a[1], int(a[2]) if len(a) > 2 else 2, ref)
    elif a[0] == "turn":
        turn(ROOT / a[1], ROOT / a[2], a[3])
