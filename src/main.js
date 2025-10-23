// main.js
// Main application entry point

import vtkFullScreenRenderWindow from '@kitware/vtk.js/Rendering/Misc/FullScreenRenderWindow';

// Ensure OpenGL backend is loaded
import '@kitware/vtk.js/Rendering/Core/RenderWindow';
import '@kitware/vtk.js/Rendering/Core/Renderer';
import '@kitware/vtk.js/Rendering/OpenGL/RenderWindow';
import '@kitware/vtk.js/Rendering/OpenGL/HardwareSelector';
import '@kitware/vtk.js/Rendering/Profiles/Geometry';

import {
    setRenderer,
    setLabelsData,
    setLabelNamesData,
    getHemisphereConfig
} from './state.js';
import { loadHemisphere, loadLabels, loadLabelNames } from './loader.js';
import { createOrientationWidget } from './orientation.js';
import { resetCamera } from './camera.js';
import { 
  populateLabelList, 
  initializeHelpModal, 
  initializeNameToggle,
  hideLoading,
  showError 
} from './ui.js';

/**
 * Initialize the brain atlas visualizer application
 */
async function initializeApp() {
  try {
    // Create full screen renderer
    const fullScreenRenderer = vtkFullScreenRenderWindow.newInstance({
      rootContainer: document.getElementById('vtk-container'),
      background: [0.2, 0.3, 0.4],
    });

    const renderer = fullScreenRenderer.getRenderer();
    const renderWindow = fullScreenRenderer.getRenderWindow();
    
    // Store renderer and render window in global state
    setRenderer(renderer, renderWindow);
    
    // Add orientation widget in bottom-left corner
    createOrientationWidget(renderWindow);

    // Load labels data
    console.log('Loading labels...');
    const labelsData = await loadLabels('data/json/labels.json');
    setLabelsData(labelsData);
    console.log('Labels loaded:', Object.keys(labelsData).length);
    
    // Load label names for plain English conversion
    const labelNamesData = await loadLabelNames('data/aparc.a2009s.lookup.json');
    setLabelNamesData(labelNamesData);
    if (labelNamesData) {
      console.log('Label names loaded');
    }
    
    // Populate label list in sidebar
    populateLabelList(labelsData);
    
    // Initialize UI components
    initializeHelpModal();
    initializeNameToggle();
    
    // Load both hemispheres
    console.log('Loading left hemisphere...');
    const lhConfig = getHemisphereConfig('lh');
    await loadHemisphere(
      'data/json/lh_inflated.json', 
      'lh', 
      lhConfig.offsetX,
      lhConfig.offsetZ,
      lhConfig.rotateZ, 
      renderer
    );
    
    console.log('Loading right hemisphere...');
    const rhConfig = getHemisphereConfig('rh');
    await loadHemisphere(
      'data/json/rh_inflated.json', 
      'rh', 
      rhConfig.offsetX,
      rhConfig.offsetZ,
      rhConfig.rotateZ,
      renderer
    );
    
    console.log('Brain model loaded successfully!');
    
    // Hide loading indicator
    hideLoading();
    
    // Reset camera to view the entire brain
    resetCamera();
    
  } catch (error) {
    console.error('Error loading brain model:', error);
    showError('Error loading brain model. Check console for details.');
  }
}

// Wait until DOM is ready, then initialize the app
document.addEventListener('DOMContentLoaded', initializeApp);
