import got from 'got'
import pMap from 'p-map'
import normalizeUrl from 'normalize-url'
import prettyBytes from 'pretty-bytes'
import { XMLParser } from 'fast-xml-parser'
import metascraper from 'metascraper'
import metascraperImage from 'metascraper-image'

const metaImageScraper = metascraper([metascraperImage()])

export async function warmSocialImages(
  sitemapUrl,
  { concurrency = 8, silent = false } = {}
) {
  const sitemapXml = await got(sitemapUrl).text()
  let sitemap

  try {
    const parser = new XMLParser()
    sitemap = parser.parse(sitemapXml)
  } catch (err) {
    console.error('error invalid sitemap', sitemapUrl, err.message)
    throw err
  }

  // normalize urls in sitemap and remove duplicates
  const urls = Array.from(
    new Set(
      sitemap?.urlset?.url?.map((url) => normalizeUrl(url?.loc)).filter(Boolean)
    )
  )

  if (!silent) {
    console.log(`processing ${urls.length} pages`)
  }

  let numSuccess = 0
  let numError = 0
  let numNotFound = 0

  await pMap(
    urls,
    async (targetUrl, index) => {
      try {
        const { body: html, url } = await got(targetUrl)
        const metadata = await metaImageScraper({ html, url })

        if (metadata.image) {
          const res = await got(metadata.image)
          const length = res.rawBody.byteLength
          const bytes = prettyBytes(length)

          if (!silent) {
            console.log(`${index}: ${bytes} ${metadata.image}`)
          }

          ++numSuccess
        } else {
          ++numNotFound
        }
      } catch (err) {
        if (!silent) {
          console.warn(`${index}: error`, targetUrl, err.message)
        }

        ++numError
      }
    },
    {
      concurrency
    }
  )

  return {
    numSuccess,
    numError,
    numNotFound
  }
}
