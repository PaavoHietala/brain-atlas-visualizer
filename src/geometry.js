// geometry.js
// Mesh geometry and polydata creation utilities

import vtkPolyData from '@kitware/vtk.js/Common/DataModel/PolyData';
import vtkPoints from '@kitware/vtk.js/Common/Core/Points';
import vtkCellArray from '@kitware/vtk.js/Common/Core/CellArray';
import vtkDataArray from '@kitware/vtk.js/Common/Core/DataArray';

/**
 * Create VTK polydata from mesh data with optional transformations
 * @param {Object} meshData - Object containing vertices, triangles, and curvature
 * @param {number} offsetX - X-axis offset
 * @param {number} offsetZ - Z-axis offset
 * @param {number} rotateZ - Rotation angle around Z-axis in degrees
 * @returns {vtkPolyData} VTK polydata object
 */
export function createPolyDataFromMesh(meshData, offsetX = 0, offsetZ = 0, rotateZ = 0) {
  const { vertices, triangles, curvature } = meshData;
  
  // Create VTK points with optional offsets and Z rotation
  const points = vtkPoints.newInstance();
  const verticesFlat = vertices.flat();
  const offsetVertices = new Float32Array(verticesFlat.length);
  
  // Rotation angle in radians (around Z-axis, the blue axis)
  const angleRad = (rotateZ * Math.PI) / 180;
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  
  // Apply rotation around Z-axis first, then offset
  for (let i = 0; i < verticesFlat.length; i += 3) {
    const x = verticesFlat[i];
    const y = verticesFlat[i + 1];
    const z = verticesFlat[i + 2];
    
    // Rotate around Z axis (affects X and Y coordinates)
    const rotatedX = x * cosAngle - y * sinAngle;
    const rotatedY = x * sinAngle + y * cosAngle;
    
    // Then apply offsets
    offsetVertices[i] = rotatedX + offsetX;      // X coordinate
    offsetVertices[i + 1] = rotatedY;            // Y coordinate
    offsetVertices[i + 2] = z + offsetZ;         // Z coordinate
  }
  
  points.setData(offsetVertices);

  // Build cell array data: [numPoints, pointId1, pointId2, pointId3, numPoints, ...]
  const cellData = [];
  for (let i = 0; i < triangles.length; i++) {
    cellData.push(3); // 3 points per triangle
    cellData.push(...triangles[i]);
  }
  
  const polys = vtkCellArray.newInstance({ values: new Uint32Array(cellData) });

  const polyData = vtkPolyData.newInstance();
  polyData.setPoints(points);
  polyData.setPolys(polys);
  
  // Add curvature as scalar data for coloring
  if (curvature) {
    const scalars = vtkDataArray.newInstance({
      name: 'Curvature',
      values: Float32Array.from(curvature),
      numberOfComponents: 1,
    });
    polyData.getPointData().setScalars(scalars);
  }
  
  return polyData;
}

/**
 * Compute center of mass and average normal for a label region
 * @param {Object} meshData - Mesh data
 * @param {Array} vertices - Array of vertex indices in the label
 * @param {number} offsetX - X-axis offset
 * @param {number} offsetZ - Z-axis offset
 * @param {number} rotateZ - Rotation angle around Z-axis in degrees
 * @returns {Object} Object with center and normal vectors
 */
export function computeLabelCenterAndNormal(meshData, vertices, offsetX, offsetZ, rotateZ) {
  if (!vertices || vertices.length === 0) {
    return { center: [0, 0, 0], normal: [0, 0, 1] };
  }
  
  const angleRad = (rotateZ * Math.PI) / 180;
  const cosAngle = Math.cos(angleRad);
  const sinAngle = Math.sin(angleRad);
  
  let centerX = 0, centerY = 0, centerZ = 0;
  let normalX = 0, normalY = 0, normalZ = 0;
  
  // Compute center of mass with rotation applied
  vertices.forEach(idx => {
    const x = meshData.vertices[idx][0];
    const y = meshData.vertices[idx][1];
    const z = meshData.vertices[idx][2];
    
    // Apply same rotation as in createPolyDataFromMesh
    const rotatedX = x * cosAngle - y * sinAngle;
    const rotatedY = x * sinAngle + y * cosAngle;
    
    const finalX = rotatedX + offsetX;
    const finalY = rotatedY;
    const finalZ = z + offsetZ;
    
    centerX += finalX;
    centerY += finalY;
    centerZ += finalZ;
    
    // Use vertex position as approximation of normal (pointing outward from origin)
    normalX += rotatedX;
    normalY += rotatedY;
    normalZ += z;
  });
  
  const count = vertices.length;
  centerX /= count;
  centerY /= count;
  centerZ /= count;
  
  // Normalize the average normal
  const normalLength = Math.sqrt(normalX * normalX + normalY * normalY + normalZ * normalZ);
  if (normalLength > 0) {
    normalX /= normalLength;
    normalY /= normalLength;
    normalZ /= normalLength;
  }
  
  return {
    center: [centerX, centerY, centerZ],
    normal: [normalX, normalY, normalZ]
  };
}
