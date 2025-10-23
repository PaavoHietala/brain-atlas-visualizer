// freesurfer.js
// FreeSurfer binary format parsers for surfaces and curvature files

/**
 * Parse FreeSurfer surface file (binary format)
 * FreeSurfer surface format:
 * - 3 bytes: magic number (0xFF, 0xFF, 0xFE for triangle files)
 * - String: comment/creation info (ends with \n\n)
 * - 4 bytes: number of vertices (int32)
 * - 4 bytes: number of faces (int32)
 * - Vertices: numVertices * 3 * 4 bytes (float32 for x, y, z)
 * - Faces: numFaces * 3 * 4 bytes (int32 for v0, v1, v2 indices)
 * 
 * @param {ArrayBuffer} buffer - Binary data from FreeSurfer surface file
 * @returns {Object} Object with vertices and triangles arrays
 */
export function parseFreeSurferSurface(buffer) {
  const dataView = new DataView(buffer);
  let offset = 0;
  
  // Read magic number (3 bytes)
  const magic1 = dataView.getUint8(offset++);
  const magic2 = dataView.getUint8(offset++);
  const magic3 = dataView.getUint8(offset++);
  
  // Check for triangle file format
  if (magic1 !== 0xFF || magic2 !== 0xFF || magic3 !== 0xFE) {
    throw new Error(`Invalid FreeSurfer surface file magic number: ${magic1}, ${magic2}, ${magic3}`);
  }
  
  // Read comment string (null-terminated, ends with \n\n)
  let comment = '';
  while (offset < buffer.byteLength) {
    const char = dataView.getUint8(offset++);
    if (char === 0x0A) { // '\n'
      const nextChar = dataView.getUint8(offset);
      if (nextChar === 0x0A) {
        offset++; // Skip second newline
        break;
      }
    }
    comment += String.fromCharCode(char);
  }
  
  // Read number of vertices and faces (big-endian int32)
  const numVertices = dataView.getInt32(offset, false); // false = big-endian
  offset += 4;
  const numFaces = dataView.getInt32(offset, false);
  offset += 4;
  
  console.log(`FreeSurfer surface: ${numVertices} vertices, ${numFaces} faces`);
  
  // Read vertices (big-endian float32, x, y, z for each vertex)
  const vertices = [];
  for (let i = 0; i < numVertices; i++) {
    const x = dataView.getFloat32(offset, false);
    offset += 4;
    const y = dataView.getFloat32(offset, false);
    offset += 4;
    const z = dataView.getFloat32(offset, false);
    offset += 4;
    vertices.push([x, y, z]);
  }
  
  // Read faces (big-endian int32, 3 vertex indices per face)
  const triangles = [];
  for (let i = 0; i < numFaces; i++) {
    const v0 = dataView.getInt32(offset, false);
    offset += 4;
    const v1 = dataView.getInt32(offset, false);
    offset += 4;
    const v2 = dataView.getInt32(offset, false);
    offset += 4;
    triangles.push([v0, v1, v2]);
  }
  
  return {
    vertices,
    triangles,
    numVertices,
    numFaces,
    comment
  };
}

/**
 * Parse FreeSurfer curvature file (binary format)
 * FreeSurfer curvature format:
 * - 3 bytes: magic number (0xFF, 0xFF, 0xFF for new format)
 * - 4 bytes: number of vertices (int32)
 * - 4 bytes: number of faces (int32)
 * - 4 bytes: values per vertex (int32, usually 1)
 * - Curvature values: numVertices * 4 bytes (float32)
 * 
 * @param {ArrayBuffer} buffer - Binary data from FreeSurfer curvature file
 * @returns {Float32Array} Array of curvature values
 */
export function parseFreeSurferCurvature(buffer) {
  const dataView = new DataView(buffer);
  let offset = 0;
  
  // Read magic number (3 bytes)
  const magic1 = dataView.getUint8(offset++);
  const magic2 = dataView.getUint8(offset++);
  const magic3 = dataView.getUint8(offset++);
  
  // Check for new format (0xFF, 0xFF, 0xFF)
  if (magic1 !== 0xFF || magic2 !== 0xFF || magic3 !== 0xFF) {
    throw new Error(`Invalid FreeSurfer curvature file magic number: ${magic1}, ${magic2}, ${magic3}`);
  }
  
  // Read number of vertices (big-endian int32)
  const numVertices = dataView.getInt32(offset, false);
  offset += 4;
  
  // Read number of faces (big-endian int32) - not used for curvature
  const numFaces = dataView.getInt32(offset, false);
  offset += 4;
  
  // Read values per vertex (big-endian int32) - usually 1
  const valuesPerVertex = dataView.getInt32(offset, false);
  offset += 4;
  
  console.log(`FreeSurfer curvature: ${numVertices} vertices, ${valuesPerVertex} values per vertex`);
  
  // Read curvature values (big-endian float32)
  const curvature = new Float32Array(numVertices);
  for (let i = 0; i < numVertices; i++) {
    curvature[i] = dataView.getFloat32(offset, false);
    offset += 4;
  }
  
  return curvature;
}

/**
 * Parse FreeSurfer annotation file (binary format)
 * FreeSurfer annotation format contains label indices and color table
 * 
 * @param {ArrayBuffer} buffer - Binary data from FreeSurfer annotation file
 * @returns {Object} Object with vertex labels and color table
 */
export function parseFreeSurferAnnotation(buffer) {
  const dataView = new DataView(buffer);
  let offset = 0;
  
  // Read number of vertices (big-endian int32)
  const numVertices = dataView.getInt32(offset, false);
  offset += 4;
  
  console.log(`FreeSurfer annotation: ${numVertices} vertices`);
  
  // Read vertex indices and labels
  const vertexIndices = new Int32Array(numVertices);
  const vertexLabels = new Int32Array(numVertices);
  
  for (let i = 0; i < numVertices; i++) {
    vertexIndices[i] = dataView.getInt32(offset, false);
    offset += 4;
    vertexLabels[i] = dataView.getInt32(offset, false);
    offset += 4;
  }
  
  // Check if color table exists
  const hasColorTable = dataView.getInt32(offset, false);
  offset += 4;
  
  let colorTable = null;
  
  if (hasColorTable === 1) {
    // Read color table
    // Number of entries
    const numEntries = dataView.getInt32(offset, false);
    offset += 4;
    
    // Original filename length
    const origFileNameLength = dataView.getInt32(offset, false);
    offset += 4;
    
    // Original filename
    let origFileName = '';
    for (let i = 0; i < origFileNameLength; i++) {
      origFileName += String.fromCharCode(dataView.getUint8(offset++));
    }
    
    // Number of entries in color table
    const numTableEntries = dataView.getInt32(offset, false);
    offset += 4;
    
    colorTable = {
      numEntries: numTableEntries,
      origFileName,
      entries: []
    };
    
    // Read each color table entry
    for (let i = 0; i < numTableEntries; i++) {
      // Structure index
      const structure = dataView.getInt32(offset, false);
      offset += 4;
      
      // Name length
      const nameLength = dataView.getInt32(offset, false);
      offset += 4;
      
      // Name string
      let name = '';
      for (let j = 0; j < nameLength; j++) {
        name += String.fromCharCode(dataView.getUint8(offset++));
      }
      
      // RGBA values
      const r = dataView.getInt32(offset, false);
      offset += 4;
      const g = dataView.getInt32(offset, false);
      offset += 4;
      const b = dataView.getInt32(offset, false);
      offset += 4;
      const a = dataView.getInt32(offset, false);
      offset += 4;
      
      // Compute label value (R + G*256 + B*65536)
      const label = r + g * 256 + b * 65536;
      
      colorTable.entries.push({
        structure,
        name,
        r,
        g,
        b,
        a,
        label
      });
    }
  }
  
  return {
    numVertices,
    vertexIndices,
    vertexLabels,
    colorTable
  };
}

/**
 * Load FreeSurfer surface file from URL
 * @param {string} url - URL to FreeSurfer surface file
 * @returns {Promise<Object>} Parsed surface data
 */
export async function loadFreeSurferSurface(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load surface: ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return parseFreeSurferSurface(buffer);
}

/**
 * Load FreeSurfer curvature file from URL
 * @param {string} url - URL to FreeSurfer curvature file
 * @returns {Promise<Float32Array>} Parsed curvature data
 */
export async function loadFreeSurferCurvature(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load curvature: ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return parseFreeSurferCurvature(buffer);
}

/**
 * Load FreeSurfer annotation file from URL
 * @param {string} url - URL to FreeSurfer annotation file
 * @returns {Promise<Object>} Parsed annotation data
 */
export async function loadFreeSurferAnnotation(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to load annotation: ${url}`);
  }
  const buffer = await response.arrayBuffer();
  return parseFreeSurferAnnotation(buffer);
}
