import * as auth from './auth.js'

test('fetching public router data', async () => {
  const result = await auth.getLoginOptions()

  expect(Object.keys(result)).toEqual(expect.arrayContaining([
    'routerName',
    'routerIdentifier',
    'initStatus',
    'defaultPassword',
    'isCaptchaEnabled'
  ]))
})

test('fetching captcha data', async () => {
  const result = await auth.getCaptchaImage()

  expect(Object.keys(result)).toEqual(expect.arrayContaining([
    'token',
    'imageURL'
  ]))
})
