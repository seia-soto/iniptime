import got from 'got'

export const host = '192.168.0.1'
export const prefixUrl = `http://${host}` // proto + host

export const instance = got.extend({
  prefixUrl,
  headers: {
    // The following headers are from macOS Chrome 96.0.4664.110 Apple Silicon release
    Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    'Cache-Control': 'no-cache',
    Host: host, // Host check is present on the system
    Pragma: 'no-cache',
    'User-Agent': 'seia-soto/iniptime controller'
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
}
