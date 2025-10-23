// labels.js
// Label highlighting and interaction management

import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';
import { createPolyDataFromMesh, computeLabelCenterAndNormal } from './geometry.js';
import { applyCurvatureColoring, applyLabelHighlightColoring } from './rendering.js';
import { positionCameraForLabel } from './camera.js';
import { 
  state, 
  getLabelsData, 
  getHemisphereConfig, 
  getRenderWindow,
  setCurrentSelectedLabel,
  getCurrentSelectedLabel
} from './state.js';

/**
 * Highlight a specific label region
 * @param {string} labelName - Name of the label to highlight
 */
export function highlightLabel(labelName) {
  const labelsData = getLabelsData();
  
  if (!labelsData || !labelsData[labelName]) {
    console.warn('Label not found:', labelName);
    return;
  }
  
  const label = labelsData[labelName];
  const targetHemi = label.hemi;
  const vertices = label.vertices;
  
  const targetConfig = getHemisphereConfig(targetHemi);
  if (!targetConfig.meshData) {
    console.warn('Hemisphere data not loaded:', targetHemi);
    return;
  }
  
  // Reset both hemispheres to default coloring first
  ['lh', 'rh'].forEach(hemi => {
    const config = getHemisphereConfig(hemi);
    if (!config.meshData) return;
    
    const meshData = config.meshData;
    const mapper = config.mapper;
    
    if (hemi === targetHemi) {
      // This is the hemisphere with the label - apply highlighting
      const labelVertexSet = new Set(vertices);
      const numVertices = meshData.vertices.length;
      const blendedScalars = new Float32Array(numVertices);
      
      // Blend label mask with curvature
      for (let i = 0; i < numVertices; i++) {
        if (labelVertexSet.has(i)) {
          // Label vertex: use a high value to map to red
          blendedScalars[i] = 10.0;
        } else {
          // Non-label vertex: use curvature value
          blendedScalars[i] = meshData.curvature ? meshData.curvature[i] : 0;
        }
      }
      
      // Create new polydata with blended scalars
      const polyData = createPolyDataFromMesh(
        meshData, 
        config.offsetX,
        config.offsetZ,
        config.rotateZ
      );
      const scalars = vtkDataArray.newInstance({
        name: 'BlendedData',
        values: blendedScalars,
        numberOfComponents: 1,
      });
      polyData.getPointData().setScalars(scalars);
      
      mapper.setInputData(polyData);
      applyLabelHighlightColoring(mapper);
      
      config.polyData = polyData;
    } else {
      // Other hemisphere - reset to default curvature coloring
      const polyData = createPolyDataFromMesh(
        meshData, 
        config.offsetX,
        config.offsetZ,
        config.rotateZ
      );
      
      mapper.setInputData(polyData);
      applyCurvatureColoring(mapper, meshData);
      
      config.polyData = polyData;
    }
  });
  
  // Compute label center and normal, then position camera
  const { center, normal } = computeLabelCenterAndNormal(
    targetConfig.meshData, 
    vertices, 
    targetConfig.offsetX,
    targetConfig.offsetZ,
    targetConfig.rotateZ
  );
  positionCameraForLabel(center, normal);
}

/**
 * Reset all hemispheres to default curvature coloring
 */
export function resetToDefaultColoring() {
  ['lh', 'rh'].forEach(hemi => {
    const config = getHemisphereConfig(hemi);
    if (!config.meshData) return;
    
    const meshData = config.meshData;
    const mapper = config.mapper;
    const polyData = createPolyDataFromMesh(
      meshData, 
      config.offsetX,
      config.offsetZ,
      config.rotateZ
    );
    
    mapper.setInputData(polyData);
    applyCurvatureColoring(mapper, meshData);
    
    config.polyData = polyData;
  });
  
  // Just re-render, don't move the camera
  const renderWindow = getRenderWindow();
  if (renderWindow) {
    renderWindow.render();
  }
}

/**
 * Handle label click event
 * @param {string} labelName - Name of the clicked label
 */
export function handleLabelClick(labelName) {
  const currentLabel = getCurrentSelectedLabel();
  
  // Remove active class from all labels
  document.querySelectorAll('.label-list li').forEach(el => el.classList.remove('active'));
  
  if (currentLabel === labelName) {
    // Deselect if clicking the same label
    setCurrentSelectedLabel(null);
    resetToDefaultColoring();
  } else {
    // Select new label
    setCurrentSelectedLabel(labelName);
    
    // Add active class to clicked label
    const labelElements = document.querySelectorAll('.label-list li');
    labelElements.forEach(el => {
      if (el.dataset.labelName === labelName) {
        el.classList.add('active');
      }
    });
    
    highlightLabel(labelName);
  }
}
