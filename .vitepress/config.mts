import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: "React Canvas Kit",
  description: "HTML 5 Canvas toolkit for React Apps",
  head: [['link', { rel: 'icon', href: '/rck.png' }]],
  themeConfig: {
    logo: 'logo.min.svg',
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Home', link: '/' },
    ],

    sidebar: [
      {
        text: 'Guide',
        items: [
          { text: 'Get Started', link: '/guide/index' },
          { text: 'Add CanvasController (FAB)', link: '/guide/canvas-transform' },
          { text: 'Canvas Rendering', link: '/guide/canvas-rendering' }
        ]
      },
      {
        text: 'Component API',
        items: [
          { text: 'CanvasContainer', link: '/component-api/canvas-container' },
          { text: 'Built in Interactions', link: '/component-api/interactions' },
          { text: 'CanvasTransform', link: '/component-api/canvas-transform-api' }
        ]
      },
      {
        text: 'Canvas-Kit API',
        items: [
          { text: 'getCanvasPoint', link: '/react-kit/get-canvas-point' }
        ]
      }
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/harlenalvarez/react-canvas-kit' }
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2023-present Harlen Alvarez'
    }
  }
})
