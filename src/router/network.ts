import { Got } from 'got'
import cheerio, { CheerioAPI } from 'cheerio'
import qs from 'qs'
import * as defaults from '../defaults.js'

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
        tmenu: defaults.services.EServiceCategory.NETCONF,
        smenu: defaults.services.EServiceType.NETWORK_CONFIG
      }
    })
    .text()
  const $ = cheerio.load(res)

  // Set dynamic as default
  const wanMode = $('input[name*="wan_type"]:checked').attr('value') ?? EWanMode.DYNAMIC

  // Get shared metadata
  const wanName = $('input[name*="wan"]').attr('value') // Mostly wan1
  const interfaceName = $('input[name*="ifname"]').attr('value') // Mostly eth1
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

      const mtu = $('input[name*="mtu.dynamic"]').attr('value')

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
