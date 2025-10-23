import mne
import numpy as np
import json
from pathlib import Path

# ----------------------------
# Settings
# ----------------------------
subject = "fsaverage"
subjects_dir = "data"
parc = "aparc.a2009s"
out_dir = Path("data/json")
out_dir.mkdir(exist_ok=True)

# ----------------------------
# Load inflated surfaces with curvature
# ----------------------------
print("Loading inflated surfaces...")

for hemi_name in ["lh", "rh"]:
    surf_path = Path(subjects_dir) / subject / "surf" / f"{hemi_name}.inflated"
    curv_path = Path(subjects_dir) / subject / "surf" / f"{hemi_name}.curv"
    
    print(f"Reading {surf_path}...")
    verts, tris = mne.read_surface(surf_path)
    
    # Load curvature data - use binary=False to get actual curvature values
    print(f"Reading {curv_path}...")
    curv = mne.surface.read_curvature(curv_path, binary=False)
    print(f"  Curvature range: {curv.min():.3f} to {curv.max():.3f}")
    
    mesh = {
        "vertices": verts.tolist(), 
        "triangles": tris.tolist(),
        "curvature": curv.tolist()  # Add curvature for shading
    }
    with open(out_dir / f"{hemi_name}_inflated.json", "w") as f:
        json.dump(mesh, f)
    print(f"Exported {hemi_name}_inflated.json with curvature data")

# ----------------------------
# Load labels
# ----------------------------
print("Loading labels...")
labels = mne.read_labels_from_annot(subject, parc=parc,
                                    subjects_dir=subjects_dir)

label_data = {}
for label in labels:
    label_data[label.name] = {
        "hemi": label.hemi,
        "vertices": label.vertices.tolist()
    }

with open(out_dir / "labels.json", "w") as f:
    json.dump(label_data, f)

print(f"✅ Exported {len(labels)} labels to {out_dir}")
