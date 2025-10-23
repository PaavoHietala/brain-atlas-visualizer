# Brain Atlas Data Generation Tools

This directory contains tools for generating brain surface data for the visualizer.

## generate_data.py

Exports FreeSurfer surface geometry and labels to JSON format for visualization.

### Requirements

```bash
pip install mne numpy
```

### Usage

#### Generate Default (Inflated) Geometry
```bash
cd tools
python generate_data.py
```

#### Generate Specific Geometry Type
```bash
python generate_data.py --geometry pial
python generate_data.py --geometry white
python generate_data.py --geometry original
```

#### Generate All Geometry Types
```bash
python generate_data.py --all
```

#### Export Labels Only
```bash
python generate_data.py --labels-only
```

### Available Geometry Types

| Type | File Extension | Description |
|------|---------------|-------------|
| `inflated` | `.inflated` | Inflated surface (default, best for visualization) |
| `original` | `.orig` | Original reconstructed surface |
| `pial` | `.pial` | Pial (outer cortical) surface |
| `white` | `.white` | White matter surface |

### Output Files

The script generates JSON files in `data/json/`:

**Geometry files:**
- `lh_inflated.json` / `rh_inflated.json` - Inflated surfaces
- `lh_original.json` / `rh_original.json` - Original surfaces
- `lh_pial.json` / `rh_pial.json` - Pial surfaces
- `lh_white.json` / `rh_white.json` - White matter surfaces

**Label file:**
- `labels.json` - Brain region labels (same for all geometries)

### Data Structure

Each geometry JSON file contains:
```json
{
  "vertices": [[x, y, z], ...],     // Vertex coordinates
  "triangles": [[i, j, k], ...],    // Triangle indices
  "curvature": [val, ...]           // Sulcal depth values
}
```

### Command Line Options

```
python generate_data.py --help
```

Options:
- `-g, --geometry {inflated,original,pial,white}` - Geometry type to generate
- `-a, --all` - Generate all geometry types
- `--labels-only` - Only export labels (skip geometry)

### Examples

**Setup for development:**
```bash
# Generate all geometries for testing
python generate_data.py --all
```

**Update only labels:**
```bash
# If you've modified the parcellation
python generate_data.py --labels-only
```

**Add a new geometry type:**
```bash
# Generate pial surface for medical accuracy
python generate_data.py --geometry pial
```

## Troubleshooting

### "File not found" errors
- Ensure FreeSurfer data is in `data/fsaverage/surf/`
- Check that the geometry file exists (e.g., `lh.pial`)

### MNE import errors
```bash
pip install --upgrade mne numpy
```

### Permission errors
- Ensure you have write access to `data/json/`
- Run from the project root or tools directory

## Integration with Visualizer

After generating geometry files:

1. The visualizer will automatically detect available geometries
2. Use the dropdown menu in the sidebar to switch between them
3. Files are loaded on-demand (not all at startup)

## Performance Notes

- Inflated surfaces: ~60-80MB per hemisphere
- Original surfaces: Similar size
- Pial/white surfaces: Similar size
- Generation time: ~5-10 seconds per geometry type
- Browser loading: ~1-2 seconds per geometry switch
