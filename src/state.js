// state.js
// Global application state management

export const state = {
  hemisphereData: {
    lh: { 
      meshData: null, 
      actor: null, 
      mapper: null, 
      polyData: null, 
      offsetX: -90, 
      offsetZ: 0, 
      rotateZ: 20 
    },
    rh: { 
      meshData: null, 
      actor: null, 
      mapper: null, 
      polyData: null, 
      offsetX: 90, 
      offsetZ: 0, 
      rotateZ: -20 
    }
  },
  labelsData: null,
  labelNamesData: null,
  currentSelectedLabel: null,
  renderWindow: null,
  renderer: null,
  usePlainEnglishNames: false,
  currentGeometry: 'inflated'  // Current geometry type
};

/**
 * Get hemisphere configuration
 */
export function getHemisphereConfig(hemi) {
  return state.hemisphereData[hemi];
}

/**
 * Update hemisphere data
 */
export function updateHemisphereData(hemi, data) {
  Object.assign(state.hemisphereData[hemi], data);
}

/**
 * Set renderer and render window
 */
export function setRenderer(renderer, renderWindow) {
  state.renderer = renderer;
  state.renderWindow = renderWindow;
}

/**
 * Get current renderer
 */
export function getRenderer() {
  return state.renderer;
}

/**
 * Get current render window
 */
export function getRenderWindow() {
  return state.renderWindow;
}

/**
 * Set labels data
 */
export function setLabelsData(data) {
  state.labelsData = data;
}

/**
 * Get labels data
 */
export function getLabelsData() {
  return state.labelsData;
}

/**
 * Set label names data
 */
export function setLabelNamesData(data) {
  state.labelNamesData = data;
}

/**
 * Get label names data
 */
export function getLabelNamesData() {
  return state.labelNamesData;
}

/**
 * Set currently selected label
 */
export function setCurrentSelectedLabel(labelName) {
  state.currentSelectedLabel = labelName;
}

/**
 * Get currently selected label
 */
export function getCurrentSelectedLabel() {
  return state.currentSelectedLabel;
}

/**
 * Toggle plain English names mode
 */
export function togglePlainEnglishNames() {
  state.usePlainEnglishNames = !state.usePlainEnglishNames;
  return state.usePlainEnglishNames;
}

/**
 * Get plain English names mode state
 */
export function isPlainEnglishNamesEnabled() {
  return state.usePlainEnglishNames;
}

/**
 * Set current geometry type
 */
export function setCurrentGeometry(geometry) {
  state.currentGeometry = geometry;
}

/**
 * Get current geometry type
 */
export function getCurrentGeometry() {
  return state.currentGeometry;
}
