import { Got } from 'got'
import cheerio from 'cheerio'
import * as defaults from './defaults.js'

/**
 * Get available metadata from router login page
 *
 * @param instance The got instance to use
 * @param host The host of router
 * @returns Publicated router metadata you can see when you try to login
 */
export const getLoginOptions = async (
  instance: Got = defaults.instance,
  host: string = defaults.host
) => {
  const res = await instance
    .get(defaults.URIs.loginView, {
      headers: {
        Host: host,
        // Referer check is present on the system
        Referer: `http://${host}/${defaults.URIs.loginPreHandle}`
      },
      searchParams: {
        noauto: 1 // This parameter is optional by default but if the router detects us as a bot, it redirects to `?noauto=1` URL.
      }
    })
    .text()
  const $ = cheerio.load(res, {
    lowerCaseTags: true
  })

  // Extract the router product identifier by using the logo image
  const identifierMatch = /images2\/login_title\.(\w+)\.gif/.exec($('img[src*="login_title"]').attr('src') ?? '')

  const result = {
    routerName: $('title').text(), // Router name is set to title
    routerIdentifier: identifierMatch?.[1] ?? '',
    initStatus: $('input[name="init_status"]').attr('value'), // Not sure yet
    defaultPassword: $('input[name="default_passwd"]').attr('value'), // Not important but exists
    isCaptchaEnabled: $('input[name="captcha_on"]').attr('value') === '1' // Determines if captcha challenge is required
  }

  return result
}

/**
 * Get unique captcha identifier and URL to the image
 *
 * @param instance The got instance to use
 * @param host The host of router
 * @returns The UID of captcha image and URL to the image source URL
 */
export const getCaptchaImage = async (
  instance: Got = defaults.instance,
  host: string = defaults.host
) => {
  const res = await instance
    .get(defaults.URIs.captchaView, {
      headers: {
        Host: host,
        // Referer check is present on the system
        Referer: `http://${host}/${defaults.URIs.loginView}`
      }
    })
    .text()
  const $ = cheerio.load(res)

  const token = $('input[name="captcha_file"]').attr('value') // This represents unique captcha identifier
  const imageURL = `http://${host}${$('img').attr('src')}` // Prepand host to the image source

  return {
    token,
    imageURL
  }
}
