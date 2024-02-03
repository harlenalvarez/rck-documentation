---
layout: doc
---
## CanvasContainer

The canvas container acts as the foundational entry point to utilizing the canvas, orchestrating the setup of transformations, the integration of event listeners, and the execution of device-agnostic rendering logic. This ensures that the canvas is not only fully responsive but also optimized for interaction and display across all devices, facilitating a seamless development experience and superior performance for end-users.

It's crucial to understand that the CanvasContainer in RCK manages three distinct canvas layers: main, top, and internal. The main layer is the primary canvas where most components and visuals are rendered. The top layer is designated for elements that aren't directly part of the main painting process, such as indicators for other users' cursor positions. Lastly, the internal layer is reserved for RCK's own use, including functionalities like scrollbar rendering. Notably, any call to requestRedraw('main') triggers a redraw of the internal layer, ensuring consistent and synchronized updates across the layers.

The container takes 3 props
| Property   | Default: Type  | Description 
| ---------- | -------------  | ----------- |
| `offsetTop`  | `0`:number      | In some cases, you may have a static navbar at the top of your page. If this is the case, set the offset to the number of pixels your navbar occupies. |
| `mode`       | `dark` or `light` | Adjusts the dot colors to ensure they blend appropriately with the background, optimizing visibility without being overly prominent. <Badge type="tip" text="^1.2.0" />|
| `includeScrollBars` | `false`: boolean | Controls the rendering of scrollbars when content tracking is enabled. This feature is still in beta; currently, scrollbars are rendered but do not support click-and-drag functionality. <Badge type="warning" text="beta" /> |
| `fullScreen` | `true`: boolean | Determines if the canvas should occupy the full screen or be contained within a parent element. Currently, only full screen mode is supported. <Badge type="warning" text="beta" /> |