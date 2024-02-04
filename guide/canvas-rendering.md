---
layout: doc
prev:
 text: 'FAB and Canvas Transform'
 link: '/guide/canvas-transform'
next: false
---
# Canvas Rendering

In this guide we will cover getCanvas2DContext, requestRedraw, useRedrawEvent, getCanvasPoint and ReactEventMiddleware.

With any canvas the goal is to let users draw on the canvas by selecting a shape and clicking where they want it. RCK is a library on top of the canvas rendering 2d context, therefore any shapes you create will follow the [canvas api documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API). To keep the guide simple we'll listen to a click event, get the canvas coordiantes in relation to the DOM, create a Path2d to draw a rect starting on that x,y coordiante and adding a 100px width and height. Finally we'll call the requestRedraw and implement the useRedrawEvent to render the shape.

## Adding an event
All events that interact directly with the canvas will be attached to the `CanvasManager.tsx` class you created earlier.  Because you will have multiple purposes for the same event, ei. PointerMove can check for hover, but on PointerDown on a shape it can drag, we've created an `ReactEventMiddleware` and `ReactEventHandler` type.

In your `CanvasManager.tsx` directory lets add a new file called `CanvasManager.middlewares.ts` to new up our middlewares

::: code-group
```ts [CanvasManager.middlewares.ts]
export const pointerUpMiddleware = new ReactEventMiddleware<React.PointerEvent>(new Set())
```
```tsx [CanvasManager.tsx]
export const CanvasManager = () => {
  return (
    <CanvasGridContainer onPointerUp={pointerUpMiddleware.handleEvent}> // [!code ++]
      <CanvasController />
    </CanvasGridContainer>
  )
}
```
:::

We now have a middleware, but lets get to registering some event handlers.
There are two ways to do this, the easiest is to simply include your event handler when you new up the code and it will be available for entire lifecycle of that event. <Badge text='recommended' type='info' />
```ts [CanvasManager.middlewares.ts]
import { ReactEventMiddleware } from '@practicaljs/react-canvas-kit';
const handlers = new Set<React.PointerEvent>();
handlers.add((e: ReactPointer) => {
  // do somthing
})
export const pointerUpMiddleware = new ReactEventMiddleware<React.PointerEvent>(handlers)
```

The other way is to use the event registration hook which unsubscribes handlers if you are sharing the same middle ware accross multiple pages. IE. say you have an app with multiple canvas purposes and layouts, but don't want to new up multiple middlewares.
In this example we'll use the hook approach since I don't think the other method requires more examples.

> You can combine both approaches as well if you want singleton and scope events from the same middleware.

```tsx [CanvasManager.tsx]
import { CanvasController } from '@/components';
import { ReactEventHandler, useReactEventMiddleware } from '@practicaljs/react-canvas-kit'; // [!code ++]
import { pointerUpMiddleware } from './CanvasManager.middlewares';
import { CanvasGridContainer } from './CanvasManager.styled';

const drawOnClick: ReactEventHandler<React.PointerEvent> = (_: React.PointerEvent) => { // [!code ++]
  console.log('drawClick') // [!code ++]
  return true; // [!code ++]
} // [!code ++]

export const CanvasManager = () => {
  useReactEventMiddleware<React.PointerEvent>(pointerUpMiddleware, drawOnClick); // [!code ++]
  return (
    <CanvasGridContainer onPointerUp={pointerUpMiddleware.handleEvent}>
      <CanvasController />
    </CanvasGridContainer>
  )
}
```

>The order in which you register events is important. If you want the middleware to stop propagating to the other handlers in the chain return false.