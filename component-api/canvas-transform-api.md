---
layout: doc
---

## CanvasTransform
Besides the CanvasContainer, the CanvasTransform is the most important file in RCK.  It is the service that manages your transformations, scaling, content tracking and a bunch of usefull methods.
Bellow we'll list them all one by one, and what they do.

## Usage
To use the CanvasTransform simply import it's instance, with it you will get access to all the props and method.  First lets cover the properties.

| Property | Type | Description |
| -------- | ---- | ----------- |
| `scale`    | number | Represents the current scale of the canvas, adjusted for the device pixel ratio. This adjustment ensures scaling takes into account the display's density. A value of 1 equates to 100%. |
| `offset`   | `Point`  | Indicates the current { x, y } offset of the canvas. Initially set to { x: 0, y: 0 }, it changes as the canvas is scrolled or scaled. |
| `trackingEnabled` | boolean | Flags whether content tracking is active, determined by the presence of points designated for tracking. |

The Point type used for the offset property is a type you can import `import { Point } from @practicaljs/react-kit`, facilitating precise positioning and movement across the canvas.

Lets cover all the mothods now

## Methods
## changeScale
`changeScale(value: number, ctx: CanvasRenderingContext2D, x?: number, y?: number)`
Adjusts the current scale of the canvas by a specified value. The scaling is centered around the point (x, y) or the canvas's center if these are not provided.
### Parameters:
 * `value`: The amount to adjust the scale by. Positive values zoom in, while negative values zoom out.
 * `ctx`: Canvas redering context
 *  `x`, `y`: Optional. The canvas coordinates around which to center the scaling effect. Defaults to the canvas's center.
### Effect
This method recalculates the canvas's scale and offset, ensuring that the zoom effect maintains the specified point (or the center) in view. It triggers a redraw of the canvas.
### Usage Example:
```ts
// Zoom in on the canvas center
canvasTransform.changeScale(0.1, ctx);

// Zoom out, centered on a specific point (100, 200)
canvasTransform.changeScale(-0.1, ctx, 100, 200);
```

## changeOffset
`changeOffset(deltaX: number, deltaY: number)`
Modifies the canvas's current offset by a specified amount in both the x and y directions. This method is typically used to pan the canvas.
### Parameters
 * `deltaX`: The amount to adjust the offset in the x direction. Positive values move the canvas to the left, while negative values move it to the right.
 * `deltaY`: The amount to adjust the offset in the y direction. Positive values move the canvas up, while negative values move it down.
### Effect
Adjusts the `offset` property of the canvas, shifting its visible area according to the specified deltas. It ensures that panning actions are reflected immediately on the canvas by triggering a synchronization and notification process to update the canvas view.
### Usage Example:
```ts
// Pan the canvas right by 50 units and down by 30 units
canvasTransform.changeOffset(-50, -30);

// Pan the canvas left by 20 units and up by 10 units
canvasTransform.changeOffset(20, 10);
```

## trackShape
`trackShape(key: string, x: number, y: number)`
Registers a canvas shape or component for tracking within the canvas's coordinate system. This tracking is essential for enabling content-aware functionalities, such as scale to fit or dynamic scrollbars, by maintaining awareness of the content's spatial boundaries.
### Parameters
 * `key`: A unique identifier for the shape being tracked. This ID is used to distinguish individual shapes, allowing for their positions to be updated or removed from tracking as needed.
 * `x`: The x-coordinate of the shape's position on the canvas.
 * `y`: The y-coordinate of the shape's position on the canvas.
### Effect
Upon invocation, this method updates internal tracking structures to include the new shape, effectively expanding the known content bounds if the shape lies outside the current bounds. It ensures that functionalities relying on content boundaries, such as auto-scaling or recentering, accurately reflect the presence of this shape.
### Usage Example
```ts
// Track a new shape identified by 'shape1' located at (100, 150)
canvasTransform.trackShape('shape1', 100, 150);

// Add another shape, 'shape2', to be tracked at (200, 250)
canvasTransform.trackShape('shape2', 200, 250);
```
## recenter
`recenter(ctx: CanvasRenderingContext2D, x?: number, y?: number)`
Repositions the canvas view to center on a specific point or defaults to the center of the canvas if no point is specified. This method is crucial for adjusting the focal point of the canvas, especially after zooming or when the user needs to focus on a particular area.
### Parameters
 * `ctx`: The canvas rendering context, used to access the canvas's dimensions and its current transformation matrix.
 * `x`, `y`: Optional. The canvas coordinates to recenter the view on. These should be canvas coordinates, not window or pointer coordinates. If not provided, the canvas will recenter to its middle.
### Effect
Adjusts the offset property to shift the canvas's view. If `x` and `y` are provided, the canvas centers on this point; otherwise, it centers on the canvas's geometric center. This adjustment is visually reflected by repositioning the canvas content accordingly.
### Usage Example
```ts
const { center } = myListOfComponents[0]
// Recenter the canvas on a path
canvasTransform.recenter(ctx, center.x, center.y);

// Recenter the canvas to its geometric middle
canvasTransform.recenter(ctx);
```

>Note: To recenter around a pointer position (for example, following a mouse click), use `getCanvasPoint` from `react-kit`. To learn more about `getCanvasPoint` visit the [react kit api docs](/react-kit/get-canvas-point)

## recenterOnContent
`recenterOnContent(ctx: CanvasRenderingContext2D, scaleToFit: boolean = false, padding: [number, number] | number = 200)`
Automatically adjusts the canvas view to center on and optionally scale to fit the tracked content. This method is essential for focusing the user's view on relevant content, especially after adding or modifying shapes on the canvas.
### Parameters
 * `ctx`: The canvas rendering context, necessary for calculating the current view and adjusting the canvas transformation.
 * `scaleToFit`: A boolean flag indicating whether the canvas should not only recenter but also scale the content to fit within the current view. Defaults to `false`.
 * `padding`: Optional padding to apply when scaling to fit. Can be a uniform number for all sides or a tuple `[number, number]` specifying horizontal and vertical padding, respectively. Defaults to `200`, which applies when `scaleToFit` is true.
### Effect
If tracking is enabled, the method calculates the geometric center of all tracked shapes and recenters the view around this point. If `scaleToFit` is true, it additionally scales the content so that all tracked shapes fit within the canvas view, applying the specified `padding`. The canvas `offset` and `scale` are updated accordingly.
```ts
// Just recenter the view on the tracked content
canvasTransform.recenterOnContent(ctx);

// Recenter and scale the view to fit all tracked content, with default padding
canvasTransform.recenterOnContent(ctx, true);

// Recenter and scale to fit with custom padding
canvasTransform.recenterOnContent(ctx, true, [100, 100]);
```
>Note:For this method to function, content must be actively tracked using trackShape. Without tracked content, the method defaults to centering the canvas as if no specific content needs focus. This automatic centering and scaling are particularly useful in applications where the visible content dynamically changes, ensuring users always have a clear and appropriately scaled view of the canvas content.

## subscribe and getSnapshot
`subscribe(listener: () => void)`
Registers a callback to be notified of changes to the canvas transformation state. This method is essential for external components or services that need to react to transformation changes, such as zooming or panning.

### Parameters
 * `listener`: A callback function that will be invoked whenever a change occurs in the canvas transformation state.
### Returns
A function that, when called, will unsubscribe the previously registered listener, effectively removing it from the notification list

`getSnapshot(): CanvasTransformSnapshot`
Retrieves the current snapshot of the canvas transformation state, including `scale` and `offset`. This method is particularly useful for synchronizing the canvas state with external stores or React state.


### Returns
An object representing the current state of the canvas transformation, with properties `scale` and `offset`.

### Usage Example:
```ts
// Register a listener to log whenever a transformation change occurs
const unsubscribe = canvasTransform.subscribe(() => {
  console.log('Canvas transformation changed');
});

// Later, to stop receiving notifications
unsubscribe();

// Obtain the current canvas transformation snapshot
const snapshot = canvasTransform.getSnapshot();
console.log(`Current scale: ${snapshot.scale}, offset: ${snapshot.offset.x}, ${snapshot.offset.y}`);
```

In RCK, you can subscribe to canvas transformation changes to update your UI in response to user interactions. Below, we'll demonstrate the three most common ways to listen to these changes, catering to different needs and scenarios:
```ts
import { useTransformSelect } from '@practicaljs/react-canvas-kit';
// only listen to scale changes
const scale = useTransformSelect('scale');
// only listen to offset changes
const offset = useTransformSelect('offset');
// listen to both changes
  const { scale, offset } = useSyncExternalStore(
    canvasTransform.subscribe,
    canvasTransform.getSnapshot,
  );
```

## loadFromSnapshot
`loadFromSnapshot(snapshot: CanvasTransformSnapshot)`
Restores the canvas transformation state from a previously saved snapshot. This method is particularly useful for maintaining the user's view and zoom level on the canvas across reloads or component re-mounts, ensuring a seamless user experience.
### Parameters:
 * `snapshot`:  An object representing a saved state of the canvas transformations, including scale and offset. This snapshot should be obtained beforehand using the `getSnapshot()` method.
### Effect
Upon invocation, `loadFromSnapshot` updates the current canvas transformation state (`scale` and `offset`) to match those stored in the `snapshot`. This action triggers any subscribed listeners to update accordingly, ensuring the canvas visually reflects the restored state.
### Usage Example
```ts
// Assume a snapshot has been previously saved
const savedSnapshot = canvasTransform.getSnapshot();

// At a later point, perhaps after a reload or component update
canvasTransform.loadFromSnapshot(savedSnapshot);
// The canvas now reflects the saved transformation state
```
## clearTrackedShapes
`clearTrackedShapes()`
Removes all shapes from the tracking system. This method is crucial for applications that dynamically add or remove content from the canvas and need to refresh the tracked content boundaries.
### Effect
Clears the internal tracking data for shapes, including minimum and maximum X and Y coordinates. This action effectively resets the canvas's content boundaries, preparing it for new content to be tracked from scratch.
### Usage Example
```ts
// Clearing all currently tracked shapes from the canvas
canvasTransform.clearTrackedShapes();
// After this call, the canvas will no longer consider previously tracked shapes for content-aware utilities.
```

## reset
`reset()`
Resets the canvas to its initial state, including scale and offset, removes all event listeners, and clears tracked shapes. This method is typically used when unmounting the component or when needing to completely refresh the canvas and its interactions.
### Effect
Sets the canvas's scale back to `1` (100%) and the offset to `{ x: 0, y: 0 }`, ensuring the canvas is viewed in its original state. It also invokes `clearTrackedShapes` to remove any shape tracking data and clears all subscribed listeners to prevent memory leaks and ensure a clean state for potential re-use.
### Usage Example
```ts
// Resetting the canvas before unmounting a component or when starting a new canvas session
canvasTransform.reset();
// The canvas is now in its default state, with no transformations, tracking, or listeners.
```
>Note: The `reset` method is particularly useful in single-page applications (SPAs) where the canvas component might be mounted and unmounted frequently as the user navigates. Invoking this method ensures that leaving a canvas does not leave behind any lingering state or listeners that could affect subsequent uses of the canvas or other parts of the application.