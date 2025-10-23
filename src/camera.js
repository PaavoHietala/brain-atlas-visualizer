// camera.js
// Camera positioning and animation utilities

import { getRenderer, getRenderWindow } from './state.js';

/**
 * Animate camera to view a specific label region
 * @param {Array} center - Target focal point [x, y, z]
 * @param {Array} normal - Surface normal direction [x, y, z]
 * @param {number} distance - Camera distance from center
 * @param {Function} onComplete - Optional callback when animation completes
 */
export function positionCameraForLabel(center, normal, distance = 800, onComplete = null) {
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
    camera.setViewUp(0, 0, 1); // Set Z-axis (green) as up direction
    
    renderer.resetCameraClippingRange();
    
    const renderWindow = getRenderWindow();
    if (renderWindow) {
      renderWindow.render();
    }
    
    // Continue animation if not finished
    if (t < 1.0) {
      requestAnimationFrame(animate);
    } else if (onComplete) {
      // Call completion callback
      onComplete();
    }
  }
  
  animate();
}

/**
 * Reset camera to view entire scene with custom orientation
 */
export function resetCamera() {
  const renderer = getRenderer();
  const renderWindow = getRenderWindow();
  
  if (renderer) {
    const camera = renderer.getActiveCamera();
    
    // First, reset to default to get bounds and distance
    renderer.resetCamera();
    
    // Get the current focal point and distance
    const focalPoint = camera.getFocalPoint();
    const distance = camera.getDistance();
    
    // Apply rotations:
    // 1. Tilt 135 degrees back on X-axis (left-right axis)
    // 2. Rotate 135 degrees clockwise on Z-axis (down-up axis)
    
    // Start with camera looking along -Y axis (VTK default after reset)
    // Then apply transformations
    
    const tiltX = -45 * Math.PI / 180;   // 135 degrees back (rotation around X-axis)
    const rotZ = -150 * Math.PI / 180;   // 135 degrees clockwise (rotation around Z-axis)
    
    // Initial direction vector (looking along -Y)
    let dirX = 0;
    let dirY = -1;
    let dirZ = 0;
    
    // Apply rotation around Z-axis first (anticlockwise when looking down)
    const tempX = dirX * Math.cos(rotZ) - dirY * Math.sin(rotZ);
    const tempY = dirX * Math.sin(rotZ) + dirY * Math.cos(rotZ);
    dirX = tempX;
    dirY = tempY;
    
    // Apply rotation around X-axis (tilt back)
    const tempY2 = dirY * Math.cos(tiltX) - dirZ * Math.sin(tiltX);
    const tempZ2 = dirY * Math.sin(tiltX) + dirZ * Math.cos(tiltX);
    dirY = tempY2;
    dirZ = tempZ2;
    
    // Set camera position based on rotated direction
    const position = [
      focalPoint[0] - dirX * distance,
      focalPoint[1] - dirY * distance,
      focalPoint[2] - dirZ * distance
    ];
    
    camera.setPosition(...position);
    camera.setFocalPoint(...focalPoint);
    camera.setViewUp(0, 0, 1); // Z-axis points up
    
    renderer.resetCameraClippingRange();
  }
  
  if (renderWindow) {
    renderWindow.render();
  }
}
