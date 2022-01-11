import { Got } from 'got'
import cheerio from 'cheerio'
import qs from 'qs'
import * as defaults from '../defaults.js'

/**
 * Get the router metadata
 *
 * @param instance The got instance to use
 * @returns The router firmware metadata including branch and commit
 */
export const getMetadata = async (
  instance: Got = defaults.instance
) => {
  const res = await instance
    .get(defaults.URIs.serviceView, {
      headers: {
        // Referer check is present on the system
        referer: defaults.URIs.serviceView +
          `?${qs.stringify({
            tmenu: 'navi_menu_basic'
          })}`
      },
      searchParams: {
        tmenu: defaults.services.EServiceCategory.SYSTEM,
        smenu: 'swupgrade'
      }
    })
    .text()
  const $ = cheerio.load(res)

  const element = $('span[title*="-"]')
    .parentsUntil('table')
  const [
    ,
    versionElement,
    ,
    dateElement
  ] = element
    .find('td')
    .toArray()

  const version = $(versionElement).text()
  const [branch, commit] = (
    $(versionElement)
      .find('span')
      .attr('title') ?? ''
  )
    .split('-')
  const date = $(dateElement).text()

  return {
    version,
    branch,
    commit,
    date
  }
}
