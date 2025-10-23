# Source Code Structure

This directory contains the modularized source code for the Brain Atlas Visualizer.

## File Organization

### Core Modules

- **`main.js`** - Application entry point and initialization
  - Sets up the VTK renderer and render window
  - Coordinates loading of all data and initialization of components
  - Main application lifecycle management

- **`state.js`** - Global state management
  - Centralized state store for application data
  - Hemisphere configurations
  - Label data and current selections
  - Renderer and render window references
  - Provides getter/setter functions for safe state access

### Geometry and Rendering

- **`geometry.js`** - Mesh geometry utilities
  - `createPolyDataFromMesh()` - Creates VTK polydata from mesh data
  - `computeLabelCenterAndNormal()` - Calculates label region centers and normals
  - Handles vertex transformations (rotation, translation)

- **`rendering.js`** - Rendering and coloring utilities
  - `createCurvatureLookupTable()` - Gray-scale coloring for sulcal depth
  - `createLabelHighlightLookupTable()` - Red/orange highlighting for selected labels
  - `applyCurvatureColoring()` - Applies curvature colors to mappers
  - `applyLabelHighlightColoring()` - Applies highlight colors to mappers

### Interaction and Visualization

- **`camera.js`** - Camera control and animation
  - `positionCameraForLabel()` - Smooth animated camera transitions
  - `resetCamera()` - Reset to default view
  - Uses cubic ease-in-out for smooth animations

- **`labels.js`** - Label highlighting and interaction
  - `highlightLabel()` - Highlights specific brain regions
  - `resetToDefaultColoring()` - Removes highlighting
  - `handleLabelClick()` - Processes label selection events

- **`loader.js`** - Data loading utilities
  - `loadHemisphere()` - Loads and initializes hemisphere meshes
  - `loadLabels()` - Loads label definitions
  - `loadLabelNames()` - Loads plain English name mappings
  - All async functions returning Promises

### User Interface

- **`ui.js`** - UI management and event handlers
  - `populateLabelList()` - Creates label buttons in sidebar
  - `initializeHelpModal()` - Sets up instructions dialog
  - `initializeNameToggle()` - Sets up FreeSurfer/English name toggle
  - `showLoading()`, `hideLoading()`, `showError()` - Loading state management

- **`orientation.js`** - Orientation widget setup
  - `createOrientationWidget()` - Creates RGB axis display in corner
  - Configures size and position

## Module Dependencies

```
main.js
├── state.js (global state)
├── loader.js
│   ├── geometry.js
│   ├── rendering.js
│   └── state.js
├── orientation.js
├── camera.js
│   └── state.js
├── labels.js
│   ├── geometry.js
│   ├── rendering.js
│   ├── camera.js
│   └── state.js
└── ui.js
    ├── state.js
    └── labels.js
```

## Design Principles

1. **Separation of Concerns** - Each module has a single, well-defined responsibility
2. **Loose Coupling** - Modules communicate through state.js, not direct dependencies
3. **Pure Functions** - Most utility functions are pure (no side effects)
4. **Async/Await** - Modern async patterns for data loading
5. **ES6 Modules** - Standard import/export syntax
6. **Single Source of Truth** - All state managed through state.js

## Building

The modularized source must be bundled for browser use. Update your build configuration:

```javascript
// In your bundler config, point entry to:
entry: './bundle_entry_new.js'
```

This will import `src/main.js` which orchestrates all other modules.

## Future Improvements

- Add TypeScript for type safety
- Implement unit tests for pure functions
- Add JSDoc comments for better IDE support
- Consider Redux or similar for complex state management
- Add error boundaries and better error handling
