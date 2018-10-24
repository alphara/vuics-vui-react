import { logMessage } from '../utils/log'

class Synthesizer {
  constructor ({
    voiceIndex = 0,
    pitch = 1,
    rate = 1,
    onSpeechStart = () => {},
    onSpeechEnd = () => {},
    onSpeechError = () => {}
  } = {}) {
    this.voiceIndex = voiceIndex
    this.pitch = pitch
    this.rate = rate

    this.onSpeechStart = onSpeechStart
    this.onSpeechEnd = onSpeechEnd
    this.onSpeechError = onSpeechError

    this._onVoicesChanged = this._onVoicesChanged.bind(this)
    this.changeVoiceIndex = this.changeVoiceIndex.bind(this)
    this.changePitch = this.changePitch.bind(this)
    this.changeRate = this.changeRate.bind(this)
    this.speak = this.speak.bind(this)

    this.voices = []
    this.synth = window.speechSynthesis

    if (this.synth) {
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = this._onVoicesChanged
      }

      this._onVoicesChanged()
    } else {
      logMessage('SpeechSynthezis does not supported by your browser!')
    }
  }

  isSynthesizerSupported () {
    return !!this.synth
  }

  _onVoicesChanged () {
    this.voices = this.synth.getVoices()
  }

  changeVoiceIndex (index) {
    this.voiceIndex = index
  }

  changePitch (pitch) {
    this.pitch = pitch
  }

  changeRate (rate) {
    this.rate = rate
  }

  speak ({ phrase = '', onSpeechStart = () => {}, onSpeechEnd = () => {}, onSpeechError = () => {} }) {
    this.onSpeechStart()
    onSpeechStart()

    if (this.synth.speaking) {
      console.error('Synthesizer is already speaking.')
      return
    }

    const speech = new window.SpeechSynthesisUtterance(phrase)

    speech.onend = (e) => {
      this.onSpeechEnd(e)
      onSpeechEnd(e)
    }

    speech.onerror = (e) => {
      this.onSpeechError(e)
      onSpeechError(e)
    }

    speech.voice = this.voices[this.voiceIndex]
    speech.pitch = this.pitch
    speech.rate = this.rate

    this.synth.speak(speech)
  }
}

export function generateSyntesizer (options) {
  return new Synthesizer(options)
}

export default Synthesizer
