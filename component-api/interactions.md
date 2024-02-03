---
layout: doc
---
## Build in interactions

RCK enhances your React applications with built-in user interactions, drawing inspiration from the intuitive mouse and trackpad gestures found in leading canvas tools. These interactions are seamlessly integrated with the CanvasContainer, enabling natural navigation and manipulation of the canvas content.

It's crucial to note that invoking preventDefault on any of the supported events will deactivate the corresponding RCK interaction. This feature allows for customization but should be used judiciously to preserve the intuitive user experience RCK aims to provide.

Below is a comprehensive list of default interactions supported by RCK, along with the events they're tied to and their effects:

| Interaction  | Event | Description |
| -----------  | ----- | ----------- |
| Ctrl/Cmd & + | `keyup` | Zoom in the canvas at the center |
| Ctrl/Cmd & - | `keyup` | Zoom out the canvas at the center |
| Pinch In and out | `wheel` | Zooms in and out, keeping the pointer's position in focus. |
| Ctrl/Cmd & Wheel | `wheel` | Zooms in and out, maintaining the pointer's position. |
| Aux (mouse wheel) Hold & Drag  | `mousedown`, `mousemove`, `mouseup`  | Drags (Pan) the canvas | 
| Space & Drag | `keydown` + `mousemove` | Drags the canvas |
| Scroll | `wheel` | Scrolls vertically through the canvas. |
| Shift & Scroll | `keydown` + `wheel` | Allows for horizontal scrolling. |