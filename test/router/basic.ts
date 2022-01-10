import test from 'ava'
import { CookieJar } from 'tough-cookie'
import {
  auth,
  defaults,
  router
} from '../../src'
import { EWlanBandType } from '../../src/router'

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
  t.log(
    `getWlanConfiguration (${EWlanBandType.W2})`,
    await router.network.getWlanConfiguration(instance, EWlanBandType.W2)
  )
  t.log(
    `getWlanConfiguration (${EWlanBandType.W5})`,
    await router.network.getWlanConfiguration(instance, EWlanBandType.W5)
  )
  t.log(
    'getWlanOptions',
    await router.network.getWlanOptions(instance)
  )
  t.log(
    'getConnectedMacAddresses',
    await router.network.getConnectedMacAddresses(instance)
  )

  t.pass()
})
