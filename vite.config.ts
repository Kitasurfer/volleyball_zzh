import path from "path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vite"
import { createRequire } from 'module'
import sourceIdentifierPlugin from 'vite-plugin-source-identifier'

const require = createRequire(import.meta.url)
const vitePrerender = require('vite-plugin-prerender') as typeof import('vite-plugin-prerender')

function createPrerenderPlugin() {
  const PuppeteerRenderer = vitePrerender.PuppeteerRenderer

  return vitePrerender({
    staticDir: path.join(__dirname, 'dist'),
    server: {
      host: '127.0.0.1',
    },
    routes: ['/', '/about', '/gallery', '/hall', '/beach', '/training', '/competitions', '/contact'],
    renderer: new PuppeteerRenderer({
      headless: true,
      renderAfterDocumentEvent: 'prerender-ready',
      inject: {
        prerender: true,
      },
      maxConcurrentRoutes: 1,
    }),
  })
}

export default defineConfig(({ mode }) => {
  const isProd = mode === 'production'
  const prerenderPlugin = isProd ? createPrerenderPlugin() : null
  
  return {
    plugins: [
      react({
        jsxRuntime: 'automatic',
      }), 
      sourceIdentifierPlugin({
        enabled: !isProd,
        attributePrefix: 'data-matrix',
        includeProps: true,
      }),
      ...(prerenderPlugin ? [prerenderPlugin] : []),
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      target: 'es2018',
      minify: isProd ? 'esbuild' : false,
      sourcemap: !isProd,
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(isProd ? 'production' : 'development'),
    },
  }
})
