import test from 'ava'
import { CookieJar } from 'tough-cookie'
import {
  auth,
  defaults,
  router
} from '../../src'

const cookieJar = new CookieJar()
const instance = defaults.instance.extend({
  cookieJar
})

test('get information from basic preferences', async t => {
  // login
  await auth.setSessionToken(
    cookieJar,
    await auth.getLoginToken(instance)
  )

  t.log(
    'getBriefing',
    await router.getBriefing(instance)
  )
  t.log(
    'getStatus',
    await router.getStatus(instance)
  )
  t.log(
    'getConfiguration',
    await router.network.getConfiguration(instance)
  )

  t.pass()
})
