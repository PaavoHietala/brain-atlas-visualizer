# Brain Atlas Visualizer

An interactive 3D brain atlas visualizer using VTK.js to display FreeSurfer brain surfaces with anatomical parcellations.

The visualizer is running at [https://hietalp.github.io/brain-atlas-visualizer/](https://hietalp.github.io/brain-atlas-visualizer/).

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

## License Notice

### 1. Visualization Code
All website code, JavaScript modules, and build scripts in this repository are released under the **BSD 3-Clause License** (see `license/LICENSE.md`).

### 2. FreeSurfer Data
This project includes data (fsaverage surfaces and annotation files) obtained under license from
The General Hospital Corporation (MGH) as part of the FreeSurfer package.

All such data are subject to the FreeSurfer Software License Agreement, included in `license/FREESURFER.md`.

FreeSurfer © The General Hospital Corporation (MGH). All rights reserved.

### 3. VTK.js
The visualization uses [VTK.js](https://kitware.github.io/vtk-js/),  
a BSD-3-Clause licensed JavaScript library for 3D visualization.  
The license is included in `license/VTK-JS.md`.
