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

// Store active opacity animations
const opacityAnimations = new Map();

/**
 * Smoothly animate opacity change for an actor
 * @param {vtkActor} actor - VTK actor
 * @param {number} targetOpacity - Target opacity value (0.0 to 1.0)
 * @param {number} duration - Animation duration in milliseconds
 * @param {Function} onComplete - Optional callback when animation completes
 * @param {Function} renderCallback - Function to trigger render
 */
export function animateOpacity(actor, targetOpacity, duration = 500, onComplete = null, renderCallback = null) {
  if (!actor) return;
  
  const property = actor.getProperty();
  const startOpacity = property.getOpacity();
  
  // If already at target, no animation needed
  if (Math.abs(startOpacity - targetOpacity) < 0.001) {
    if (onComplete) onComplete();
    return;
  }
  
  // Cancel any existing animation for this actor
  const existingAnimation = opacityAnimations.get(actor);
  if (existingAnimation) {
    cancelAnimationFrame(existingAnimation.frameId);
  }
  
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const progress = Math.min(elapsed / duration, 1.0);
    
    // Ease-in-out function for smooth animation
    const eased = progress < 0.5
      ? 2 * progress * progress
      : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    
    const currentOpacity = startOpacity + (targetOpacity - startOpacity) * eased;
    property.setOpacity(currentOpacity);
    
    if (renderCallback) {
      renderCallback();
    }
    
    if (progress < 1.0) {
      const frameId = requestAnimationFrame(animate);
      opacityAnimations.set(actor, { frameId, startTime });
    } else {
      opacityAnimations.delete(actor);
      if (onComplete) onComplete();
    }
  }
  
  const frameId = requestAnimationFrame(animate);
  opacityAnimations.set(actor, { frameId, startTime });
}

/**
 * Check if the opposite hemisphere occludes the view of the label
 * @param {Array} cameraPos - Camera position [x, y, z]
 * @param {Object} targetConfig - Target hemisphere configuration
 * @param {Object} oppositeConfig - Opposite hemisphere configuration
 * @param {Object} meshData - Mesh data for the target hemisphere
 * @param {Array} labelVertices - Array of vertex indices in the label
 * @param {number} offsetX - X offset for the target hemisphere
 * @param {number} offsetZ - Z offset for the target hemisphere
 * @param {number} rotateZ - Z rotation for the target hemisphere
 * @returns {boolean} True if opposite hemisphere occludes any part of the label
 */
export function checkHemisphereOcclusion(cameraPos, targetConfig, oppositeConfig, meshData, labelVertices, offsetX, offsetZ, rotateZ) {
  if (!oppositeConfig.meshData || !targetConfig.meshData) return false;
  
  // Calculate the actual bounding box of the opposite hemisphere in world space
  const oppAngleRad = (oppositeConfig.rotateZ * Math.PI) / 180;
  const oppCosAngle = Math.cos(oppAngleRad);
  const oppSinAngle = Math.sin(oppAngleRad);
  
  const oppMeshData = oppositeConfig.meshData;
  const oppOffsetX = oppositeConfig.offsetX;
  const oppOffsetZ = oppositeConfig.offsetZ || 0;
  
  // Calculate approximate bounds of opposite hemisphere in world space
  let minOppX = Infinity, maxOppX = -Infinity;
  let minOppY = Infinity, maxOppY = -Infinity;
  let minOppZ = Infinity, maxOppZ = -Infinity;
  
  // Sample some vertices from opposite hemisphere to get its bounds
  const oppSampleSize = Math.min(100, oppMeshData.vertices.length);
  const oppStep = Math.max(1, Math.floor(oppMeshData.vertices.length / oppSampleSize));
  
  for (let i = 0; i < oppMeshData.vertices.length; i += oppStep) {
    const v = oppMeshData.vertices[i];
    const x = v[0];
    const y = v[1];
    const z = v[2];
    
    // Apply rotation and offset to opposite hemisphere vertices
    const rotX = x * oppCosAngle - y * oppSinAngle;
    const rotY = x * oppSinAngle + y * oppCosAngle;
    
    const worldX = rotX + oppOffsetX;
    const worldY = rotY;
    const worldZ = z + oppOffsetZ;
    
    minOppX = Math.min(minOppX, worldX);
    maxOppX = Math.max(maxOppX, worldX);
    minOppY = Math.min(minOppY, worldY);
    maxOppY = Math.max(maxOppY, worldY);
    minOppZ = Math.min(minOppZ, worldZ);
    maxOppZ = Math.max(maxOppZ, worldZ);
  }
  
  // Calculate opposite hemisphere center in world space
  const oppCenterX = (minOppX + maxOppX) / 2;
  const oppCenterY = (minOppY + maxOppY) / 2;
  const oppCenterZ = (minOppZ + maxOppZ) / 2;
  
  // Distance from camera to hemisphere centers
  const distToOpposite = Math.sqrt(
    Math.pow(oppCenterX - cameraPos[0], 2) +
    Math.pow(oppCenterY - cameraPos[1], 2) +
    Math.pow(oppCenterZ - cameraPos[2], 2)
  );
  
  const distToTarget = Math.sqrt(
    Math.pow(offsetX - cameraPos[0], 2) +
    Math.pow(0 - cameraPos[1], 2) +
    Math.pow(offsetZ - cameraPos[2], 2)
  );
  
  // If opposite hemisphere is significantly farther, no occlusion
  if (distToOpposite > distToTarget * 1.3) {
    return false;
  }
  
  // Calculate target hemisphere transformation
  const targetAngleRad = (rotateZ * Math.PI) / 180;
  const targetCosAngle = Math.cos(targetAngleRad);
  const targetSinAngle = Math.sin(targetAngleRad);
  
  // Sample vertices from the label to check for occlusion
  const sampleSize = Math.min(50, Math.max(10, Math.floor(labelVertices.length / 10)));
  const step = Math.max(1, Math.floor(labelVertices.length / sampleSize));
  
  let occludedCount = 0;
  const threshold = Math.max(2, Math.floor(sampleSize * 0.1)); // At least 10% must be occluded
  
  // Expand bounding box slightly to account for surface curvature
  const expansion = 15;
  const boxMinX = minOppX - expansion;
  const boxMaxX = maxOppX + expansion;
  const boxMinY = minOppY - expansion;
  const boxMaxY = maxOppY + expansion;
  const boxMinZ = minOppZ - expansion;
  const boxMaxZ = maxOppZ + expansion;
  
  for (let i = 0; i < labelVertices.length; i += step) {
    const vertexIdx = labelVertices[i];
    const vertex = meshData.vertices[vertexIdx];
    
    // Apply transformation to label vertex
    const x = vertex[0];
    const y = vertex[1];
    const z = vertex[2];
    
    const rotatedX = x * targetCosAngle - y * targetSinAngle;
    const rotatedY = x * targetSinAngle + y * targetCosAngle;
    
    const vertexWorldX = rotatedX + offsetX;
    const vertexWorldY = rotatedY;
    const vertexWorldZ = z + offsetZ;
    
    // Direction from camera to this vertex
    const dirX = vertexWorldX - cameraPos[0];
    const dirY = vertexWorldY - cameraPos[1];
    const dirZ = vertexWorldZ - cameraPos[2];
    const distanceToVertex = Math.sqrt(dirX * dirX + dirY * dirY + dirZ * dirZ);
    
    if (distanceToVertex < 1) continue;
    
    // Normalize direction
    const ndirX = dirX / distanceToVertex;
    const ndirY = dirY / distanceToVertex;
    const ndirZ = dirZ / distanceToVertex;
    
    // Ray-box intersection test
    let tMin = 0;
    let tMax = distanceToVertex * 0.98;
    let intersects = true;
    
    if (Math.abs(ndirX) > 0.0001) {
      const t1 = (boxMinX - cameraPos[0]) / ndirX;
      const t2 = (boxMaxX - cameraPos[0]) / ndirX;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (cameraPos[0] < boxMinX || cameraPos[0] > boxMaxX) {
      intersects = false;
    }
    
    if (intersects && Math.abs(ndirY) > 0.0001) {
      const t1 = (boxMinY - cameraPos[1]) / ndirY;
      const t2 = (boxMaxY - cameraPos[1]) / ndirY;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (intersects && (cameraPos[1] < boxMinY || cameraPos[1] > boxMaxY)) {
      intersects = false;
    }
    
    if (intersects && Math.abs(ndirZ) > 0.0001) {
      const t1 = (boxMinZ - cameraPos[2]) / ndirZ;
      const t2 = (boxMaxZ - cameraPos[2]) / ndirZ;
      tMin = Math.max(tMin, Math.min(t1, t2));
      tMax = Math.min(tMax, Math.max(t1, t2));
    } else if (intersects && (cameraPos[2] < boxMinZ || cameraPos[2] > boxMaxZ)) {
      intersects = false;
    }
    
    // If ray intersects the opposite hemisphere bounding box before reaching the vertex
    if (intersects && tMin <= tMax && tMin > 0 && tMin < distanceToVertex * 0.98) {
      occludedCount++;
      if (occludedCount >= threshold) {
        return true;
      }
    }
  }
  
  return occludedCount >= threshold;
}

/**
 * Adjust hemisphere opacity based on occlusion with smooth fade
 * @param {string} targetHemi - Hemisphere containing the selected label
 * @param {Object} meshData - Mesh data for the target hemisphere
 * @param {Array} labelVertices - Array of vertex indices in the label
 * @param {number} offsetX - X offset for the target hemisphere
 * @param {number} offsetZ - Z offset for the target hemisphere
 * @param {number} rotateZ - Z rotation for the target hemisphere
 * @param {Object} getHemisphereConfig - Function to get hemisphere config
 * @param {Object} renderer - VTK renderer
 * @param {Function} renderCallback - Function to trigger render
 */
export function adjustHemisphereOpacitySmooth(targetHemi, meshData, labelVertices, offsetX, offsetZ, rotateZ, getHemisphereConfig, renderer, renderCallback) {
  if (!renderer) return;
  
  const camera = renderer.getActiveCamera();
  const cameraPos = camera.getPosition();
  
  const oppositeHemi = targetHemi === 'lh' ? 'rh' : 'lh';
  const oppositeConfig = getHemisphereConfig(oppositeHemi);
  const targetConfig = getHemisphereConfig(targetHemi);
  
  // Check if opposite hemisphere is occluding any part of the label
  const isOccluding = checkHemisphereOcclusion(
    cameraPos,
    targetConfig,
    oppositeConfig,
    meshData,
    labelVertices,
    offsetX,
    offsetZ,
    rotateZ
  );
  
  // Adjust opacity of hemispheres with smooth animation
  ['lh', 'rh'].forEach(hemi => {
    const config = getHemisphereConfig(hemi);
    if (!config.actor) return;
    
    const targetOpacity = (hemi === targetHemi) ? 1.0 : (isOccluding ? 0.2 : 1.0);
    animateOpacity(config.actor, targetOpacity, 500, null, renderCallback);
  });
}

/**
 * Reset hemisphere opacity to full with smooth fade
 * @param {Array} hemispheres - Array of hemisphere names to reset
 * @param {Function} getHemisphereConfig - Function to get hemisphere config
 * @param {Function} renderCallback - Function to trigger render
 */
export function resetHemisphereOpacitySmooth(hemispheres, getHemisphereConfig, renderCallback) {
  hemispheres.forEach(hemi => {
    const config = getHemisphereConfig(hemi);
    if (!config.actor) return;
    
    animateOpacity(config.actor, 1.0, 500, null, renderCallback);
  });
}

/**
 * Setup camera interaction listener for dynamic opacity updates during label viewing
 * This should be called whenever a label is highlighted to enable real-time occlusion detection
 * @param {Function} getRenderWindow - Function to get render window
 * @param {Function} getRenderer - Function to get renderer
 * @param {Function} getCurrentSelectedLabel - Function to get current label
 * @param {Function} getLabelsData - Function to get labels data
 * @param {Function} getHemisphereConfig - Function to get hemisphere config
 */
export function setupCameraInteractionListener(getRenderWindow, getRenderer, getCurrentSelectedLabel, getLabelsData, getHemisphereConfig) {
  const renderWindow = getRenderWindow();
  const renderer = getRenderer();
  
  if (!renderWindow || !renderer) return;
  
  const interactor = renderWindow.getInteractor();
  if (!interactor) return;
  
  // Store reference to prevent duplicate listeners
  if (interactor._occlusionListenerActive) {
    return; // Already set up
  }
  
  interactor._occlusionListenerActive = true;
  
  // Listen for interaction events
  interactor.onAnimation(() => {
    const currentLabel = getCurrentSelectedLabel();
    if (!currentLabel) return;
    
    const labelsData = getLabelsData();
    if (!labelsData || !labelsData[currentLabel]) return;
    
    const label = labelsData[currentLabel];
    const targetHemi = label.hemi;
    const vertices = label.vertices;
    const targetConfig = getHemisphereConfig(targetHemi);
    
    if (!targetConfig.meshData) return;
    
    // Update opacity based on current camera position with smooth fade
    adjustHemisphereOpacitySmooth(
      targetHemi,
      targetConfig.meshData,
      vertices,
      targetConfig.offsetX,
      targetConfig.offsetZ,
      targetConfig.rotateZ,
      getHemisphereConfig,
      renderer,
      () => renderWindow.render()
    );
  });
}
