---
layout: doc
---

## getCanvas2DContext
`getCanvas2DContext(layer?: keyof typeof canvasLayer, inCanvas?: HTMLCanvasElement | null): CanvasRenderingContext2D | null`
Helper method to get the canvas 2D context from the specified layer.  There are 3 layers that get setup, the main layer where most of the renderings will happen, a top layer where you can show independent elements like live user cursor position and the internal layer.  There is a second optional param where you can pass the html canvas itself to get it's 2d context ( this is only used internally in one place ).
## Parameters
 * `layer`: (Optional) Specifies the canvas layer to target. Acceptable values are 'main', 'top', or 'internal', with 'main' being the default if no layer is specified.
 * `inCanvas`: (Optional) The HTML canvas element from which to obtain the 2D context.

## Returns
 Returns the CanvasRenderingContext2D object for the specified canvas layer, allowing direct manipulation and rendering onto the canvas. For detailed information on the CanvasRenderingContext2D API, visit the [MDN documentation](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D)

## Example usage
```ts
const drawSomething = () => {
  const ctx = getCanvas2DContext();
  if(!ctx) return
  // rest
}
```

> [!CAUTION]
> Use the internal layer sparingly and only when absolutely necessary, as it is intended for specific internal operations of the library. Accessing or modifying the internal layer without a clear understanding of its role within the library can lead to unexpected behavior.