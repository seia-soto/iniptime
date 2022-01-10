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

test('getLoginOptions', async t => {
  const opts = await auth.getLoginOptions(instance)

  t.log(opts)
  t.is(opts.routerIdentifier.length > 0, true)
})
