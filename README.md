# iniptime

A JavaScript compatible ipTIME router controllable interface library.

## Table of Contents

- [TypeDoc](https://iniptime.seia.io)
- [Usage](#usage)
- [Environment](#environment)
- [LICENSE](#license)

# Environment

Note that I build this library with following router:

- `ax3004i` (EFM ipTIME ax3004ITL)
- v14.11.0 from official channel

# Usage

## Authentication

ipTIME routers support two authentication method: `HTTP Basic Auth` and `Session`.

### HTTP Basic Auth

You can extend default `got` instance from `iniptime.defaults` module to apply router username and password.

```ts
import { defaults } from 'iniptime'

const instance = defaults.instance.extend({
  username: '',
  password: ''
})
```

### Session

`iniptime` supports session authentication with `got` and `tough-cookie` library.

**Session with default credentials**

```ts
import { CookieJar } from 'tough-cookie'
import { auth, defaults } from 'iniptime'

const cookieJar = new CookieJar()
const instance = defaults.instance.extend({
  cookieJar
})

const loginOptions = await auth.getLoginToken(instance)

// Update session cookie with `auth.setSessionToken`.
await auth.setSessionToken(
  cookieJar,
  await auth.getLoginToken(instance) // Use default option for token generation.
)
```

**Session with username and password**

```ts
import { CookieJar } from 'tough-cookie'
import { auth, defaults } from 'iniptime'

const cookieJar = new CookieJar()
const instance = defaults.instance.extend({
  cookieJar
})

const loginOptions = await auth.getLoginToken(instance)

// Update session cookie with `auth.setSessionToken`.
await auth.setSessionToken(
  cookieJar,
  await auth.getLoginToken(instance, {
    initStatus: loginOptions.initStatus,
    'username',
    'password',
    defaultPassword: loginOptions.defaultPassword
  })
)
```

**Session with captcha**

```ts
import { CookieJar } from 'tough-cookie'
import { auth, defaults } from 'iniptime'

const cookieJar = new CookieJar()
const instance = defaults.instance.extend({
  cookieJar
})

const loginOptions = await auth.getLoginToken(instance)

if (!loginOptions.isCaptchaEnabled) {
  throw new Error('Captcha is not enabled!')
}

// Get image URL from the router.
const {
  token,
  imageURL // /captcha/TOKEN.gif
} = await auth.getCaptchaImage(instance)

// Update session cookie with `auth.setSessionToken`.
await auth.setSessionToken(
  cookieJar,
  await auth.getLoginToken(instance, {
    initStatus: loginOptions.initStatus,
    'username',
    'password',
    defaultPassword: loginOptions.defaultPassword,
    // Provide captcha information.
    captcha: {
      token,
      code: '' // Put solved captcha-code here.
    }
  })
)
```

# LICENSE

I am not associated with EFM networks or any firms while building this library.

```
MIT License Copyright 2021 HoJeong Go

Permission is hereby granted, free of
charge, to any person obtaining a copy of this software and associated
documentation files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use, copy, modify, merge,
publish, distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice
(including the next paragraph) shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF
ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR
OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
```
