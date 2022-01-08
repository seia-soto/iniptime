import test from 'ava'
import { CookieJar } from 'tough-cookie'
import {
  auth,
  defaults
} from '../src'

const cookieJar = new CookieJar()
const instance = defaults.instance.extend({
  cookieJar
})

test('getLoginOptions<UNAUTHORIZED>', async t => {
  const opts = await auth.getLoginOptions(instance)

  t.log(opts)
  t.is(opts.routerIdentifier.length > 0, true)
})

test('getLoginToken', async t => {
  const token = await auth.getLoginToken(instance)

  t.log(token)
  t.is(token.length > 1, true)
})
