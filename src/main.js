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
    getHemisphereConfig,
    setCurrentGeometry,
    getCurrentGeometry,
    getRenderer,
    getCurrentSelectedLabel
} from './state.js';
import { loadHemisphere, loadLabels, loadLabelNames } from './loader.js';
import { createOrientationWidget } from './orientation.js';
import { resetCamera } from './camera.js';
import { 
  populateLabelList, 
  initializeHelpModal, 
  initializeNameToggle,
  initializeGeometrySelector,
  hideLoading,
  showError,
  showLoading
} from './ui.js';
import { resetToDefaultColoring, highlightLabel } from './labels.js';

/**
 * Load both hemispheres with the specified geometry
 * @param {string} geometry - Geometry type (inflated, original, pial, white)
 */
async function loadBrainGeometry(geometry) {
  const renderer = getRenderer();
  if (!renderer) {
    console.error('Renderer not initialized');
    return;
  }
  
  console.log(`Loading ${geometry} surfaces...`);
  
  // Load both hemispheres
  const lhConfig = getHemisphereConfig('lh');
  await loadHemisphere(
    `data/json/lh_${geometry}.json`, 
    'lh', 
    lhConfig.offsetX,
    lhConfig.offsetZ,
    lhConfig.rotateZ, 
    renderer
  );
  
  const rhConfig = getHemisphereConfig('rh');
  await loadHemisphere(
    `data/json/rh_${geometry}.json`, 
    'rh', 
    rhConfig.offsetX,
    rhConfig.offsetZ,
    rhConfig.rotateZ,
    renderer
  );
  
  console.log(`${geometry} surfaces loaded successfully`);
}

/**
 * Handle geometry change
 * @param {string} newGeometry - New geometry type
 */
async function handleGeometryChange(newGeometry) {
  try {
    showLoading();
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) {
      loadingEl.textContent = `Loading ${newGeometry} geometry...`;
    }
    
    // Remember currently selected label (if any)
    const selectedLabel = getCurrentSelectedLabel();
    
    // Update state
    setCurrentGeometry(newGeometry);
    
    // Remove old actors from renderer
    const renderer = getRenderer();
    const lhConfig = getHemisphereConfig('lh');
    const rhConfig = getHemisphereConfig('rh');
    
    if (lhConfig.actor) {
      renderer.removeActor(lhConfig.actor);
    }
    if (rhConfig.actor) {
      renderer.removeActor(rhConfig.actor);
    }
    
    // Load new geometry
    await loadBrainGeometry(newGeometry);
    
    // Re-apply label highlighting if there was a selected label
    if (selectedLabel) {
      highlightLabel(selectedLabel);
      // Keep the label marked as active in the UI
      document.querySelectorAll('.label-list li').forEach(el => {
        if (el.dataset.labelName === selectedLabel) {
          el.classList.add('active');
        }
      });
    } else {
      // Reset to default coloring (no label was selected)
      resetToDefaultColoring();
      // Reset camera only if no label was selected
      resetCamera();
    }
    
    hideLoading();
    
  } catch (error) {
    console.error('Error loading geometry:', error);
    showError(`Error loading ${newGeometry} geometry. File may not exist.`);
  }
}

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
    initializeGeometrySelector(handleGeometryChange);
    
    // Load initial geometry (inflated by default)
    const initialGeometry = getCurrentGeometry();
    await loadBrainGeometry(initialGeometry);
    
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
