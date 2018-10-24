import {
  setApiKey,
  setApiUrl
} from './vui/settings'

export {
  default as VuicsProvider,
  Consumer as VuicsConsumer
} from './provider'

export {
  default as ButtonDefault
} from './button'

export {
  default as Oscilloscope
} from './oscilloscope'

export {
  Synthesizer,
  Recognizer
} from './speech'

export const initVuics = ({ apiKey, apiUrl }) => {
  console.log('init')
  if (apiKey) {
    setApiKey(apiKey)
  }
  if (apiUrl) {
    setApiUrl(apiUrl)
  }
}
