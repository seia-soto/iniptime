import { add } from 'date-fns'

/* eslint-disable no-unused-vars */
export enum EDateUnits {
  SECONDS = 'seconds',
  MINUTES = 'minutes',
  HOURS = 'hours',
  DAYS = 'days'
}
/* eslint-enable no-unused-vars */

/**
 * Parse ipTIME style date-time text
 *
 * @param text The ipTIME styled date-time text
 * @param units The localized units to map, Korean would be used by default
 * @returns JavaScript style date in number (ms)
 */
export const parseDatetime = (
  text: string,
  units: {
    [keys: string]: EDateUnits
  } = {
    일: EDateUnits.DAYS,
    시간: EDateUnits.HOURS,
    분: EDateUnits.MINUTES,
    초: EDateUnits.SECONDS
  }
) => {
  const mapper = {
    [EDateUnits.SECONDS]: 0,
    [EDateUnits.MINUTES]: 0,
    [EDateUnits.HOURS]: 0,
    [EDateUnits.DAYS]: 0
  }
  const pattern = /(\d+) ([가-힣]+)/g
  let match

  for (;;) {
    match = pattern.exec(text)

    if (match === null) {
      break
    }

    const [, _quantity, unit] = match
    const quantity = Number(_quantity)

    if (isNaN(quantity)) {
      continue
    }

    mapper[units[unit]] = quantity
  }

  return add(new Date(0), mapper).getTime()
}
