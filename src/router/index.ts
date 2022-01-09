import { Got } from 'got'
import cheerio from 'cheerio'
import qs from 'qs'
import * as defaults from '../defaults.js'
import { parseDatetime } from '../utils.js'

// export all
export * as network from './network.js'

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

/* eslint-disable no-unused-vars */
export enum EWlanBandType {
  W2 = '2.4GHz',
  W5 = '5GHz'
}
/* eslint-enable no-unused-vars */

export interface IWlanStatus {
  bandType: EWlanBandType
  name: string
  password: string
  isOnline: boolean
  isEncrypted: boolean
  isExtending: boolean
}

/**
 * Reflect information from the view to wireless LAN status object
 *
 * @param bandType The type of wireless band
 * @param name The name of hosted AP
 * @param password The password of hosted AP
 * @param statusText The status text from the view
 * @param extendStatusText The extending status text from the view
 * @returns Reformed wireless LAN status object
 */
const getReflectedWlanFromStatus = (
  bandType: EWlanBandType,
  name: string,
  password: string,
  statusText: string,
  extendStatusText: string
) => {
  const result: IWlanStatus = {
    bandType,
    name,
    password,
    isOnline: statusText.includes('동작중'),
    isEncrypted: statusText.includes('암호화 사용'),
    isExtending: !extendStatusText.includes('중단')
  }

  return result
}

/**
 * Get the general status of the router
 *
 * @param instance The got instance to use
 * @returns The general information of the router
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
            tmenu: defaults.services.EServiceCategory.FRAME,
            smenu: 'info'
          })}`
      },
      searchParams: {
        tmenu: defaults.services.EServiceCategory.DATA,
        smenu: defaults.services.EServiceType.SYSTEM_STATUS
      }
    })
    .text()
  const $ = cheerio.load(res)

  const [
    connectionText,
    connectionTypeText,
    externalIpAddress,
    connectionTimeText,
    routerIpAddress,
    dhcpStatusText,
    ipRangeText,
    wlan5gStatusText,
    wlan5gName,
    wlan5gExtendStatusText,
    wlan2gStatusText,
    wlan2gName,
    wlan2gExtendStatusText,
    version,
    externalManagementStatusText,
    ,
    routerUptimeText
  ] = $('td.td_item')
    .toArray()
    .map(el => $(el)
      .text()
      .trim()
      .replace(/[^ㄱ-ㅎ가-힣\w. ]/g, '')
    )
    .filter(line => line.length)

  const isConnected = connectionText.includes('정상적으로 연결')
  const isDynamic = connectionTypeText.includes('동적 IP')
  const isDhcpRunning = dhcpStatusText.includes('동작 중')
  const isRemoteManagementEnabled = !externalManagementStatusText.includes('설정되어 있지 않음')

  // Get wireless LAN data
  const wlan2g = getReflectedWlanFromStatus(
    EWlanBandType.W2,
    wlan2gName,
    $('input#pwValue_wlan0').attr('value') ?? '',
    wlan2gStatusText,
    wlan2gExtendStatusText
  )
  const wlan5g = getReflectedWlanFromStatus(
    EWlanBandType.W5,
    wlan5gName,
    $('input#pwValue_wlan2').attr('value') ?? '',
    wlan5gStatusText,
    wlan5gExtendStatusText
  )

  // Parse given timing texts
  const connectionTime = parseDatetime(connectionTimeText)
  const routerUptime = parseDatetime(routerUptimeText)

  // Reform IP range
  const ipRange = ipRangeText
    .split(' ')
    .map(item => item.trim())
    .filter(item => item.length)

  return {
    version,
    routerIpAddress,
    externalIpAddress,
    wlans: {
      [EWlanBandType.W2]: wlan2g,
      [EWlanBandType.W5]: wlan5g
    },
    connectionTime,
    routerUptime,
    ipRange,
    isConnected,
    isDynamic,
    isDhcpRunning,
    isRemoteManagementEnabled
  }
}
