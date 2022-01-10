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

We're currently supporting following features:

- [x] Unauthorized scope
  - [x] Login (`auth.getLoginToken`)
    - [x] Login with credentials
    - [x] Login with captcha (`auth.getCaptchaImage`)
  - [x] Router metadata (`auth.getLoginOptions`, `auth.getCaptchaOptions`)
    - [x] Name
    - [x] Version
    - [x] SKU Identifier
    - [x] Initialization status
    - [x] Captcha status
- [ ] Authorized scope
  - [ ] Entry page (`router.getBriefing`)
    - [x] External IP and connection summary of router
    - [x] Version of router
    - [ ] Result of ipTIME scanner
  - [ ] Setup wizard
    - *Not targeted, yet*
  - [ ] Administration utilities
    - [ ] Basic settings
      - [ ] System summary (`router.getStatus`)
        - [x] Network connection uptime and status
        - [x] Hosted primary WLAN name and status
        - [x] DHCP server status and internal IP range
        - [x] System uptime and version
        - [ ] Remote management status and port
      - [x] Internet connection settings (`router.network.getConfiguration`)
        - [x] Type of connection and status (*Dynamic wan mode only supported, yet*)
        - [x] External IP and connection metadata
        - [x] MAC address search result from local network (`router.network.getConnectedMacAddresses`)
      - [ ] Wireless AP settings (`router.network.getWlanConfiguration`, `router.network.getWlanOptions`)
        - [x] Wireless AP status and metadata
        - [x] 2GHz advanced settings
        - [x] 5GHz advanced settings
        - [ ] Guest network controls
        - [ ] WPS controls
        - [ ] 802.1x security controls
        - [ ] Result of network channel scanner
      - [ ] Firmware settings
        - [ ] Current firmware metadata
        - [ ] Automatic upgrade
        - [ ] Upgrade with file
      - [ ] Easy Mesh wizard
        - *Not targeted, yet*
    - [ ] Advanced settings
      - [ ] Network management
        - Internet connection settings (*Included in basic settings*)
        - [ ] Internal network management
          - [ ] NAT controls and router network metadata
          - [ ] Hub/AP Mode gateway
          - [ ] IP address usage
        - [ ] DHCP server management
          - [ ] DHCP server status and assigned IPs
          - [ ] IP assignment and client controls
          - [ ] Result of current client scanner
          - [ ] Manual MAC address registration
      - [ ] Wireless LAN management
        - Wireless AP settings (*Included in basic settings*)
        - [ ] Wireless extending settings
          - [ ] Result of AP scanner
          - *Additional features are not targeted, yet*
        - [ ] MAC address management
          - [ ] Result of client scanner
          - [ ] Manual MAC address registration of MAC address filter
        - Easy Mesh wizard (*Included in basic settings*)
      - [ ] NAT and router management
        - [ ] Port-forwarding
          - [ ] Backup and restore
          - [ ] Manual setup of port-forwarding
          - [ ] Read current setup
        - [ ] Advanced NAT settings
        - [ ] Routing table
          - [ ] Manual setup of routing table
          - [ ] Read current setup
      - [ ] Securities
        - [ ] Internet and AP usage restrictions
          - *Not targeted, yet*
        - [ ] Router administrative panel ACL
          - [ ] Panel ACL
          - [ ] Advanced security settings
      - [ ] Special features
        - [ ] VPN server settings
          - [ ] PPTP/L2TP service controls
          - [ ] Account controls
          - [ ] Read current connections
        - [ ] DDNS settings
          - [ ] DDNS registration status
          - [ ] DDNS registration
        - [ ] Wake on LAN
          - [ ] Result of wired connection scanner
          - [ ] Manual setup of WOL device
        - [ ] Host search
          - *Not targeted, yet*
        - [ ] Announcements and advertisements
          - *Not targeted, yet*
        - [ ] IPTV settings
        - [ ] Gaming VPN
          - *Not targeted, yet*
      - [ ] Traffic management
        - [ ] QoS
          - [ ] QoS modes and preferences
          - [ ] QoS rule controls
        - [ ] Connection information
        - [ ] Connection controls
          - *Not targeted, yet*
        - [ ] Wired link settings
          - [ ] Port status
          - [ ] Traffic statistics
          - [ ] Manual link controls
        - [ ] Switch settings
      - [ ] System management
        - [ ] Logs
          - [ ] Read logs
          - [ ] Log service controls
        - [ ] Administrator settings
          - *Not targeted, yet*
        - [ ] Firmware settings (*Included in basic settings*)
        - [ ] SNMP settings
          - *Not targeted, yet*
        - [ ] ETC
      - [ ] USB/Service management
        - *Not targeted, yet*

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
