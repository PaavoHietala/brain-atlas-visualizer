// rendering.js
// VTK rendering utilities and color mapping

import vtkColorTransferFunction from '@kitware/vtk.js/Rendering/Core/ColorTransferFunction';

/**
 * Create lookup table for curvature visualization
 * @returns {vtkColorTransferFunction} Color transfer function
 */
export function createCurvatureLookupTable() {
  const lookupTable = vtkColorTransferFunction.newInstance();
  lookupTable.addRGBPoint(-1.0, 0.3, 0.3, 0.3);   // dark gray for deep sulci
  lookupTable.addRGBPoint(-0.2, 0.5, 0.5, 0.5);   // medium-dark gray
  lookupTable.addRGBPoint(0.0, 0.7, 0.7, 0.7);    // medium gray
  lookupTable.addRGBPoint(0.2, 0.85, 0.85, 0.85); // light gray
  lookupTable.addRGBPoint(1.0, 0.95, 0.95, 0.95); // very light gray for gyri
  return lookupTable;
}

/**
 * Create lookup table with label highlighting and curvature
 * @returns {vtkColorTransferFunction} Color transfer function
 */
export function createLabelHighlightLookupTable() {
  const lookupTable = vtkColorTransferFunction.newInstance();
  
  // Curvature colors (gray scale)
  lookupTable.addRGBPoint(-1.0, 0.3, 0.3, 0.3);   // dark gray for deep sulci
  lookupTable.addRGBPoint(-0.2, 0.5, 0.5, 0.5);   // medium-dark gray
  lookupTable.addRGBPoint(0.0, 0.7, 0.7, 0.7);    // medium gray
  lookupTable.addRGBPoint(0.2, 0.85, 0.85, 0.85); // light gray
  lookupTable.addRGBPoint(1.0, 0.95, 0.95, 0.95); // very light gray for gyri
  
  // Label color (red/orange for highlighted region)
  lookupTable.addRGBPoint(5.0, 1.0, 0.5, 0.2);    // orange
  lookupTable.addRGBPoint(10.0, 1.0, 0.3, 0.1);   // red-orange
  
  return lookupTable;
}

/**
 * Apply curvature coloring to mapper
 * @param {vtkMapper} mapper - VTK mapper
 * @param {Object} meshData - Mesh data with curvature
 */
export function applyCurvatureColoring(mapper, meshData) {
  if (meshData.curvature) {
    const lookupTable = createCurvatureLookupTable();
    mapper.setLookupTable(lookupTable);
    mapper.setScalarModeToUsePointData();
    mapper.setScalarVisibility(true);
    mapper.setScalarRange(-1.0, 1.0);
  }
}

/**
 * Apply label highlight coloring to mapper
 * @param {vtkMapper} mapper - VTK mapper
 */
export function applyLabelHighlightColoring(mapper) {
  const lookupTable = createLabelHighlightLookupTable();
  mapper.setLookupTable(lookupTable);
  mapper.setScalarModeToUsePointData();
  mapper.setScalarVisibility(true);
  mapper.setScalarRange(-1.0, 10.0);
}
