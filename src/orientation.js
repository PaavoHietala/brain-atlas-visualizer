// orientation.js
// Orientation widget setup

import vtkAxesActor from '@kitware/vtk.js/Rendering/Core/AxesActor';
import vtkOrientationMarkerWidget from '@kitware/vtk.js/Interaction/Widgets/OrientationMarkerWidget';

/**
 * Create and configure orientation widget in bottom-left corner
 * @param {vtkRenderWindow} renderWindow - VTK render window
 * @returns {vtkOrientationMarkerWidget} Configured orientation widget
 */
export function createOrientationWidget(renderWindow) {
  const axes = vtkAxesActor.newInstance();
  
  const orientationWidget = vtkOrientationMarkerWidget.newInstance({
    actor: axes,
    interactor: renderWindow.getInteractor(),
  });
  
  orientationWidget.setEnabled(true);
  orientationWidget.setViewportCorner(
    vtkOrientationMarkerWidget.Corners.BOTTOM_LEFT
  );
  orientationWidget.setViewportSize(0.15);
  orientationWidget.setMinPixelSize(100);
  orientationWidget.setMaxPixelSize(300);
  
  return orientationWidget;
}
