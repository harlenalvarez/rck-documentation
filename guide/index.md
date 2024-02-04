---
layout: doc
prev: false
next:
 text: 'FAB and Canvas Transform'
 link: '/guide/canvas-transform'
---

# Getting started
## Overview

React Canvas Kit (RCK) is a comprehensive toolkit designed to streamline the integration and management of canvas functionalities within React applications. This toolkit facilitates a range of common canvas operations from initial setup and managing transformations to handling user events and rendering interactive popovers. With added support for scrollbar management <Badge type="warning" text="beta" />, RCK enhances the developer experience by simplifying the use of the Canvas API, while still providing full access to its comprehensive set of tools.

## Installation
Install the react canvas kit and it's dependencies
```npm
npm i @practicaljs/react-canvas-kit @practicaljs/canvas-kit @practicaljs/priority-queue
```
## Component Setup
### Add Canvas Container

Start by adding the canvas container. For comprehensive overview of all available properties, [click here](../component-api/canvas-container) to explore the documentation.


```tsx [MyCanvas.tsx]
import { CanvasContainer } from '@practicaljs/react-canvas-kit'

export const MyCanvas = () => {
  return (
    <CanvasContainer>
      <div>System design</div>
    </CanvasContainer>
  )
}
```

### Add Canvas Manager
The Canvas Manager acts as the control center for your canvas-based application. Here, you'll integrate event listeners for user interactions and display your floating action buttons (FAB) to enhance the user experience.

To get started, let's create a CanvasManager.tsx file. In this example, we leverage CSS Grid for layout management, MUI5 for UI components, and Emotion for styled components, providing a robust and flexible structure for our FAB button groups.
::: code-group
```tsx [CanvasManager.tsx]
import { styled } from '@mui/material';

export const CanvasGridContainer = styled('div')`
  width: 100%;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  grid-template-rows: repeat(3, 1fr);
  grid-template-areas:
    'header users'
    'menu .'
    'left controller';
  :focus {
    outline: none;
  }
`
export const CanvasManager = () => {
  return (
    <CanvasGridContainer />
  )
}
```
```tsx [MyCanvas.tsx]
import { CanvasContainer } from '@practicaljs/react-canvas-kit'
import { CanvasManager } from './CanvasManager' // [!code ++]

export const MyCanvas = () => {
  return (
    <CanvasContainer>
      <div>System design</div> // [!code --]
      <CanvasManager /> // [!code ++]
    </CanvasContainer>
  )
}
```
:::
With the above setup, your application now includes a full-width and height canvas that's responsive to events and equipped with a customizable interface for user interaction.  For a list of built in user interactions [click here](../component-api/interactions)

Next, we'll add a CanvasController FAB and introduce the canvasTransform service for handling canvas transformations.