# Brain Atlas Visualizer

An interactive 3D brain atlas visualizer using VTK.js to display FreeSurfer brain surfaces with anatomical parcellations.

## Features

- Interactive 3D visualization of brain hemispheres
- FreeSurfer fsaverage template with inflated surface
- Curvature-based shading for realistic brain appearance
- Anatomical parcellation labels (Destrieux atlas)
- Interactive sidebar with clickable labels organized by hemisphere
- Click any label to highlight it on the brain surface
- Dual-hemisphere view with separated left and right hemispheres

## Setup

### Prerequisites

- Python 3.x with MNE-Python
- Node.js and npm
- FreeSurfer fsaverage data

### Installation

1. **Install Python dependencies:**
   ```bash
   pip install mne numpy
   ```

2. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

3. **Generate JSON data from FreeSurfer surfaces:**
   ```bash
   python generate_data.py
   ```
   
   This will create JSON files in `data/json/`:
   - `lh_inflated.json` - Left hemisphere geometry and curvature
   - `rh_inflated.json` - Right hemisphere geometry and curvature
   - `labels.json` - Anatomical labels from Destrieux atlas

4. **Bundle VTK.js application:**
   ```bash
   npm run build
   ```
   
   This creates `vtk_bundle.js` which is required for the visualization.

## Usage

### Local Development

Open `index.html` in a web browser. For best results, use a local web server:

```bash
# Python 3
python -m http.server 8000

# Then open http://localhost:8000 in your browser
```

### GitHub Pages Deployment

The project is configured to work with GitHub Pages:

1. Ensure `vtk_bundle.js` is committed (it's needed for the page to work)
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. The visualization will be available at your GitHub Pages URL

## Project Structure

```
brain-atlas-visualizer/
├── index.html              # Main HTML page
├── style.css              # Stylesheet
├── bundle_entry.js         # VTK.js application source
├── vtk_bundle.js          # Bundled VTK.js application (generated)
├── generate_data.py       # Python script to export FreeSurfer data
├── package.json           # Node.js dependencies
├── data/
│   ├── fsaverage/        # FreeSurfer fsaverage template
│   │   ├── surf/         # Surface files (.inflated, .white, .curv)
│   │   └── label/        # Annotation files (.annot)
│   └── json/             # Generated JSON files
└── README.md
```

## Modifying the Visualization

### Change Surface Type

To visualize different surfaces (white, pial, sphere), edit `generate_data.py`:

```python
surf_path = Path(subjects_dir) / subject / "surf" / f"{hemi_name}.white"  # or .pial, .sphere
```

### Adjust Curvature Coloring

Modify the color lookup table in `bundle_entry.js`:

```javascript
// Adjust these RGB values and scalar positions
lookupTable.addRGBPoint(-1.0, 0.3, 0.3, 0.3);  // dark for sulci
lookupTable.addRGBPoint(1.0, 0.95, 0.95, 0.95); // light for gyri
```

### Separate Hemispheres

Adjust the offset values in `bundle_entry.js`:

```javascript
await loadHemisphere('data/json/lh_inflated.json', -50, renderer);  // Increase/decrease offset
await loadHemisphere('data/json/rh_inflated.json', 50, renderer);
```

## Dependencies

### Python
- `mne` - MNE-Python for neuroimaging data processing
- `numpy` - Numerical computations

### JavaScript (Node.js)
- `@kitware/vtk.js` - 3D visualization toolkit
- `webpack` - Module bundler
- `webpack-cli` - Webpack command line interface

## License

[Specify your license here]

## Acknowledgments

- FreeSurfer fsaverage template
- VTK.js visualization library
- MNE-Python for neuroimaging tools
