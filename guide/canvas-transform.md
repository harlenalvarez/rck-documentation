---
layout: doc
prev:
 text: 'Get Started'
 link: '/guide/index'
next:
 text: 'Rendering'
 link: '/guide/canvas-rendering'
---
# Canvas Floating Action Buttons (FAB)

## Add CanvasController (FAB)
Now that it's time to add our first FAB, it's important to keep in mind that clicking on any FAB will trigger event propagation into the CanvasContainer. For example, if you are listening to click events to draw a shape, then clicking on the FAB will also trigger that event. To prevent this from happening, you would typically need to stop propagation and prevent default actions for each event. However, instead of adding that logic to every individual event, you can simply create a StopPropagation.tsx file that wraps all your FABs, effectively managing event propagation centrally.

> Note: Depending on your specific use case, you may need to listen to additional events beyond those covered here. Adjust the StopPropagation component accordingly to ensure all relevant interactions are managed effectively.
```tsx [StopPropagation.tsx]
export const StopPropagation = ({ children }: React.PropsWithChildren) => {
  const stopPropagation = (e: React.SyntheticEvent) => {
    e.stopPropagation();
    e.preventDefault();
  };
  // Using `display: contents` to avoid adding extra styling or layout changes, 
  // while still being able to capture and stop events.
  return (
    <div style={{ display: 'contents' }} onPointerUp={stopPropagation} onPointerDown={stopPropagation} onClick={stopPropagation} onPointerMove={stopPropagation} onKeyUp={stopPropagation} onKeyDown={stopPropagation}>
      {children}
    </div>
  );
}
```

Lets add our canvas controller to the bottom right courner of the canvas.  If you recall in your last step, we specified an area called `controller` in the `CanvasGridContainer.tsx`.

To keep things a little cleaner I'll create a `CanvasController.styled.tsx` file for styling and `CanvasController.tsx` for the component.
::: code-group
```tsx [CanvasController.styled.tsx]
import { Paper, styled } from '@mui/material';

export const CanvasControllerContainer = styled(Paper)`
  grid-area: controller;
  justify-self: end;
  align-self: end;
  margin-bottom: 8px;
  display: flex;
  flex-flow: row nowrap;
  gap: 4px;
  padding: 4px;
`
```
```tsx [CanvasController.tsx]
import { StopPropagation } from '@/components';
import AddIcon from '@mui/icons-material/Add';
import FitScreenOutlinedIcon from '@mui/icons-material/FitScreenOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import { Button, IconButton, Tooltip } from '@mui/material';
import { CanvasControllerContainer } from './CanvasController.syled';

export const CanvasController = () => {
  return (
    <StopPropagation>
      <CanvasControllerContainer>
        <Tooltip title='Zoom out' placement='top' arrow>
          <IconButton>
            <RemoveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Click to reset' placement='top' arrow>
          <Button variant='text' sx={{ color: 'text.primary' }}>100%</Button>
        </Tooltip>
        <Tooltip title='Zoom in'>
          <IconButton>
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Zoom to fit'>
          <IconButton>
            <FitScreenOutlinedIcon />
          </IconButton>
        </Tooltip>
      </CanvasControllerContainer>
    </StopPropagation>
  )
}
```
:::

Add the new component inside the `CanvasManager`.
```tsx [CanvasManager.tsx]
import { CanvasController } from '../CanvasFabs'
import { CanvasGridContainer } from './CanvasManager.styled'

export const CanvasManager = () => {
  return (
    <CanvasGridContainer>
      <CanvasController /> // [!code ++]
    </CanvasGridContainer>
  )
}
```

## Add handlers
We've initially set a static zoom level without attaching logic to our buttons, making now the ideal time to introduce the canvasTransform service. This service is key for managing canvas context and transformations, offering utility methods for common interactions. It simplifies implementing dynamic features like zooming and panning. Learn more about leveraging canvasTransform in the [canvas transform API documentation](/component-api/canvas-transform-api)

In the upcoming code examples, I'll demonstrate an unconventional approach to method creation. Common practice involves embedding all methods within the React component, often memoizing them with `useCallback` to prevent unnecessary re-renders. However, by adopting a service pattern, we gain the flexibility to access transformation features both inside and outside of React components. We believe this approach simplifies optimization and unit testing. While you're welcome to define methods within your components and use useCallback for memoization, it's worth noting that including canvasTransform in the dependency array is unnecessary. Its instance remains constant across renders, ensuring that all values are consistently accessible without being scoped.

To organized our code we'll create a separate file for all the methods ( Only do this if you are placing methods outside of react)
::: code-group
```tsx [CanvasController.handlers.ts]
import { canvasTransform, getCanvas2DContext, requestRedraw } from '@practicaljs/react-canvas-kit';

// we constantly do this check so might as well create a HOF for it.
const withCanvasContext = (consumer: (ctx: CanvasRenderingContext2D) => void) => () => {
  const ctx = getCanvas2DContext();
  if (!ctx) return;
  return consumer(ctx);
}

export const handleScaleOut = withCanvasContext((ctx: CanvasRenderingContext2D) => {
  canvasTransform.changeScale(-0.1, ctx);
  requestRedraw()
});

export const handleScaleIn = withCanvasContext((ctx: CanvasRenderingContext2D) => {
  canvasTransform.changeScale(0.1, ctx);
  requestRedraw()
});

export const handleResetScale = withCanvasContext((ctx) => {
  const change = 1 - canvasTransform.scale;
  canvasTransform.changeScale(change, ctx);
  requestRedraw()
});

export const handleScaleToFit = withCanvasContext((ctx) => {
  canvasTransform.recenterOnContent(ctx, true);
  requestRedraw()
});

```
```tsx [CanvasController.tsx]
import { StopPropagation } from '@/components';
import AddIcon from '@mui/icons-material/Add';
import FitScreenOutlinedIcon from '@mui/icons-material/FitScreenOutlined';
import RemoveIcon from '@mui/icons-material/Remove';
import { Button, IconButton, Tooltip } from '@mui/material';
import { useTransformSelect } from '@practicaljs/react-canvas-kit';
import { handleResetScale, handleScaleIn, handleScaleOut, handleScaleToFit } from './CanvasController.handlers';
import { CanvasControllerContainer } from './CanvasController.syled';

export const CanvasController = () => {
  const scale = useTransformSelect('scale') // [!code ++]
  return (
    <StopPropagation>
      <CanvasControllerContainer>
        <Tooltip title='Zoom out' placement='top' arrow>
          <IconButton onClick={handleScaleOut}> // [!code ++]
            <RemoveIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Click to reset' placement='top' arrow>
          <Button variant='text' sx={{ color: 'text.primary' }} onClick={handleResetScale}> // [!code ++]
            {Math.round(scale * 100)}% // [!code ++]
          </Button>
        </Tooltip>
        <Tooltip title='Zoom in'>
          <IconButton onClick={handleScaleIn}> // [!code ++]
            <AddIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title='Zoom to fit'>
          <IconButton onClick={handleScaleToFit}> // [!code ++]
            <FitScreenOutlinedIcon />
          </IconButton>
        </Tooltip>
      </CanvasControllerContainer>
    </StopPropagation>
  )
}
```
:::

It's important to note that most methods in RCK require passing the CanvasRenderingContext2D, essential for rendering shapes or performing transformations. Observant readers will note the call to requestRedraw() after each transformation change—a practice ensuring the canvas accurately reflects these modifications. We'll delve into both the context handling and the significance of requestRedraw() in the subsequent section. For comprehensive details on canvasTransform methods, visit the [canvas transform API documentation](/component-api/canvas-transform-api)