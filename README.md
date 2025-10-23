# Brain Atlas Visualizer

An interactive 3D brain atlas visualizer using VTK.js to display FreeSurfer brain surfaces with anatomical parcellations.

The visualizer is running at [https://hietalp.github.io/brain-atlas-visualizer/](https://hietalp.github.io/brain-atlas-visualizer/).

## Setup

### Prerequisites

- Node.js and npm
- FreeSurfer fsaverage data

### Installation

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Bundle VTK.js application:**
   ```bash
   npm run build
   ```
   
   This creates `./deploy/vtk_bundle.js` which is required for the visualization.

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

1. Ensure `./deploy/vtk_bundle.js` is committed (it's needed for the page to work)
2. Push to GitHub
3. Enable GitHub Pages in repository settings
4. The visualization will be available at your GitHub Pages URL

## Project Structure

```
brain-atlas-visualizer/
├── index.html              # Main HTML page
├── style.css               # Stylesheet
├── package.json            # Node.js dependencies
├── data/
│   ├── atlases.json        # Atlas configuration
│   ├── fsaverage/          # FreeSurfer fsaverage template
│   │   ├── surf/           # Surface files (.inflated, .white, .pial, .curv)
│   │   └── label/          # Annotation files (.annot)
│   └── lookups/            # Human-readable label names (JSON)
├── src/                    # JavaScript source modules
├── deploy/
│   └── vtk_bundle.js       # Bundled VTK.js application (generated)
└── README.md
```

## Citations

### FreeSurfer
Fischl, B. (2012). FreeSurfer. *NeuroImage*, 62(2), 774-781.  
https://doi.org/10.1016/j.neuroimage.2012.01.021

### Brain Atlases

**Desikan-Killiany Atlas (aparc)**  
Desikan, R. S., et al. (2006). An automated labeling system for subdividing the human cerebral cortex on MRI scans into gyral based regions of interest. *NeuroImage*, 31(3), 968-980.  
https://doi.org/10.1016/j.neuroimage.2006.01.021

**Destrieux Atlas (aparc.a2009s)**  
Destrieux, C., et al. (2010). Automatic parcellation of human cortical gyri and sulci using standard anatomical nomenclature. *NeuroImage*, 53(1), 1-15.  
https://doi.org/10.1016/j.neuroimage.2010.06.010

**HCP Multi-Modal Parcellation (HCPMMP1)**  
Glasser, M. F., et al. (2016). A multi-modal parcellation of human cerebral cortex. *Nature*, 536(7615), 171-178.  
https://doi.org/10.1038/nature18933

**Yeo 7 and 17 Networks**  
Yeo, B. T., et al. (2011). The organization of the human cerebral cortex estimated by intrinsic functional connectivity. *Journal of Neurophysiology*, 106(3), 1125-1165.  
https://doi.org/10.1152/jn.00338.2011

**Brodmann Areas**  
Brodmann, K. (1909). *Vergleichende Lokalisationslehre der Grosshirnrinde in ihren Prinzipien dargestellt auf Grund des Zellenbaues*. Leipzig: Barth.

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
