import settings from './vui/settings'

export {
  default as Vuics,
  Consumer
} from './provider'

export {
  default as ButtonDefault
} from './button'

export {
  default as Oscilloscope
} from './oscilloscope'

export const initVuics = ({ apiKey, apiUrl }) => {
  console.log('init')
  if (apiKey) {
    settings.apiKey = apiKey
  }
  if (apiUrl) {
    settings.apiUrl = apiUrl
  }
}
