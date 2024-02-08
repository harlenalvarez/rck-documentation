---
layout: doc
prev:
 text: 'Canvas Floating Action Buttons'
 link: '/guide/canvas-transform'
next:
 text: 'Tracking'
 link: '/guid/canvas-tracking'
---
# Canvas Rendering

In this guide, we'll explore essential tools and techniques for canvas rendering, focusing on functions like `getCanvas2DContext`, `requestRedraw`, `useRedrawEvent`, `getCanvasPoint`, and `ReactEventMiddleware`.

With any canvas the goal is to let users draw on the canvas by selecting a shape and clicking where they want it. RCK is a library on top of the canvas rendering 2d context, therefore any shapes you create will follow the [canvas api documentation](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API). To keep the guide simple we'll listen to a click event, get the canvas coordiantes in relation to the DOM, create a Path2d to draw a rect starting on that x,y coordiante and adding a 100px width and height. Finally we'll call the requestRedraw and implement the useRedrawEvent to render the shape.

## Adding an event
All events that interact directly with the canvas should be attached to the `CanvasManager.tsx `class we introduced earlier. Given that a single event can serve multiple purposes—for example, PointerMove might be used both for checking hover states and for dragging a shape on PointerDown—we've devised a system using `ReactEventMiddleware` and `ReactEventHandler` types to manage these interactions efficiently.

To organize our event-handling logic, let's create a new file within your `CanvasManager.tsx` directory. Name this file `CanvasManager.middlewares.ts`. This file will be dedicated to setting up our middleware functions.

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

## Canvas Component State Management
Before diving into shape creation, it’s vital to establish where and how we'll store these shapes. Traditional React state management tools, like Context or Redux, may not yield optimal results for canvas-based components. This is because canvas rendering operates outside the standard React lifecycle, and excessive re-renders can hinder performance.

To efficiently manage our canvas state:

 * **Direct State Management**: We'll maintain our shapes in a manner that allows direct access outside of React's reactivity system. This approach minimizes DOM re-renders by avoiding direct ties to React state changes.
 * **Reference-Based Storage**: By storing our state by reference, we ensure that updates to our canvas do not trigger unnecessary React component re-renders. This is crucial for maintaining high performance, especially when dealing with complex or numerous shapes.
 * **Class-Based Pattern**: Following the pattern established earlier, we will encapsulate our state within a class and export an instance of this class. This technique provides a structured and accessible state management solution.
 * **Optional Scoping**: For scoped state management, consider implementing a factory function that generates instances with unique IDs. These instances can then be stored in a hash map, providing isolated state containers for different parts of your application or different canvas elements.
This approach to state management acknowledges the unique requirements of canvas-based components in React applications, prioritizing performance and direct access over conventional reactivity and encapsulation.
::: details View Factory Example
```ts
const instanceMap  = new Map<string, MyClass>();
const getStateByTemplateId = (id: string) => {
  if(!instanceMap.has(id)) {
    instanceMap.set(id, new MyClass());
  }
  return instanceMap.get(id)!;
}
```
:::

Lets create a new class, I'll call mine `Canvas.state.ts`.  For now we will use a simple array to keep Path2D objects;

```ts [Canvas.state.ts]
class CanvasState {
  paths: Path2D[] = []
}

// export the instance
export const canvasState = new CanvasState();
```

In the `drawOnClick` event you created earlier lets new up a 100 by 100 pixel square starting from the clicked point.

```tsx [CanvasManager.tsx]
import { CanvasController } from '@/components';
import { ReactEventHandler, useReactEventMiddleware, getCanvas2DContext } from '@practicaljs/react-canvas-kit'; // [!code ++]
import { pointerUpMiddleware } from './CanvasManager.middlewares';
import { CanvasGridContainer } from './CanvasManager.styled';
import { canvasState } from './Canvas.state.ts'; // [!code ++]
import { getCanvasPoint } from '@practicaljs/canvas-kit'; // [!code ++]

const drawOnClick: ReactEventHandler<React.PointerEvent> = (_: React.PointerEvent) => { // [!code ++]
  console.log('drawClick') // [!code --]
  return true; // [!code --]

    const ctx = getCanvas2DContext(); // [!code ++]
    if (!ctx) return false; // [!code ++]

    const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx); // [!code ++]
    ctx.beginPath(); // [!code ++]
    const path = new Path2D(); // [!code ++]
    path.rect(x, y, 100, 100); // [!code ++]
    canvasState.paths.push(path); // [!code ++]
    ctx.fillStyle = 'white'; // [!code ++]
    ctx.fill(path); // [!code ++]
    ctx.stroke(path); // [!code ++]
    return false; // [!code ++]
}

export const CanvasManager = () => {
  useReactEventMiddleware<React.PointerEvent>(pointerUpMiddleware, drawOnClick); // [!code ++]
  return (
    <CanvasGridContainer onPointerUp={pointerUpMiddleware.handleEvent}>
      <CanvasController />
    </CanvasGridContainer>
  )
}
```

You've already encountered `getCanvas2DContext`, which retrieves the 2D rendering context for the canvas's main layer. For operations on the top layer, you can specify `getCanvas2DContext('top')`.

Next, you'll need to convert the DOM click coordinates to canvas coordinates. It's crucial to use `offsetX` and `offsetY` for this purpose, especially if your canvas is positioned with an offset in the DOM. These properties ensure you're accurately mapping the click event to the correct canvas location.

As you begin interacting with the canvas by clicking, you'll notice a square drawn at each click location. However, you might observe that these squares do not move when you scroll or zoom within the canvas space. We will tackle how to adjust for these transformations in the next section, ensuring your drawings correctly respond to canvas manipulations.

## requestRedraw and useRedrawEvent

When you created the CanvasController after each change you called out to requestRedraw, now we need to listen to that event and re render the canvas.
For more options when calling requestRedraw and listening to the events read the docs.

Inside the CanvasManager lets add the redraw event hook
```tsx [CanvasManager.tsx]
import { CanvasController } from '@/components';
import { ReactEventHandler, useReactEventMiddleware, getCanvas2DContext, clearAll, useRedrawEvent } from '@practicaljs/react-canvas-kit'; // [!code ++]
import { pointerUpMiddleware } from './CanvasManager.middlewares';
import { CanvasGridContainer } from './CanvasManager.styled';
import { canvasState } from './Canvas.state.ts';
import { getCanvasPoint } from '@practicaljs/canvas-kit';

const drawOnClick: ReactEventHandler<React.PointerEvent> = (_: React.PointerEvent) => {
  const ctx = getCanvas2DContext(); 
  if (!ctx) return false; 
  const [x, y] = getCanvasPoint(e.nativeEvent.offsetX, e.nativeEvent.offsetY, ctx);
  ctx.beginPath(); 
  const path = new Path2D();
  path.rect(x, y, 100, 100);
  canvasState.paths.push(path);
  ctx.fillStyle = 'white';
  ctx.fill(path);
  ctx.stroke(path);
  return false;
}

const redraw = () => { // [!code ++]
  const ctx = getCanvas2DContext(); // [!code ++]
  if (!ctx) return; // [!code ++]
  // always clear the canvas // [!code ++]
  clearAll(ctx); // [!code ++]
  requestAnimationFrame(() => { // [!code ++]
    canvasState.paths.forEach(p => { // [!code ++]
      ctx.beginPath(); // [!code ++]
      ctx.fillStyle = 'white'; // [!code ++]
      ctx.fill(p); // [!code ++]
      ctx.stroke(p); // [!code ++]
    }) // [!code ++]
  }) // [!code ++]
}) // [!code ++]

export const CanvasManager = () => {
  useRedrawEvent(redraw, []); // [!code ++]
  useReactEventMiddleware<React.PointerEvent>(pointerUpMiddleware, drawOnClick);
  return (
    <CanvasGridContainer onPointerUp={pointerUpMiddleware.handleEvent}>
      <CanvasController />
    </CanvasGridContainer>
  )
}
```

With this setup, the canvas will correctly reflect changes when scrolling or zooming, ensuring a smooth and responsive user experience. In the next section, we'll delve into adding common interactions, such as element hover detection, dragging, and clicking.