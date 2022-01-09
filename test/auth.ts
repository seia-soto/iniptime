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

test('getLoginToken', async t => {
  const token = await auth.getLoginToken(instance)

  t.log(token)
  t.is(token.length > 1, true)
})
