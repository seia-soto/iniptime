import anyTest, { TestFn } from 'ava'
import { Got } from 'got'
import { CookieJar } from 'tough-cookie'
import {
  auth,
  defaults,
  router
} from '../../src'
import { getLoginOptions } from '../../src/auth'
import { EWlanBandType } from '../../src/router'
import { TWlanIndex } from '../../src/router/network'

interface IExecutionContext {
  instance: Got
}

const test = anyTest as TestFn<IExecutionContext>

test.beforeEach('get authorized client', async t => {
  const cookieJar = new CookieJar()
  const instance = defaults.instance.extend({
    cookieJar
  })

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

  t.context.instance = instance
})

test('router', async t => {
  t.log(
    'getBriefing',
    await router.getBriefing(t.context.instance)
  )
  t.log(
    'getStatus',
    await router.getStatus(t.context.instance)
  )

  t.pass()
})

test('router.network', async t => {
  t.log(
    'getConfiguration',
    await router.network.getConfiguration(t.context.instance)
  )
  t.log(
    `getWlanConfiguration (${EWlanBandType.W2})`,
    await router.network.getWlanConfiguration(t.context.instance, EWlanBandType.W2)
  )
  t.log(
    `getWlanConfiguration (${EWlanBandType.W5})`,
    await router.network.getWlanConfiguration(t.context.instance, EWlanBandType.W5)
  )

  for (let i = 1; i <= 3; i++) {
    t.log(
      `getWlanConfiguration (${EWlanBandType.W2} — Guest ${i})`,
      await router.network.getWlanConfiguration(t.context.instance, EWlanBandType.W2, i as TWlanIndex)
    )
  }
  for (let i = 1; i <= 3; i++) {
    t.log(
      `getWlanConfiguration (${EWlanBandType.W5} — Guest ${i})`,
      await router.network.getWlanConfiguration(t.context.instance, EWlanBandType.W5, i as TWlanIndex)
    )
  }

  t.log(
    'getWlanOptions',
    await router.network.getWlanOptions(t.context.instance)
  )
  t.log(
    'getConnectedMacAddresses',
    await router.network.getConnectedMacAddresses(t.context.instance)
  )
  t.log(
    'getWpsStatus',
    await router.network.getWpsStatus(t.context.instance)
  )

  t.pass()
})

test('firmware', async t => {
  t.log(
    'getStatus',
    await router.firmware.getStatus(t.context.instance)
  )
  t.log(
    'getRemoteStatus',
    await router.firmware.getRemoteStatus(t.context.instance)
  )

  t.pass()
})
