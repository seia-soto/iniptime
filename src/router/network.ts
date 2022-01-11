import { Got } from 'got'
import cheerio, { CheerioAPI } from 'cheerio'
import qs from 'qs'
import * as defaults from '../defaults.js'
import { EWlanBandType } from './index.js'

/* eslint-disable no-unused-vars */
export enum EWanMode {
  DYNAMIC = 'dynamic',
  PPPOE = 'pppoe',
  STATIC = 'static'
}
/* eslint-enable no-unused-vars */

/**
 * Get composed string from input element `value` attribute
 *
 * @param $ The selectable CheerioAPI
 * @param selector The selector to use
 * @param delimeter The delimeter to use on serialization
 * @returns The composed text
 */
const getReflectedAddressFromElements = ($: CheerioAPI, selector: string, delimeter: string = '.') => {
  return $(selector)
    .toArray()
    .map(el => cheerio.load(el)('input').attr('value'))
    .join(delimeter)
}

/**
 * Get router network configuration
 *
 * @param instance The got instance to use
 * @returns The network configuration with its type which is included in `.wanMode`
 */
export const getConfiguration = async (
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
        tmenu: defaults.services.EServiceCategory.NETWORK,
        smenu: 'wansetup'
      }
    })
    .text()
  const $ = cheerio.load(res)

  // Set dynamic as default
  const wanMode = $('input[name*="wan_type"]:checked').attr('value') ?? EWanMode.DYNAMIC

  // Get shared metadata
  const wanName = $('input[name*="wan"]').attr('value') ?? 'wan1' // Mostly wan1
  const interfaceName = $('input[name*="ifname"]').attr('value') ?? 'eth1' // Mostly eth1
  const isPasswordDisabled = $('input[name*="nopassword"]').attr('value') === '1'

  switch (wanMode) {
    case EWanMode.DYNAMIC: {
      // The ip addresses have dedicated settings
      const externalIp = getReflectedAddressFromElements($, 'input[id*="disabled_dynamicip"]')
      const subnetMask = getReflectedAddressFromElements($, 'input[id*="disabled_dynamicsm"]')
      const gateway = getReflectedAddressFromElements($, 'input[id*="disabled_dynamicgw"]')

      const dns = {
        primary: getReflectedAddressFromElements($, 'input[name*="fdns_dynamic"]'),
        secondary: getReflectedAddressFromElements($, 'input[name*="sdns_dynamic"]')
      }

      const mac = getReflectedAddressFromElements($, 'input[name*="hw_dynamic"]', ':')

      const mtu = $('input[name*="mtu.dynamic"]').attr('value') ?? 1500

      // For user preference, these fields requires to be `checked` manually
      const isPrivateIpAllowed = $('input[name*="allow_private"]:checked').length > 0
      const isManualDnsSet = $('input[name*="dns_dynamic_chk"]:checked').length > 0
      const isManualMacSet = $('input[id*="macchk_dynamic"]:checked').length > 0
      const isManualMtuSet = $('input[id*="mtuchk_mtu.dynamic"]:checked').length > 0

      return {
        wanMode: EWanMode.DYNAMIC,
        wanName,
        interfaceName,
        externalIp,
        subnetMask,
        gateway,
        dns,
        mac,
        mtu,
        isPrivateIpAllowed,
        isManualDnsSet,
        isManualMacSet,
        isManualMtuSet,
        isPasswordDisabled
      }
    }
    case EWanMode.PPPOE: {
      console.warn('Currently reading configuration from PPPoE wan mode is not supported!')

      return {
        wanMode: EWanMode.PPPOE,
        wanName,
        interfaceName
      }
    }
    case EWanMode.STATIC: {
      console.warn('Currently reading configuration from static wan mode is not supported!')

      return {
        wanMode: EWanMode.STATIC,
        wanName,
        interfaceName
      }
    }
  }
}

/**
 * Get wireless LAN specification tags
 *
 * @param instance The got instance to use
 * @returns The available wireless LAN specification tags
 */
export const getWlanOptions = async (
  instance: Got = defaults.instance
) => {
  const res = await instance
    .get(defaults.URIs.serviceView, {
      headers: {
        // Referer check is present on the system
        referer: defaults.URIs.serviceView +
          `?${qs.stringify({
            tmenu: defaults.services.EServiceCategory.WIRELESS,
            smenu: 'basicsetup'
          })}`
      },
      searchParams: {
        tmenu: defaults.services.EServiceCategory.DATA,
        smenu: 'extendsetup'
      }
    })
    .text()
  const specs = []
  const channelWidths = []

  const bandTypeMap = {
    2: EWlanBandType.W2,
    5: EWlanBandType.W5
  }

  // Get available wireless options
  let pattern = /options(\d)g\[\d+\] = {'value':'(\d+)', 'text':'([\w,]+)'}/g
  let match

  for (;;) {
    match = pattern.exec(res)

    if (match === null) {
      break
    }

    const [, bandType, identifier, text] = match

    specs.push({
      bandType: bandTypeMap[Number(bandType) as 2 | 5],
      identifier,
      text
    })
  }

  // Get available channel widths
  pattern = /chanwidth(\d)g\[\d+\] = {'value':'(\d+)', 'text':'([\w ,]+)'}/g

  for (;;) {
    match = pattern.exec(res)

    if (match === null) {
      break
    }

    const [, bandType, identifier, text] = match

    channelWidths.push({
      bandType: bandTypeMap[Number(bandType) as 2 | 5],
      identifier,
      text
    })
  }

  return {
    specs,
    channelWidths
  }
}

// 0 for default network, and 1 to 5 for guest networks
export type TWlanIndex = 0 | 1 | 2 | 3 | 4 | 5

/**
 * Get wireless configuration
 *
 * @param instance The got instance to use
 * @param bandType The band type of wireless LAN
 * @param wlanIndex The index of hosted wlan, 0 for default network, and 1 to 5 for guest networks
 * @returns The wireless configuration
 */
export const getWlanConfiguration = async (
  instance: Got = defaults.instance,
  bandType: EWlanBandType = EWlanBandType.W2,
  wlanIndex: TWlanIndex = 0
) => {
  // The following data is shared
  const sharedPayload = {
    tmenu: defaults.services.EServiceCategory.DATA,
    smenu: 'hiddenwlsetup',
    // Actually, 2.4GHz configuration fetched with POST request but seems like the system is merging post params and query params
    wlmode: {
      [EWlanBandType.W2]: 0,
      [EWlanBandType.W5]: 1
    }[bandType]
  }

  // Define dynamic variables
  let method: 'get' | 'post' = 'get'
  let body: string | undefined

  if (wlanIndex > 0) {
    // Use POST instead of GET
    method = 'post'

    // Inject additional data for guest network query
    body = qs.stringify({
      // Add shared payload
      ...sharedPayload,
      action: 'changebssid',
      sidx: wlanIndex,
      uiidx: wlanIndex
    })
  }

  const res = await instance[method](defaults.URIs.serviceView, {
    headers: {
      // Referer check is present on the system
      referer: defaults.URIs.serviceView +
        `?${qs.stringify({
          tmenu: defaults.services.EServiceCategory.WIRELESS,
          smenu: 'basicsetup'
        })}`
    },
    // There is no problem to remove shared payload on guest network request
    searchParams: sharedPayload,
    body
  })
    .text()
  const $ = cheerio.load(res)

  const ssid = $('input[name*="ssid"]').attr('value') ?? ''
  const activeSpecificationIdentifier = $('input[name*="wirelessmode"]').attr('value') ?? ''
  const controlChannel = $('input[name*="ctlchannel"]').attr('value') ?? ''
  const centralChannel = $('input[name*="cntchannel"]').attr('value') ?? ''
  const encryption = $('input[name*="personallist"]').attr('value') ?? ''
  const password = $('input[name*="wpapsk"]').attr('value') ?? ''
  const txPower = Number($('input[name*="txpower"]').attr('value')) / 100 // Zero to one
  const beaconInterval = Number($('input[name*="beacon"]').attr('value')) ?? 100
  const country = $('input[name*="country"]').attr('value') ?? 'KR' // Default to KR, KR | US | EU
  const channelWidth = $('input[name*="channelwidth"]').attr('value') ?? ''
  const actualChannelWidth = $('input[name*="realchanwidth"]').attr('value') ?? ''

  const index = $('input[name*="sidx"]').attr('value') ?? 0 as TWlanIndex
  const uiIndex = $('input[name*="uiidx"]').attr('value') ?? 0 as TWlanIndex

  const isDfsSensoredChannel = $('input[name*="dfswarning"]').attr('value') === '1'
  const isBroadcasting = $('input[name*="broadcast"]').attr('value') === '1'
  const isLdpcEnabled = $('input[name*="ldpc"]').attr('value') === '1'

  return {
    bandType,
    ssid,
    activeSpecificationIdentifier,
    controlChannel,
    centralChannel,
    encryption,
    password,
    txPower,
    beaconInterval,
    country,
    channelWidth,
    actualChannelWidth,
    index,
    uiIndex,
    isDfsSensoredChannel,
    isBroadcasting,
    isLdpcEnabled
  }
}

/**
 * Get connected clients' IP and mac address
 *
 * @param instance The got instance to use
 * @returns The array of connected IP and Mac address
 */
export const getConnectedMacAddresses = async (
  instance: Got = defaults.instance
) => {
  const res = await instance
    .post(defaults.URIs.serviceView, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        // Referer check is present on the system
        referer: defaults.URIs.serviceView +
          `?${qs.stringify({
            tmenu: defaults.services.EServiceCategory.NETWORK,
            smenu: 'netconfmacsearch'
          })}`
      },
      body: qs.stringify({
        tmenu: defaults.services.EServiceCategory.DATA,
        smenu: 'netconfmacsearch',
        inputprefix: 'hw_dynamic',
        act: 'refresh'
      })
    })
    .text()

  const results: {
    mac: string
    ip: string
  }[] = []

  // Grep IP addresses
  let pattern = /">(\d+\.[\d.]+)/g
  let match

  for (;;) {
    match = pattern.exec(res)

    if (match === null) {
      break
    }

    const [, ip] = match

    results.push({
      mac: '',
      ip
    })
  }

  // Grep mac addresses
  pattern = /SelectMacFromPopup\(\\'hw_dynamic\\', \\'([\dA-F-]+)/g

  for (let i = 0; true; i++) {
    match = pattern.exec(res)

    if (match === null) {
      break
    }

    const [, mac] = match

    if (results[i]) {
      results[i].mac = mac
    }
  }

  return results
}

/**
 * Get WPS and DFS status of WLANs
 *
 * @param instance The got instance to use
 * @returns The WPS and DFS status
 */
export const getWpsStatus = async (
  instance: Got = defaults.instance
) => {
  const res = await instance
    .get(defaults.URIs.serviceView, {
      headers: {
        // Referer check is present on the system
        referer: defaults.URIs.serviceView
      },
      searchParams: {
        tmenu: defaults.services.EServiceCategory.DATA,
        smenu: 'wlstatus'
      }
    })
    .text()
  const $ = cheerio.load(res)

  // Second to ms transition
  const wlan5gWpsStatus = $('input[name*="statusval5g"]').attr('value')
  const wlan5gDfsStatus = $('input[name*="dfs_stat5g"]').attr('value')
  const wlan5gDfsScanTimeLeft = Number($('input[name*="dfs_remain5g"]').attr('value')) * 1000
  const wlan5gWpsActiveTimeLeft = Number($('input[name*="remaintime5g"]').attr('value')) * 1000
  const wlan2gWpsStatus = $('input[name*="statusval2g"]').attr('value')
  const wlan2gDfsStatus = $('input[name*="dfs_stat2g"]').attr('value')
  const wlan2gDfsScanTimeLeft = Number($('input[name*="dfs_remain2g"]').attr('value')) * 1000
  const wlan2gWpsActiveTimeLeft = Number($('input[name*="remaintime2g"]').attr('value')) * 1000

  const isWlan5gOnline = $('input[name*="run5g"]').attr('value') === '1'
  const isWlan2gOnline = $('input[name*="run2g"]').attr('value') === '1'

  return {
    [EWlanBandType.W2]: {
      wps: {
        status: wlan2gWpsStatus,
        activeTimeLeft: wlan2gWpsActiveTimeLeft
      },
      dfs: {
        status: wlan2gDfsStatus,
        scanTimeLeft: wlan2gDfsScanTimeLeft
      },
      isOnline: isWlan2gOnline
    },
    [EWlanBandType.W5]: {
      wps: {
        status: wlan5gWpsStatus,
        activeTimeLeft: wlan5gWpsActiveTimeLeft
      },
      dfs: {
        status: wlan5gDfsStatus,
        scanTimeLeft: wlan5gDfsScanTimeLeft
      },
      isOnline: isWlan5gOnline
    }
  }
}

/**
 * Send WPS action request
 *
 * @param instance The got instance to use
 * @param bandType The band type to send WPS request
 * @param action The action
 * @returns True if status code is 200
 */
export const setWpsStatus = async (
  instance: Got = defaults.instance,
  bandType: EWlanBandType,
  action: 'start' | 'stop'
) => {
  const res = await instance
    .post(defaults.URIs.serviceView, {
      headers: {
        'content-type': 'application/x-www-form-urlencoded',
        // Referer check is present on the system
        referer: defaults.URIs.serviceView
      },
      body: qs.stringify({
        tmenu: defaults.services.EServiceCategory.DATA,
        smenu: 'wpssubmit',
        wlmode: {
          [EWlanBandType.W2]: '2g',
          [EWlanBandType.W5]: '5g'
        }[bandType],
        act: action
      })
    })

  return res.statusCode === 200
}
