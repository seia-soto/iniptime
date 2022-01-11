import test from 'ava'
import { CookieJar } from 'tough-cookie'
import {
  auth,
  defaults,
  router
} from '../../src'
import { getLoginOptions } from '../../src/auth'
import { EWlanBandType } from '../../src/router'

const cookieJar = new CookieJar()
const instance = defaults.instance.extend({
  cookieJar
})

test('get information from basic preferences', async t => {
  const loginOptions = await getLoginOptions(instance)

  await auth.setSessionToken(
    cookieJar,
    await auth.getLoginToken(instance, {
      initStatus: loginOptions.initStatus,
      defaultPassword: loginOptions.defaultPassword,
      username: 'admin',
      password: 'password'
    })
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
    'getWlanConfiguration (Guest 1)',
    await router.network.getWlanConfiguration(instance, EWlanBandType.W5, 1)
  )
  t.log(
    'getWlanOptions',
    await router.network.getWlanOptions(instance)
  )
  t.log(
    'getConnectedMacAddresses',
    await router.network.getConnectedMacAddresses(instance)
  )
  t.log(
    'getWpsStatus',
    await router.network.getWpsStatus(instance)
  )

  t.pass()
})
