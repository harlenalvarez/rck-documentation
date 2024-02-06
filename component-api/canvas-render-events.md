---
layout: doc
---

# Rendering Events

## requestRedraw
`requestRedraw(layer?: keyof typeof canvasLayer)`
### Parameters
 * `layer`: (Optional) Specifies the canvas layer to target. Acceptable values are 'main', 'top', or 'internal', with 'main' being the default if no layer is specified.

### Effect
`requestRedraw` is used to queue a redraw of the specified canvas layer. This is crucial for ensuring that any updates to the canvas content or transformations are visually reflected on the canvas. RCK internally calls `requestRedraw` during user interactions that modify the canvas, such as zooming or panning, to ensure that these changes are rendered accurately.

 ### Example usage
```ts
// request redraw after a change to the main layer
const updateCanvasContent = () => {
  requestRedraw()
}

// request redraw after a user position change to the top layer
const handleCollaboratorCursorMove = () => {
  requestRedraw('top')
}
```

## useRedrawEvent
`useRedrawEvent(cb: () => Promise<unknown> | unknown, deps: React.DependencyList)`

### Parameters
 * `cb` - Callback that well perform the rendering
 * `deps` - hook dependency array to reload on changes

### Effect
When request redraw is triggered any component with this hook will be triggered calling the CB.

### Example usage
```ts
import { getCanvas2DContext, clearAll, useRedrawEvent } from '@practicaljs/react-canvas-kit';
const myPaths:Path2D[] = []
const redraw = () => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;

  // clear the canvas before redrawing
  clearAll(ctx);

  // always redraw on animation frame
  requestAnimationFrame(() => {
    myPaths.forEach((path) => {
      ctx.beginPath();
      ctx.fill(path); // Assuming the desire is to fill the paths. Adjust as needed.
      ctx.stroke(path);
    });
  });
}

const CanvasManger = () => {
  useRedrawEvent(redraw, []);
}
```
> To listen to redraw events on the top layer use `useTopRedrawEvent`