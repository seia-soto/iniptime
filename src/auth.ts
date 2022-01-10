import cheerio from 'cheerio'
import { Got } from 'got'
import { CookieJar } from 'tough-cookie'
import qs from 'qs'
import * as defaults from './defaults.js'

/**
 * Get available metadata from router login page
 *
 * @param instance The got instance to use
 * @returns Publicated router metadata you can see when you try to login
 */
export const getLoginOptions = async (
  instance: Got = defaults.instance
) => {
  const res = await instance
    .get(defaults.URIs.loginView, {
      headers: {
        // Referer check is present on the system
        referer: defaults.URIs.loginPreHandle
      },
      searchParams: {
        noauto: 1 // This parameter is optional by default but if the router detects us as a bot, it redirects to `?noauto=1` URL.
      }
    })
    .text()
  const $ = cheerio.load(res, {
    lowerCaseTags: true
  })

  // Extract shared data
  const routerName = $('title').text()

  // Extract the router product identifier by using the logo image
  const identifierMatch = /images2\/login_title\.(\w+)\.gif/.exec($('img[src*="login_title"]').attr('src') ?? '')
  const routerIdentifier = identifierMatch?.[1] ?? ''

  return {
    routerName,
    routerIdentifier,
    initStatus: Number($('input[name="init_status"]').attr('value')) ?? 1, // If the router is initialized
    defaultPassword: $('input[name="default_passwd"]').attr('value') ?? '', // Not important but exists
    isCaptchaEnabled: $('input[name="captcha_on"]').attr('value') === '1' // Determines if captcha challenge is required
  }
}

/**
 * Get unique captcha identifier and URL to the image
 *
 * @param instance The got instance to use
 * @returns The UID of captcha image and URL to the image source URL
 */
export const getCaptchaImage = async (
  instance: Got = defaults.instance
) => {
  const res = await instance
    .get(defaults.URIs.captchaView, {
      headers: {
        // Referer check is present on the system
        referer: defaults.URIs.loginView
      }
    })
    .text()
  const $ = cheerio.load(res)

  const token = $('input[name="captcha_file"]').attr('value') // This represents unique captcha identifier
  const imageURL = $('img').attr('src') // Prepand host to the image source

  return {
    token,
    imageURL
  }
}

export interface ILoginOptions {
  initStatus: number
  username: string
  password: string
  defaultPassword: string
  // Captcha-related
  captcha?: {
    token: string
    code: string
  }
}

/**
 * Get authorized session token by sending login request
 *
 * @param instance The got instance to use
 * @param options The login option including username and password
 * @returns The token string which can be applied to `esm_session_id` cookie
 */
export const getLoginToken = async (
  instance: Got = defaults.instance,
  options: ILoginOptions = {
    initStatus: 1,
    username: 'admin',
    password: 'admin',
    defaultPassword: '초기암호:admin(변경필요)'
  }
) => {
  if (!options) {
    throw new Error('Login option was not provided!')
  }

  const body = {
    init_status: options.initStatus,
    captcha_on: 0,
    captcha_file: '',
    username: options.username,
    passwd: options.password,
    default_passwd: options.defaultPassword,
    captcha_code: ''
  }

  // Set captcha mode
  if (options.captcha) {
    body.captcha_on = 1
    body.captcha_file = options.captcha.token
    body.captcha_code = options.captcha.code
  }

  // They doesn't give any signal to determine if login failed
  const res = await instance
    .post(defaults.URIs.loginHandle, {
      headers: {
        // Referer check is present on the system
        referer: `${defaults.URIs.loginView}?noauto=1`,
        'content-type': 'application/x-www-form-urlencoded'
      },
      body: qs.stringify(body)
    })
    .text()

  const tokenMatch = /setCookie\(['"](\w+)['"]\)/.exec(res)
  const token = tokenMatch?.[1] ?? ''

  return token
}

/**
 * Set login token to cookieJar
 *
 * @param cookieJar The cookieJar to be set
 * @param token The token to set
 * @param url The url to be applied
 * @returns Updated cookieJar with token
 */
export const setSessionToken = async (cookieJar: CookieJar, token: string, url: string = 'http://192.168.0.1/') => {
  await cookieJar.setCookie(`efm_session_id=${token}`, url)

  return cookieJar
}
