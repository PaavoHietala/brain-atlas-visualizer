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
    getCurrentSelectedLabel,
    setAtlasesConfig,
    getAtlasesConfig,
    setCurrentAtlas,
    getCurrentAtlas,
    getCurrentAtlasConfig
} from './state.js';
import { 
  loadHemisphere, 
  loadLabels, 
  loadLabelNames, 
  loadAtlasesConfig,
  loadAnnotationLabels
} from './loader.js';
import { createOrientationWidget } from './orientation.js';

// Detect base path for GitHub Pages vs local development
const getBasePath = () => {
  const path = window.location.pathname;
  // If we're on GitHub Pages (path starts with /repo-name/), extract the base
  const match = path.match(/^\/([^\/]+)\//);
  if (match && match[1] !== '' && !path.startsWith('/index.html')) {
    return `/${match[1]}`;
  }
  return '';
};

const BASE_PATH = getBasePath();
console.log('Base path:', BASE_PATH || '(root)');
import { resetCamera } from './camera.js';
import { 
  populateLabelList, 
  initializeHelpModal, 
  initializeNameToggle,
  initializeGeometrySelector,
  initializeAtlasSelector,
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
  
  // Map geometry names to FreeSurfer file names
  const geometryFileMap = {
    'inflated': 'inflated',
    'original': 'orig',
    'pial': 'pial',
    'white': 'white'
  };
  
  const fsGeometry = geometryFileMap[geometry] || geometry;
  
  // Load both hemispheres with FreeSurfer binary files
  const lhConfig = getHemisphereConfig('lh');
  await loadHemisphere(
    `${BASE_PATH}/data/fsaverage/surf/lh.${fsGeometry}`,
    `${BASE_PATH}/data/fsaverage/surf/lh.curv`,
    'lh', 
    lhConfig.offsetX,
    lhConfig.offsetZ,
    lhConfig.rotateZ, 
    renderer
  );
  
  const rhConfig = getHemisphereConfig('rh');
  await loadHemisphere(
    `${BASE_PATH}/data/fsaverage/surf/rh.${fsGeometry}`,
    `${BASE_PATH}/data/fsaverage/surf/rh.curv`,
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
 * Handle atlas change
 * @param {string} newAtlasId - New atlas ID
 */
async function handleAtlasChange(newAtlasId) {
  try {
    showLoading();
    const loadingEl = document.querySelector('.loading');
    if (loadingEl) {
      loadingEl.textContent = 'Loading new atlas...';
    }
    
    // Update current atlas
    setCurrentAtlas(newAtlasId);
    const atlasConfig = getCurrentAtlasConfig();
    
    if (!atlasConfig) {
      throw new Error(`Atlas ${newAtlasId} not found`);
    }
    
    console.log('Loading atlas:', atlasConfig.name);
    
    // Load annotation files for this atlas
    const labelsData = await loadAnnotationLabels(
      `${BASE_PATH}/data/fsaverage/label/${atlasConfig.files.lh}`,
      `${BASE_PATH}/data/fsaverage/label/${atlasConfig.files.rh}`
    );
    
    setLabelsData(labelsData);
    console.log('Labels loaded:', Object.keys(labelsData).length);
    
    // Load lookup file if available
    if (atlasConfig.lookup) {
      const labelNamesData = await loadLabelNames(`${BASE_PATH}/data/lookups/${atlasConfig.lookup}`);
      setLabelNamesData(labelNamesData);
      if (labelNamesData) {
        console.log('Label names loaded for', atlasConfig.name);
      }
    } else {
      setLabelNamesData(null);
    }
    
    // Refresh label list
    populateLabelList(labelsData);
    
    // Reset any selected label and coloring
    resetToDefaultColoring();
    
    hideLoading();
    
  } catch (error) {
    console.error('Error loading atlas:', error);
    showError(`Error loading atlas. Please try again.`);
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

    // Load atlases configuration
    console.log('Loading atlases configuration...');
    const atlasesConfig = await loadAtlasesConfig(`${BASE_PATH}/data/atlases.json`);
    setAtlasesConfig(atlasesConfig);
    
    // Find and set default atlas
    const defaultAtlas = atlasesConfig.atlases.find(a => a.default) || atlasesConfig.atlases[0];
    setCurrentAtlas(defaultAtlas.id);
    console.log('Default atlas:', defaultAtlas.name);

    // Load labels data from annotation files
    console.log('Loading labels from annotation files...');
    const labelsData = await loadAnnotationLabels(
      `${BASE_PATH}/data/fsaverage/label/${defaultAtlas.files.lh}`,
      `${BASE_PATH}/data/fsaverage/label/${defaultAtlas.files.rh}`
    );
    setLabelsData(labelsData);
    console.log('Labels loaded:', Object.keys(labelsData).length);
    
    // Load label names for plain English conversion if available
    if (defaultAtlas.lookup) {
      const labelNamesData = await loadLabelNames(`${BASE_PATH}/data/lookups/${defaultAtlas.lookup}`);
      setLabelNamesData(labelNamesData);
      if (labelNamesData) {
        console.log('Label names loaded for', defaultAtlas.name);
      }
    }
    
    // Populate label list in sidebar
    populateLabelList(labelsData);
    
    // Initialize UI components
    initializeHelpModal();
    initializeNameToggle();
    initializeGeometrySelector(handleGeometryChange);
    initializeAtlasSelector(atlasesConfig, handleAtlasChange);
    
    // Load initial geometry (pial by default)
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
