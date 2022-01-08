import { Got } from 'got'
import cheerio from 'cheerio'
import * as defaults from './defaults.js'

/**
 * Get briefing metadata from main page
 *
 * @param instance The got instance to use
 * @returns Publicated router metadata you can see on main page
 */
export const getBriefing = async (
  instance: Got = defaults.instance
) => {
  const res = await instance
    .get(defaults.URIs.mainView, {
      headers: {
        // Referer check is present on the system
        referer: defaults.URIs.loginHandle
      }
    })
    .text()
  const $ = cheerio.load(res, {
    lowerCaseTags: true
  })

  const ip = $('span.item_text:contains("IP -")').text()
  const [
    modeText,
    connectionText,
    address
  ] = ip
    .split('-')
    .map(fragment => fragment.trim())

  const version = $('span.item_text:contains("Version")')
    .text()
    .replace('Version ', '')

  return {
    ip: {
      address,
      isDynamic: modeText === '동적 IP',
      isConnected: connectionText === '연결됨'
    },
    version
  }
}
