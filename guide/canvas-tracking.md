---
layout: doc
prev:
 text: 'Rendering'
 link: '/guide/canvas-rendering'
next: false
---

# Tracking
For certain features of RCK to work effectively, such as scaling around content and integrating toolbars, it is essential to track every element that is rendered. This process is straightforward as long as each shape is assigned a unique identifier and the center point of the component is accurately tracked.

## Prepare to track shapes
In our previous guide, we directly created Path2D objects and stored them in the CanvasState. However, to efficiently check for and track shapes, we recommend creating an object that contains a unique identifier. With this approach in mind, let's introduce the `RectanglePath2D` object that extends `CanvasPath2D`. `CanvasPath2D` is a class provided by RCK designed to set up some common properties needed for tracking. While using this class is not mandatory, it's important to remember that every shape must have a unique identifier and a central point designated for tracking purposes. This central point should ideally be the center of your shape.

```ts [RectanglePath2D]
import { Point } from '@practicaljs/canvas-kit';
import { CanvasPath2D } from '@practicaljs/react-canvas-kit';

export class RectanglePath2D extends CanvasPath2D {
  topLeft: Point
  width: number
  height: number
  square: Path2D
  constructor(key: string, topLeft: Point, width: number, height: number) {
    super ({
      key,
      trackingPoint: {
        x: topLeft.x - width / 2,
        y: topLeft.y - height / 2
      }
    });
    this.topLeft = topLeft;
    this.width = width;
    this.height = height;
    this.square = new Path2D();
    this.square.rect(this.topLeft.x, this.topLeft.y, this.width, this.height);
  }
}
```

## Creating shapes and tracking
By introducing the `RectanglePath2D` class, we've encapsulated both the tracking and drawing functionalities into a single object. This class extends `CanvasPath2D`, incorporating a unique identifier and a trackingPoint that signifies the center of the shape. It's important to note that the trackingPoint should accurately represent the shape's central point for effective tracking. Therefore, the calculation should ensure it reflects the center, based on the shape's dimensions and top-left position.

We've also transitioned from storing our paths in an array to using a Map in `CanvasState`. This change significantly enhances our ability to quickly access and manage shapes by their unique identifiers, offering a more efficient and scalable solution for tracking numerous elements.

```ts [Canvas.state.ts]
class CanvasState {
  paths: Map<string, RectanglePath2D> = new Map();
}

// export the instance
export const canvasState = new CanvasState();
```

In our `CanvasManager`, the drawing logic has been updated to instantiate and utilize the `RectanglePath2D` object. This approach not only streamlines the addition of new shapes to our tracking system but also maintains the use of Path2D for rendering.

```tsx [CanvasManager.tsx]
import { CanvasController } from '@/components';
import { ReactEventHandler, useReactEventMiddleware, getCanvas2DContext, clearAll, useRedrawEvent } from '@practicaljs/react-canvas-kit';
import { pointerUpMiddleware } from './CanvasManager.middlewares';
import { CanvasGridContainer } from './CanvasManager.styled';
import { canvasState } from './Canvas.state.ts'; 
import { getCanvasPoint } from '@practicaljs/canvas-kit';

const drawOnClick: ReactEventHandler<React.PointerEvent> = (_: React.PointerEvent) => { 
    const ctx = getCanvas2DContext();
    if (!ctx) return false;

    const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx);
    const path = new Path2D(); // [!code --]
    path.rect(x, y, 100, 100); // [!code --]
    canvasState.paths.push(path); // [!code --]
    const rec = new RectanglePath2D(crypto.randomUUID(), { x, y }, 100, 100); // [!code ++];
    canvasState.paths.set(rec.key, rec); // [!code ++];
    ctx.beginPath();
    ctx.fillStyle = 'white'; 
    ctx.fill(path); // [!code --]
    ctx.stroke(path); // [!code --]
    ctx.fill(rec.square); // [!code ++]
    ctx.stroke(rec.square); // [!code ++]
    return false;
}

const redraw = () => { 
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  // always clear the canvas
  clearAll(ctx);
  requestAnimationFrame(() => {
    canvasState.paths.forEach(p => {
      ctx.beginPath();
      ctx.fillStyle = 'white';
      ctx.fill(p.square); // [!code ++]
      ctx.stroke(p.square); // [!code ++]
    })
  })
})

export const CanvasManager = () => {
  useRedrawEvent(redraw, []);
  useReactEventMiddleware<React.PointerEvent>(pointerUpMiddleware, drawOnClick);
  return (
    <CanvasGridContainer onPointerUp={pointerUpMiddleware.handleEvent}>
      <CanvasController />
    </CanvasGridContainer>
  )
}
```
> Note: While RectanglePath2D enhances shape tracking, we still utilize Path2D for rendering tasks like filling and stroking. This ensures efficient shape management while leveraging Path2D's native drawing and interaction features.

## Cheking hover
Detecting hover interactions over canvas elements is a common requirement. However, hover checks should be context-sensitive, avoiding checks during certain actions like dragging a shape or when a drawing tool is active.

To facilitate this, we introduce an onPointerMove middleware alongside a checkHover method. This setup allows us to determine if the cursor is hovering over a shape. Additionally, to check hover states over strokes specifically, you can use the isPointInStroke method.

First, we update CanvasState to track the currently hovered element;

```ts [Canvas.state.ts]
class CanvasState {
  paths: Map<string, RectanglePath2D> = new Map();
  hoveredElement: string | null = null; // [!code ++]
}

// export the instance
export const canvasState = new CanvasState();
```
Next, we implement the `checkHover` function to detect hover states, taking care to skip checks during drag operations or when specific tools are active:
::: code-group
```ts [checkHover.onPointerMove.ts]
import { keyboardEventContext, getCanvas2DContext } from '@practicaljs/react-canvas-kit';
//https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
enum PointerEventButtons {
  none = 0,
  primary = 1 << 0, // left click
  secondary = 1 << 1, // right click
  auxiliary = 1 << 2, // mouse wheel
  fourth = 1 << 3, // browser back
  fifth = 1 << 4, // browser forward
}
export const checkHover = (e: React.PointerEvent) => {
  // first lets check that we are not dragging the canvas, the built in interactions are on aux click or space + primary
  // This uses bitwise operations here ( it is not a bug )
  if (e.buttons & PointerEventButtons.auxiliary || keyboardEventContext.Space && e.buttons & PointerEventButtons.primary) {
    return true;
  }

  const ctx = getCanvas2DContext();
  if (!ctx) return false;

    // when checking for point / stroke in path make sure to set the checkPath argument to true
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx, true);

  // lets also check for mouse leave
  if(canvasState.hoveredElement) {
    const element = canvasState.paths.get(canvasState.hoveredElement)!;
    // if the mouse is still on this element return
    if(ctx.isPointInPath(element.square, x, y)) return false;
    canvasState.hoveredElement = null;
    // do not exit here as the previous shape could be on top of another
  }

  for (const path of canvasState.paths.values()) {
    if (ctx.isPointInPath(path.outlined, x, y)) {
      canvasState.hoveredElement = path.key;
      path.onHoverEnter();
      break;
    }
  }
}
```
```ts [CanvasManager.middleware.ts]
import { checkHover } from '../CanvasEvents';

export const pointerMoveMiddleware = new ReactEventMiddleware<React.PointerEvent>(new Set([checkHover]));
export const pointerUpMiddleware = new ReactEventMiddleware<React.PointerEvent>(new Set());
```

```tsx [CanvasManager.tsx]
export const CanvasManager = () => {
  useRedrawEvent(redraw, []);
  useReactEventMiddleware<React.PointerEvent>(pointerUpMiddleware, drawOnClick);
  return (
    <CanvasGridContainer 
      onPointerMove={pointerMoveMiddleware.handleEvent}
      onPointerUp={pointerUpMiddleware.handleEvent}>
      <CanvasController />
    </CanvasGridContainer>
  )
}
```
:::

Finally in your `CanvasManager` add the pointerMoveMiddleware event.
