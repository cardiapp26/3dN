#!/usr/bin/env python3
"""
Enhance atlas plates:
- Optimize tonal curve and contrast to make nerve pathways and muscle striations stand out.
- Controlled unsharp mask for fine nerve fiber visibility.
- High-quality JPEG re-encoding (progressive, quality=92, subsampling=0).
- Synchronize with *.jpg.b64 for git and build consistency.
"""

import os
import base64
from PIL import Image, ImageEnhance, ImageFilter

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ATLAS_DIR = os.path.join(ROOT, "public", "atlas")
OG_JPG = os.path.join(ROOT, "public", "og.jpg")
OG_B64 = os.path.join(ROOT, "public", "og.jpg.b64")

def enhance_image(img_path):
    with Image.open(img_path) as img:
        img = img.convert("RGB")
        
        # 1. Subtle contrast enhancement to deepen darks and brighten bone/cartilage
        enh_contrast = ImageEnhance.Contrast(img)
        img = enh_contrast.enhance(1.08)
        
        # 2. Subtle saturation enhancement for gold nerves and red muscle tones
        enh_color = ImageEnhance.Color(img)
        img = enh_color.enhance(1.06)
        
        # 3. Micro-contrast & edge sharpening for fine neural fibres and sulci
        # radius=1.2, percent=115, threshold=2 produces crisp lines without halo
        img = img.filter(ImageFilter.UnsharpMask(radius=1.2, percent=115, threshold=2))
        
        return img

def process_all():
    count = 0
    for name in sorted(os.listdir(ATLAS_DIR)):
        if not name.endswith(".jpg"):
            continue
        jpg_path = os.path.join(ATLAS_DIR, name)
        b64_path = os.path.join(ATLAS_DIR, name + ".b64")
        
        enhanced = enhance_image(jpg_path)
        
        # Save high-quality optimized progressive JPEG
        enhanced.save(jpg_path, "JPEG", quality=92, progressive=True, subsampling=0)
        
        # Update .b64
        with open(jpg_path, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("ascii")
        with open(b64_path, "w", encoding="utf8") as f:
            f.write(b64_data)
            
        print(f"Enhanced and synced: {name} (size: {os.path.getsize(jpg_path)} bytes)")
        count += 1

    # Also enhance og.jpg if present
    if os.path.exists(OG_JPG):
        enhanced_og = enhance_image(OG_JPG)
        enhanced_og.save(OG_JPG, "JPEG", quality=92, progressive=True, subsampling=0)
        with open(OG_JPG, "rb") as f:
            b64_data = base64.b64encode(f.read()).decode("ascii")
        with open(OG_B64, "w", encoding="utf8") as f:
            f.write(b64_data)
        print(f"Enhanced and synced: og.jpg (size: {os.path.getsize(OG_JPG)} bytes)")
        count += 1

    print(f"\nTotal processed: {count} images.")

if __name__ == "__main__":
    process_all()
