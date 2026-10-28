"""Turn renders/turn/turn-1..4.mp4 into a seamless 360° frame sequence for the site.

Each clip is resampled by motion (not time), so the spin turns at an even speed; the
background is removed from every frame and everything is cropped to one shared box.
Output: frames/turn/0001.webp ... and frames/manifest.json

Usage: python tools/build_frames.py [frames_per_clip=45]
"""
import sys, json, pathlib, subprocess, tempfile
import numpy as np
from PIL import Image
from rembg import remove, new_session

ROOT = pathlib.Path(__file__).resolve().parent.parent
PER_CLIP = int(sys.argv[1]) if len(sys.argv) > 1 else 45
OUT = ROOT / "frames/turn"
MAX_SIDE = 900


def extract(clip, tmp):
    d = tmp / clip.stem
    d.mkdir()
    subprocess.run(["ffmpeg", "-v", "error", "-i", str(clip), str(d / "%04d.png")], check=True)
    return sorted(d.glob("*.png"))


def even_motion(paths, n):
    """Pick n frames (excluding the last, which the next clip starts on) spaced by equal motion."""
    small = [np.asarray(Image.open(p).convert("L").resize((192, 192)), dtype=np.float32) for p in paths]
    motion = np.array([0.0] + [np.abs(a - b).mean() for a, b in zip(small, small[1:])])
    motion = np.maximum(motion - np.percentile(motion, 10) * 0.5, 0)  # ignore compression shimmer
    cum = np.cumsum(motion)
    cum /= cum[-1]
    targets = np.arange(n) / n
    return [paths[int(np.searchsorted(cum, t, side="left"))] for t in targets]


def main():
    session = new_session("isnet-general-use")
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*.webp"):
        old.unlink()
    with tempfile.TemporaryDirectory() as t:
        tmp = pathlib.Path(t)
        picked = []
        for i in range(1, 5):
            frames = extract(ROOT / f"renders/turn/turn-{i}.mp4", tmp)
            picked += even_motion(frames, PER_CLIP)
        cut = []
        for k, p in enumerate(picked, 1):
            im = Image.open(p).convert("RGB").resize((1024, 1024), Image.LANCZOS)
            cut.append(remove(im, session=session, post_process_mask=True))
            if k % 20 == 0:
                print(f"cut {k}/{len(picked)}", flush=True)
        box = None
        for im in cut:
            b = im.getchannel("A").point(lambda a: 255 if a > 24 else 0).getbbox()
            if b:
                box = b if box is None else (min(box[0], b[0]), min(box[1], b[1]), max(box[2], b[2]), max(box[3], b[3]))
        pad = 12
        box = (max(box[0] - pad, 0), max(box[1] - pad, 0), min(box[2] + pad, 1024), min(box[3] + pad, 1024))
        w, h = box[2] - box[0], box[3] - box[1]
        s = min(1, MAX_SIDE / max(w, h))
        size = (round(w * s), round(h * s))
        for k, im in enumerate(cut, 1):
            im.crop(box).resize(size, Image.LANCZOS).save(OUT / f"{k:04d}.webp", quality=82, method=6)
    manifest = {"count": len(cut), "pattern": "frames/turn/{n}.webp", "pad": 4, "degrees": 360,
                "width": size[0], "height": size[1]}
    (ROOT / "frames/manifest.json").write_text(json.dumps(manifest, indent=2))
    print("done", manifest)


if __name__ == "__main__":
    main()
