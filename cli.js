import { readFile } from 'fs/promises'
import { cac } from 'cac'
import { warmSocialImages } from './index.js'

const pkg = JSON.parse(
  await readFile(new URL('./package.json', import.meta.url))
)

const cli = cac(pkg.name)
cli
  .command(
    '<sitemap-url>',
    'Fetches social images from all of the pages in a given sitemap'
  )
  .option(
    '--concurrency <concurrency>',
    'Sets the concurrency for processing pages',
    {
      default: 8
    }
  )
  .option('--silent', 'Silences logging', {
    default: false
  })
  .action((sitemapUrl, options) => {
    warmSocialImages(sitemapUrl, options)
      .then((results) => {
        console.log(results)
      })
      .catch((err) => {
        console.error('error', err.message)
      })
  })

cli.help()
cli.version(pkg.version)
try {
  cli.parse()
} catch (err) {
  console.error(`error: ${err.message}\n`)
  cli.outputHelp()
}
