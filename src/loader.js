// loader.js
// Data loading and hemisphere initialization

import vtkActor from '@kitware/vtk.js/Rendering/Core/Actor';
import vtkMapper from '@kitware/vtk.js/Rendering/Core/Mapper';
import { createPolyDataFromMesh } from './geometry.js';
import { applyCurvatureColoring } from './rendering.js';
import { updateHemisphereData } from './state.js';

/**
 * Load hemisphere mesh data from JSON file and add to renderer
 * @param {string} url - URL to JSON file
 * @param {string} hemi - Hemisphere identifier ('lh' or 'rh')
 * @param {number} offsetX - X-axis offset
 * @param {number} offsetZ - Z-axis offset
 * @param {number} rotateZ - Rotation angle around Z-axis
 * @param {vtkRenderer} renderer - VTK renderer
 * @returns {Promise<vtkActor>} Actor for the loaded hemisphere
 */
export async function loadHemisphere(url, hemi, offsetX, offsetZ, rotateZ, renderer) {
  const response = await fetch(url);
  const meshData = await response.json();
  
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
