import path from 'path'
import { createApp } from 'vue'
import { renderToString } from '@vue/server-renderer'
import { beforeAll, describe, expect, it } from 'vitest'
import puppeteer from 'puppeteer'
import glob from 'fast-glob'
import ElementPlus, { ID_INJECTION_KEY } from '../dist/element-plus'

import type { Browser } from 'puppeteer'

const projectRoot = process.cwd()
const testRoot = `${projectRoot}/ssr-testing`
const demoRoot = path.resolve(projectRoot, 'ssr-testing/cases')
describe('Cypress Button', () => {
  let browser: Browser
  beforeAll(async () => {
    browser = await puppeteer.launch()
  })

  describe('when initialized', () => {
    const demoPaths = glob
      .sync(`${demoRoot}/*.vue`)
      .map((demo) => demo.slice(demoRoot.length + 1))

    it.each(demoPaths)(`render %s correctly`, async (demoPath) => {
      const page = await browser.newPage()
      await page.goto(`file://${projectRoot}/ssr-testing/index.html`)
      await page.addStyleTag({
        path: path.join(
          projectRoot,
          'dist',
          'element-plus',
          'dist',
          'index.css'
        ),
      })
      const { default: Demo } = await import(path.join(demoRoot, demoPath))
      const app = createApp(<Demo />)
        .use(ElementPlus)
        .provide(ID_INJECTION_KEY, {
          prefix: 100,
          current: 0,
        })
      const html = await renderToString(app)

      await page.evaluate((innerHTML) => {
        document.querySelector('#root')!.innerHTML = innerHTML
      }, html)

      const screenshotPath = demoPath
        .split('/')
        .join('-')
        .replace(/\.vue$/, '.png')
      await page.screenshot({
        path: path.join(testRoot, 'screenshots', screenshotPath),
        fullPage: true,
      })
      await page.close()
      expect(true).toBe(true)
    })
  })
})
