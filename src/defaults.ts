import got, { BeforeRequestHook } from 'got'

export namespace hooks {
  export const pretendRefererBeforeRequest: BeforeRequestHook = opts => {
    if (
      opts.headers.referer &&
      typeof opts.headers.referer === 'string' &&
      !opts.headers.referer.startsWith('http:')
    ) {
      opts.headers.referer = new URL(opts.url ?? '').origin + '/' + opts.headers.referer
    }
  }

  export const addHostBeforeRequest: BeforeRequestHook = opts => {
    if (
      !opts.headers.host
    ) {
      opts.headers.host = new URL(opts.url ?? '').host
    }
  }

  export const addOriginBeforeRequest: BeforeRequestHook = opts => {
    if (
      !!opts.body &&
      typeof opts.headers.origin === 'undefined'
    ) {
      opts.headers.origin = new URL(opts.url ?? '').origin
    }
  }
}

export const prefixUrl = 'http://192.168.0.1'

export const instance = got.extend({
  prefixUrl,
  headers: {
    // The following headers are from macOS Chrome 96.0.4664.110 Apple Silicon release
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Cache-Control': 'no-cache',
    Pragma: 'no-cache',
    'User-Agent': 'seia-soto/iniptime controller'
  },
  hooks: {
    beforeRequest: [
      hooks.pretendRefererBeforeRequest,
      hooks.addHostBeforeRequest,
      hooks.addOriginBeforeRequest
    ]
  }
})

export namespace URIs {
  /**
   * The login page of the router
   */
  export const loginView = 'sess-bin/login_session.cgi'

  /**
   * This URL is required to bypass the referer header check system of the router before accessing the login page
   */
  export const loginPreHandle = 'login/login.cgi'

  /**
   * The login function of the router where we required to send login data
   */
  export const loginHandle = 'sess-bin/login_handler.cgi'

  /**
   * The captcha generator of the router
   */
  export const captchaView = 'sess-bin/captcha.cgi'

  /**
   * The authorized main page of the router
   */
  export const mainView = 'sess-bin/login.cgi'

  /**
   * The authorized iframe source of the pages
   */
  export const serviceView = 'sess-bin/timepro.cgi'
}

/* eslint-disable no-unused-vars */
export namespace services {
  export enum EServiceCategory {
    DATA = 'iframe',
    FRAME = 'system',
    NETCONF = 'netconf'
  }

  export enum EServiceType {
    SYSTEM_STATUS = 'system_info_status',
    NETWORK_CONFIG = 'wansetup'
  }
}
/* eslint-enable no-unused-vars */
