import test from 'ava'
import { CookieJar } from 'tough-cookie'
import {
  auth,
  defaults,
  router
} from '../src'

const cookieJar = new CookieJar()
const instance = defaults.instance.extend({
  cookieJar
})

test('getBriefing', async t => {
  // login
  await auth.setSessionToken(
    cookieJar,
    await auth.getLoginToken(instance)
  )

  const brief = await router.getBriefing(instance)

  t.log(brief)
  t.pass()
})
