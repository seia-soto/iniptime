import { Got } from 'got'
import cheerio from 'cheerio'
import qs from 'qs'
import * as defaults from '../defaults.js'
import { sleep } from '../utils.js'

/**
 * Get the router metadata
 *
 * @param instance The got instance to use
 * @returns The router firmware metadata including branch and commit
 */
export const getStatus = async (
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

/**
 * Get the remote ipTIME firmware status
 *
 * @param instance The got instance to use
 * @param delay The polling delay for next request
 * @returns The remote version with isUpgradable parameter
 */
export const getRemoteStatus = async (
  instance: Got = defaults.instance,
  delay: number = 1 * 1000
): Promise<{
  text: string
  version: string
  isUpgrading: boolean
  isUpgradable: boolean
}> => {
  const res = await instance
    .get(defaults.URIs.serviceView, {
      headers: {
        // Referer check is present on the system
        referer: defaults.URIs.serviceView +
          `?${qs.stringify({
            tmenu: defaults.services.EServiceCategory.SYSTEM,
            smenu: 'swupgrade'
          })}`
      },
      searchParams: {
        tmenu: defaults.services.EServiceCategory.DATA,
        smenu: 'sysconf_swupgrade_online_status'
      }
    })
    .text()
  const [, sentence] = /getElementById\('firmware_status'\).innerHTML = '([\wㄱ-ㅎ가-힣 .[\]<>]+)'/g
    .exec(res) ||
    ['', '']

  // Apply polling strategy with delay if still searching
  if (sentence.includes('검색하고') && delay > 0) {
    await sleep(delay)

    return getRemoteStatus(instance, delay)
  }

  // Check if upgrading
  if (sentence.includes('업데이트 중')) {
    return {
      text: sentence,
      version: '',
      isUpgrading: true,
      isUpgradable: false
    }
  }

  const [match] = /\d+\.[\d.]+/g
    .exec(sentence) ||
    ['']

  return {
    text: sentence,
    version: match,
    isUpgrading: false,
    isUpgradable: !sentence.includes('사용하고')
  }
}

/**
 * Request router system upgrade
 *
 * @param instance The got instance to use
 * @returns The status text
 */
export const upgrade = async (
  instance: Got = defaults.instance
) => {
  const res = await instance
    .post(defaults.URIs.serviceView, {
      headers: {
        // Referer check is present on the system
        referer: defaults.URIs.serviceView +
          `?${qs.stringify({
            tmenu: defaults.services.EServiceCategory.SYSTEM,
            smenu: 'swupgrade'
          })}`
      },
      body: qs.stringify({
        tmenu: defaults.services.EServiceCategory.DATA,
        smenu: 'sysconf_swupgrade_online_status',
        act: 'update'
      })
    })
    .text()
  const [, sentence] = /getElementById\('firmware_status'\).innerHTML = '([\wㄱ-ㅎ가-힣 .[\]<>]+)'/g
    .exec(res) ||
    ['', '']

  return {
    text: sentence,
    isPreparingUpgrade: sentence.includes('업그레이드 준비 중')
  }
}
