#!/usr/bin/env python3
"""
Generate brain surface data for visualization.

This script exports FreeSurfer surface geometry and labels to JSON format
for use in the brain atlas visualizer.

Supports multiple geometry types:
- inflated: Inflated surface (default, good for visualization)
- original: Original reconstructed surface
- pial: Pial (outer cortical) surface  
- white: White matter surface

Usage:
    python generate_data.py [--geometry GEOM] [--all]
    
Examples:
    python generate_data.py                    # Generate inflated (default)
    python generate_data.py --geometry pial    # Generate pial surface
    python generate_data.py --all              # Generate all geometries
"""

import mne
import numpy as np
import json
import argparse
from pathlib import Path

# ----------------------------
# Settings
# ----------------------------
SUBJECT = "fsaverage"
SUBJECTS_DIR = "data"
PARC = "aparc.a2009s"
OUT_DIR = Path("data/json")

# Available geometry types
GEOMETRY_TYPES = {
    "inflated": "inflated",      # Inflated for better visualization
    "original": "orig",          # Original reconstructed surface
    "pial": "pial",              # Pial (outer) surface
    "white": "white"             # White matter surface
}


def load_surface(hemi_name, geometry_type="inflated"):
    """
    Load a hemisphere surface with curvature data.
    
    Args:
        hemi_name (str): Hemisphere name ('lh' or 'rh')
        geometry_type (str): Type of geometry to load
        
    Returns:
        dict: Dictionary with vertices, triangles, and curvature
    """
    surf_file = GEOMETRY_TYPES.get(geometry_type, geometry_type)
    surf_path = Path(SUBJECTS_DIR) / SUBJECT / "surf" / f"{hemi_name}.{surf_file}"
    curv_path = Path(SUBJECTS_DIR) / SUBJECT / "surf" / f"{hemi_name}.curv"
    
    if not surf_path.exists():
        raise FileNotFoundError(f"Surface file not found: {surf_path}")
    
    print(f"Reading {surf_path}...")
    verts, tris = mne.read_surface(surf_path)
    
    # Load curvature data - use binary=False to get actual curvature values
    print(f"Reading {curv_path}...")
    curv = mne.surface.read_curvature(curv_path, binary=False)
    print(f"  Curvature range: {curv.min():.3f} to {curv.max():.3f}")
    
    mesh = {
        "vertices": verts.tolist(), 
        "triangles": tris.tolist(),
        "curvature": curv.tolist()
    }
    
    return mesh


def export_geometry(geometry_type="inflated"):
    """
    Export geometry for both hemispheres.
    
    Args:
        geometry_type (str): Type of geometry to export
    """
    print(f"\n{'='*60}")
    print(f"Exporting {geometry_type} surfaces...")
    print(f"{'='*60}")
    
    OUT_DIR.mkdir(exist_ok=True)
    
    for hemi_name in ["lh", "rh"]:
        mesh = load_surface(hemi_name, geometry_type)
        
        # Output filename
        out_file = OUT_DIR / f"{hemi_name}_{geometry_type}.json"
        
        with open(out_file, "w") as f:
            json.dump(mesh, f)
        
        print(f"✅ Exported {out_file.name} ({len(mesh['vertices'])} vertices)")


def export_labels():
    """
    Export label data (only needs to be done once).
    """
    print(f"\n{'='*60}")
    print("Exporting labels...")
    print(f"{'='*60}")
    
    labels = mne.read_labels_from_annot(
        SUBJECT, 
        parc=PARC,
        subjects_dir=SUBJECTS_DIR
    )

    label_data = {}
    for label in labels:
        label_data[label.name] = {
            "hemi": label.hemi,
            "vertices": label.vertices.tolist()
        }

    out_file = OUT_DIR / "labels.json"
    with open(out_file, "w") as f:
        json.dump(label_data, f)

    print(f"✅ Exported {len(labels)} labels to {out_file.name}")


def main():
    """Main entry point."""
    parser = argparse.ArgumentParser(
        description="Generate brain surface data for visualization",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog=__doc__
    )
    
    parser.add_argument(
        "--geometry",
        "-g",
        choices=list(GEOMETRY_TYPES.keys()),
        default="inflated",
        help="Geometry type to generate (default: inflated)"
    )
    
    parser.add_argument(
        "--all",
        "-a",
        action="store_true",
        help="Generate all geometry types"
    )
    
    parser.add_argument(
        "--labels-only",
        action="store_true",
        help="Only export labels (skip geometry)"
    )
    
    args = parser.parse_args()
    
    print(f"\nBrain Atlas Data Generator")
    print(f"Subject: {SUBJECT}")
    print(f"Parcellation: {PARC}")
    print(f"Output directory: {OUT_DIR}")
    
    try:
        if args.labels_only:
            # Only export labels
            export_labels()
        elif args.all:
            # Export all geometry types
            for geom_type in GEOMETRY_TYPES.keys():
                export_geometry(geom_type)
            export_labels()
        else:
            # Export specified geometry
            export_geometry(args.geometry)
            export_labels()
        
        print(f"\n{'='*60}")
        print("✅ All data exported successfully!")
        print(f"{'='*60}\n")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    exit(main())
