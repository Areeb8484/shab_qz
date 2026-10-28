# SHAB — Team Quarter-Zip

Showcase site for the SHAB team quarter-zip. Plain HTML/CSS/JS with no build step.

- `index.html`, `style.css`, `app.js`: the site
- `assets/`: logo, product cut-outs and close-ups
- `frames/`: the 180-frame 360° spin (`manifest.json` + `turn/*.webp`), played on a canvas as you scroll
- `tools/`: scripts that generated the renders (`generate.py`, fal.ai) and built the spin frames (`build_frames.py`)
- `PROMPTS.md`: the image and video prompts

Run locally:

```bash
python -m http.server 5174
```

Then open http://localhost:5174.
