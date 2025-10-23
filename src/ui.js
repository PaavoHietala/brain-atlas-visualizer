// ui.js
// User interface management and event handlers

import { 
  getLabelsData, 
  getLabelNamesData, 
  isPlainEnglishNamesEnabled,
  togglePlainEnglishNames,
  getCurrentSelectedLabel
} from './state.js';
import { handleLabelClick } from './labels.js';

/**
 * Get display name for a label
 * @param {string} labelName - Technical FreeSurfer label name
 * @returns {string} Display name (plain English or formatted FreeSurfer)
 */
function getDisplayName(labelName) {
  const labelNamesData = getLabelNamesData();
  
  if (isPlainEnglishNamesEnabled() && labelNamesData) {
    // Strip hemisphere suffix (-lh or -rh) before looking up
    const baseLabel = labelName.replace(/-lh$|-rh$/i, '');
    if (labelNamesData[baseLabel]) {
      return labelNamesData[baseLabel];
    }
  }

  return labelName;
}

/**
 * Populate label list in sidebar
 * @param {Object} labels - Labels data object
 */
export function populateLabelList(labels) {
  const lhList = document.getElementById('labels-lh');
  const rhList = document.getElementById('labels-rh');
  
  // Clear existing lists
  lhList.innerHTML = '';
  rhList.innerHTML = '';
  
  // Sort labels by name
  const sortedLabels = Object.keys(labels).sort();
  
  sortedLabels.forEach(labelName => {
    const label = labels[labelName];
    const li = document.createElement('li');
    
    li.textContent = getDisplayName(labelName);
    li.dataset.labelName = labelName;
    
    li.addEventListener('click', () => {
      handleLabelClick(labelName);
    });
    
    // Add to appropriate hemisphere list
    if (label.hemi === 'lh') {
      lhList.appendChild(li);
    } else if (label.hemi === 'rh') {
      rhList.appendChild(li);
    }
  });
}

/**
 * Initialize help modal
 */
export function initializeHelpModal() {
  const helpBtn = document.getElementById('help-btn');
  const modal = document.getElementById('instructions-modal');
  const closeBtn = modal.querySelector('.close');
  
  helpBtn.addEventListener('click', () => {
    modal.classList.add('show');
  });
  
  closeBtn.addEventListener('click', () => {
    modal.classList.remove('show');
  });
  
  // Close modal when clicking outside
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      modal.classList.remove('show');
    }
  });
}

/**
 * Initialize name toggle button
 */
export function initializeNameToggle() {
  const toggleNamesBtn = document.getElementById('toggle-names-btn');
  
  toggleNamesBtn.addEventListener('click', () => {
    const isPlainEnglish = togglePlainEnglishNames();
    toggleNamesBtn.classList.toggle('active', isPlainEnglish);
    
    // Update the button title
    if (isPlainEnglish) {
      toggleNamesBtn.title = 'Switch to FreeSurfer names';
    } else {
      toggleNamesBtn.title = 'Switch to plain English names';
    }
    
    // Repopulate the label list with new names
    const labelsData = getLabelsData();
    populateLabelList(labelsData);
    
    // If a label was selected, restore the selection
    const currentLabel = getCurrentSelectedLabel();
    if (currentLabel) {
      const labelElements = document.querySelectorAll('.label-list li');
      labelElements.forEach(el => {
        if (el.dataset.labelName === currentLabel) {
          el.classList.add('active');
        }
      });
    }
  });
}

/**
 * Show loading indicator
 */
export function showLoading() {
  const loadingEl = document.querySelector('.loading');
  if (loadingEl) {
    loadingEl.style.display = 'block';
    loadingEl.textContent = 'Loading brain model...';
  }
}

/**
 * Hide loading indicator
 */
export function hideLoading() {
  const loadingEl = document.querySelector('.loading');
  if (loadingEl) {
    loadingEl.remove();
  }
}

/**
 * Show error message
 * @param {string} message - Error message to display
 */
export function showError(message) {
  const loadingEl = document.querySelector('.loading');
  if (loadingEl) {
    loadingEl.textContent = message;
    loadingEl.style.color = '#ff6b6b';
  }
}

/**
 * Initialize geometry selector dropdown
 * @param {Function} onGeometryChange - Callback function when geometry changes
 */
export function initializeGeometrySelector(onGeometryChange) {
  const geometrySelect = document.getElementById('geometry-select');
  
  if (!geometrySelect) {
    console.warn('Geometry selector not found');
    return;
  }
  
  geometrySelect.addEventListener('change', (e) => {
    const newGeometry = e.target.value;
    console.log('Geometry changed to:', newGeometry);
    
    if (onGeometryChange) {
      onGeometryChange(newGeometry);
    }
  });
}
