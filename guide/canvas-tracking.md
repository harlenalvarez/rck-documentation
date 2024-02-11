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

## Dragging Shapes
Dragging shapes across the canvas is a common feature in interactive applications. In RCK, when a shape is moved, it's essential to update its tracking point accordingly. This ensures that the shape's position remains synchronized with the canvas's transformation matrix.

To facilitate this, we will extend our `RectanglePath2D` class to include a changePosition method. This method will be responsible for updating the shape's position and, consequently, its tracking point. The specific point passed to this method—whether it's the top-left corner of a rectangle or the center of a circle—depends on the shape's geometry.

```ts [RectanglePath2D]
import { Point } from '@practicaljs/canvas-kit';
import { CanvasPath2D, canvasTransform } from '@practicaljs/react-canvas-kit'; // [!code ++]

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

  getTrackingPoint() { // [!code ++]
    const centerX = this.topLeft.x - this.width / 2; // [!code ++]
    const centerY = this.topLeft.y - this.height / 2; // [!code ++]
    return { // [!code ++]
      x: centerX, // [!code ++]
      y: centerY // [!code ++]
    } // [!code ++]
  } // [!code ++]

  changePosition(position: Point): void { // [!code ++]
    this.topLeft = { ...position }; // [!code ++]
    this.trackingPoint = this.getTrackingPoint(); // [!code ++]
    canvasTransform.trackShape(this.key, this.trackingPoint.x, this.trackingPoint.y); // [!code ++]
  } // [!code ++]
}
```
## Types of tracking
Earlier, we introduced how to obtain a tracking point—typically the center—during dragging, followed by invoking `canvasTransform.trackShape`. This method allows the canvas transform to track the centers of shapes. However, it does not account for tracking the entire content of a shape. To achieve comprehensive tracking, you should use `canvasTransform.trackShapeContent`.

With `canvasTransform.trackShapeContent`, you can specify the top-left and bottom-right points of your content, effectively covering the entire area. This is crucial for scenarios where understanding the full extent of your content is necessary, beyond just its central point.

Determining these specific coordinates is beyond the scope of this guide. A practical approach involves enclosing your shape within a rectangle and using the rectangle's top-left and bottom-right points as references. While this method is quick, it's essential to note that more precise techniques may be required for complex shapes.

> Note: Detailed methods for calculating these points may vary based on your application's specific needs and are subject to the tools and libraries you're using.

## Implementing Drag Functionality
To enable dragging of shapes on the canvas, we'll introduce three pointer event handlers within our middleware: onDragStart, onDrag, and onDragStop. These handlers will manage the initiation, progression, and termination of the drag operation, ensuring smooth and intuitive interaction with canvas elements.

`onDragStart`: Initializing Drag
This event triggers on a primary button press over an element. It calculates and stores the mouse offset relative to the element's position to prevent the shape from "teleporting" to the mouse position upon dragging.

`onDrag`: Dragging the Shape
Triggered by mouse movement with the primary button pressed, this event calls the changePosition method to move the shape. It ensures dragging only occurs when the primary button is down and the cursor hovers over a shape.

`onDragStop`: Ending the Drag
Though not strictly necessary, this event resets the cursor from 'grabbing' back to the default upon releasing the primary button, finalizing the drag operation.

All three events are defined in drag.pointerEvent.ts and integrated into our existing middleware for comprehensive drag support.

Here's how these events are implemented:
::: code-group
```ts [drag.pointerEvent.ts]
import { getCanvasPoint } from '@practicaljs/canvas-kit';
import { requestRedraw, getCanvas2DContext } from '@practicaljs/react-canvas-kit';
import { PointerEventButton, PointerEventButtons } from './pointerEvents';
import { canvasState } from './CanvasState';

export const onDragStart = (e: React.PointerEvent) => {
  const ctx = getCanvas2DContext()!;
  if (e.button === PointerEventButton.primary && canvasState.hoveredElement) {
    const component = canvasState.paths.get(canvasState.hoveredElement);
    if (!component) {
      return true;
    }
    const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx);
    const offsetX = x - component.topLeft.x;
    const offsetY = y - component.topLeft.y;
    systemDesignContext.dragOffset = { x: offsetX, y: offsetY };
    return false;
  }
  return true;
}

export const onDrag = withCanvasContextReturn<boolean>((ctx: CanvasRenderingContext2D, e: React.PointerEvent) => {
  if (
    !(e.buttons & PointerEventButtons.primary) ||
    !systemDesignContext.hoveredElement ||
    selectionContext.selectedType !== 'select') return true;
  e.preventDefault();
  if(document.body.style.cursor !== 'grabbing') {
        document.body.style.cursor = 'grabbing';
  }
  const [canvasX, canvasY] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx);
  const newX = canvasX - systemDesignContext.dragOffset.x;
  const newY = canvasY - systemDesignContext.dragOffset.y;
  const component = systemDesignContext.get(systemDesignContext.hoveredElement)!;
  component.changePosition({ x: newX, y: newY });
  requestRedraw();
  return false;
}, true);

export const onDragStop = (e: React.PointerEvent) => {
  if (e.button === PointerEventButton.primary && document.body.style.cursor === 'default') {
    e.preventDefault();
    document.body.style.cursor = 'default';
    systemDesignContext.dragOffset = { x: 0, y: 0 };
    return false;
  }
  return true;
}
```
```ts [pointerEvents.ts]
// These enums are the values for PointerEvent.button and PointerEvent.buttons (MouseEvent as well)
// The values are the ones documented in the MDN docs
//https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/button
export enum PointerEventButton {
  primary = 0, // left click
  auxiliary = 1,
  secondary = 2,
  fourth = 3,
  fifth = 4,
}

//https://developer.mozilla.org/en-US/docs/Web/API/MouseEvent/buttons
export enum PointerEventButtons {
  none = 0,
  primary = 1 << 0, // left click
  secondary = 1 << 1, // right click
  auxiliary = 1 << 2, // mouse wheel
  fourth = 1 << 3, // browser back
  fifth = 1 << 4, // browser forward
}
```
:::

To fully integrate our new drag functionality, we must register the event handlers with the middlewares we've established. The order in which you add these events to the middleware is crucial. Specifically, the drag event should precede the hover check during a move action, as hover checks are unnecessary while dragging a shape. Additionally, we need to ensure the pointer down event is correctly set up in the Canvas Manager to initiate dragging.

Here’s how to update your middleware registrations and the Canvas Manager component:
::: code-group
```ts [CanvasManager.middleware.ts]
import { checkHover } from '../CanvasEvents';

export const pointerDownMiddleware = new ReactEventMiddleware<React.PointerEvent>(new Set([onDragStart]));
export const pointerMoveMiddleware = new ReactEventMiddleware<React.PointerEvent>(new Set([onDrag, checkHover]));
export const pointerUpMiddleware = new ReactEventMiddleware<React.PointerEvent>(new Set[onDragStop]);
```

```tsx [CanvasManager.tsx]
export const CanvasManager = () => {
  useRedrawEvent(redraw, []);
  useReactEventMiddleware<React.PointerEvent>(pointerUpMiddleware, drawOnClick);
  return (
    <CanvasGridContainer
      onPointerDown={pointerDownMiddleware.handleEvent}
      onPointerMove={pointerMoveMiddleware.handleEvent}
      onPointerUp={pointerUpMiddleware.handleEvent}>
      <CanvasController />
    </CanvasGridContainer>
  )
}
```
:::
By following these steps, you integrate the drag and hover functionalities seamlessly into your canvas application. The order of middleware registration ensures that drag operations take precedence over hover checks when necessary, providing a more intuitive and responsive user experience.
