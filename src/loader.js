// loader.js
// Data loading and hemisphere initialization

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { createPolyDataFromMesh } from './geometry.js';
import { applyCurvatureColoring } from './rendering.js';
import { updateHemisphereData } from './state.js';
import { loadFreeSurferSurface, loadFreeSurferCurvature } from './freesurfer.js';

/**
 * Load hemisphere mesh data from FreeSurfer binary files and add to renderer
 * @param {string} surfaceUrl - URL to FreeSurfer surface file
 * @param {string} curvatureUrl - URL to FreeSurfer curvature file
 * @param {string} hemi - Hemisphere identifier ('lh' or 'rh')
 * @param {number} offsetX - X-axis offset
 * @param {number} offsetZ - Z-axis offset
 * @param {number} rotateZ - Rotation angle around Z-axis
 * @param {vtkRenderer} renderer - VTK renderer
 * @returns {Promise<vtkActor>} Actor for the loaded hemisphere
 */
export async function loadHemisphere(surfaceUrl, curvatureUrl, hemi, offsetX, offsetZ, rotateZ, renderer) {
  // Load FreeSurfer surface and curvature files
  const surface = await loadFreeSurferSurface(surfaceUrl);
  const curvature = await loadFreeSurferCurvature(curvatureUrl);
  
  // Combine into mesh data object
  const meshData = {
    vertices: surface.vertices,
    triangles: surface.triangles,
    curvature: Array.from(curvature)
  };
  
  const polyData = createPolyDataFromMesh(meshData, offsetX, offsetZ, rotateZ);
  
  const mapper = vtkMapper.newInstance();
  mapper.setInputData(polyData);
  
  // Apply curvature coloring if available
  applyCurvatureColoring(mapper, meshData);

  const actor = vtkActor.newInstance();
  actor.setMapper(mapper);
  renderer.addActor(actor);
  
  // Store in global state
  updateHemisphereData(hemi, {
    meshData,
    actor,
    mapper,
    polyData
  });
  
  return actor;
}

/**
 * Load labels data from JSON file
 * @param {string} url - URL to labels JSON file
 * @returns {Promise<Object>} Labels data
 */
export async function loadLabels(url) {
  const response = await fetch(url);
  return await response.json();
}

/**
 * Load label names lookup data from JSON file
 * @param {string} url - URL to label names JSON file
 * @returns {Promise<Object|null>} Label names data or null if not available
 */
export async function loadLabelNames(url) {
  try {
    const response = await fetch(url);
    return await response.json();
  } catch (error) {
    console.warn('Could not load label names, using FreeSurfer names only:', error);
    return null;
  }
}

/**
 * Load atlases configuration
 * @param {string} url - URL to atlases JSON file
 * @returns {Promise<Object>} Atlases configuration
 */
export async function loadAtlasesConfig(url) {
  const response = await fetch(url);
  return await response.json();
}

/**
 * Load FreeSurfer annotation file and convert to labels format
 * @param {string} lhAnnotUrl - URL to left hemisphere annotation file
 * @param {string} rhAnnotUrl - URL to right hemisphere annotation file
 * @returns {Promise<Object>} Labels data in format compatible with existing code
 */
export async function loadAnnotationLabels(lhAnnotUrl, rhAnnotUrl) {
  const { parseFreeSurferAnnotation } = await import('./freesurfer.js');
  
  // Load both hemisphere annotations
  const lhResponse = await fetch(lhAnnotUrl);
  const lhBuffer = await lhResponse.arrayBuffer();
  const lhAnnotation = parseFreeSurferAnnotation(lhBuffer);
  
  const rhResponse = await fetch(rhAnnotUrl);
  const rhBuffer = await rhResponse.arrayBuffer();
  const rhAnnotation = parseFreeSurferAnnotation(rhBuffer);
  
  // Convert to labels format
  const labels = {};
  
  // Process left hemisphere
  if (lhAnnotation.colorTable) {
    for (const entry of lhAnnotation.colorTable.entries) {
      if (entry.name === 'unknown' || entry.name === 'corpuscallosum' || entry.name === 'Unknown' || entry.name === 'Medial_wall') {
        continue; // Skip unknown, corpus callosum, and medial wall
      }
      
      // Find all vertices with this label
      const vertices = [];
      for (let i = 0; i < lhAnnotation.vertexLabels.length; i++) {
        if (lhAnnotation.vertexLabels[i] === entry.label) {
          vertices.push(lhAnnotation.vertexIndices[i]);
        }
      }
      
      if (vertices.length > 0) {
        // Add hemisphere suffix since annotation names don't include it
        const labelName = `${entry.name}-lh`;
        labels[labelName] = {
          hemi: 'lh',
          vertices: vertices,
          color: [entry.r, entry.g, entry.b]
        };
      }
    }
  }
  
  // Process right hemisphere
  if (rhAnnotation.colorTable) {
    for (const entry of rhAnnotation.colorTable.entries) {
      if (entry.name === 'unknown' || entry.name === 'corpuscallosum' || entry.name === 'Unknown' || entry.name === 'Medial_wall') {
        continue; // Skip unknown, corpus callosum, and medial wall
      }
      
      // Find all vertices with this label
      const vertices = [];
      for (let i = 0; i < rhAnnotation.vertexLabels.length; i++) {
        if (rhAnnotation.vertexLabels[i] === entry.label) {
          vertices.push(rhAnnotation.vertexIndices[i]);
        }
      }
      
      if (vertices.length > 0) {
        // Add hemisphere suffix since annotation names don't include it
        const labelName = `${entry.name}-rh`;
        labels[labelName] = {
          hemi: 'rh',
          vertices: vertices,
          color: [entry.r, entry.g, entry.b]
        };
      }
    }
  }
  
  return labels;
}
