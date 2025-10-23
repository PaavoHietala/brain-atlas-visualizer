// camera.js
// Camera positioning and animation utilities

import { getRenderer, getRenderWindow } from './state.js';

/**
 * Animate camera to view a specific label region
 * @param {Array} center - Target focal point [x, y, z]
 * @param {Array} normal - Surface normal direction [x, y, z]
 * @param {number} distance - Camera distance from center
 */
export function positionCameraForLabel(center, normal, distance = 800) {
  const renderer = getRenderer();
  if (!renderer) return;
  
  const camera = renderer.getActiveCamera();
  
  // Target camera position along the normal direction from the center
  const targetPos = [
    center[0] + normal[0] * distance,
    center[1] + normal[1] * distance,
    center[2] + normal[2] * distance
  ];
  
  // Get current camera position and focal point
  const startPos = camera.getPosition();
  const startFocal = camera.getFocalPoint();
  
  // Animation parameters
  const duration = 800; // milliseconds
  const startTime = Date.now();
  
  function animate() {
    const elapsed = Date.now() - startTime;
    const t = Math.min(elapsed / duration, 1.0);
    
    // Ease-in-out function for smooth animation
    const eased = t < 0.5 
      ? 4 * t * t * t 
      : 1 - Math.pow(-2 * t + 2, 3) / 2;
    
    // Interpolate position
    const currentPos = [
      startPos[0] + (targetPos[0] - startPos[0]) * eased,
      startPos[1] + (targetPos[1] - startPos[1]) * eased,
      startPos[2] + (targetPos[2] - startPos[2]) * eased
    ];
    
    // Interpolate focal point
    const currentFocal = [
      startFocal[0] + (center[0] - startFocal[0]) * eased,
      startFocal[1] + (center[1] - startFocal[1]) * eased,
      startFocal[2] + (center[2] - startFocal[2]) * eased
    ];
    
    camera.setPosition(...currentPos);
    camera.setFocalPoint(...currentFocal);
    camera.setViewUp(0, 1, 0); // Keep Y as up direction
    
    renderer.resetCameraClippingRange();
    
    const renderWindow = getRenderWindow();
    if (renderWindow) {
      renderWindow.render();
    }
    
    // Continue animation if not finished
    if (t < 1.0) {
      requestAnimationFrame(animate);
    }
  }
  
  animate();
}

/**
 * Reset camera to view entire scene
 */
export function resetCamera() {
  const renderer = getRenderer();
  const renderWindow = getRenderWindow();
  
  if (renderer) {
    renderer.resetCamera();
  }
  
  if (renderWindow) {
    renderWindow.render();
  }
}
