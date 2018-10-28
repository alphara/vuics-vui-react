import AudioControl from './control'
import settings from './settings'
import axios from 'axios'

const DEFAULT_CONTENT_TYPE = 'audio/x-l16; sample-rate=16000'
const DEFAULT_USER_ID = 'userId';
const DEFAULT_ACCEPT_HEADER_VALUE = 'audio/mpeg'
const MESSAGES = Object.freeze({
  PASSIVE: 'Passive',
  LISTENING: 'Listening',
  SENDING: 'Sending',
  SPEAKING: 'Speaking'
})

const applyDefaults = ({
  silenceDetection = true,
  name = '',
  contentType = DEFAULT_CONTENT_TYPE,
  userId = DEFAULT_USER_ID,
  accept = DEFAULT_ACCEPT_HEADER_VALUE
} = {}) => ({
  silenceDetection,
  name,
  contentType,
  userId,
  accept
})

const bufferToArrayBuffer = ({ data }) => {
  const ab = new ArrayBuffer(data.length)

  const view = new Uint8Array(ab)

  for (let i = 0; i < data.length; ++i) {
    view[i] = data[i]
  }

  return ab
}

class Conversation {
  constructor ({
    config,
    synthesizer,
    onStateChange = () => {},
    onSuccess = () => {},
    onError = () => {},
    onAudioData = () => {}
  }) {
    this.synthesizer = synthesizer

    this.audioControl = AudioControl

    this.message = MESSAGES.PASSIVE

    this.config = applyDefaults(config)

    this.onStateChange = onStateChange
    this.onSuccess = onSuccess
    this.onError = onError
    this.onAudioData = onAudioData

    if (!this.config.name) {
      this.onError('A Bot name must be provided.')

      return
    }

    this.onAudioStream = this.onAudioStream.bind(this)
    this.onSilence = this.onSilence.bind(this)
    this.stopRecord = this.stopRecord.bind(this)
    this.transition = this.transition.bind(this)
    this.advanceConversation = this.advanceConversation.bind(this)
    this.updateConfig = this.updateConfig.bind(this)
    this.reset = this.reset.bind(this)

    this.initialConversation = this.initialConversation.bind(this)
    this.listeningConversation = this.listeningConversation.bind(this)
    this.sendingConversation = this.sendingConversation.bind(this)
    this.speakingConversation = this.speakingConversation.bind(this)
  }

  onSilence () {
    if (this.config.silenceDetection) {
      this.audioControl.stopRecording()

      this.advanceConversation()
    }
  }

  stopRecord () {
    this.audioControl.stopRecording()
    this.audioControl.clear()

    this.message = MESSAGES.PASSIVE

    this.onStateChange(this.message)

    this.reset()
  }

  transition (message) {
    this.message = message

    this.onStateChange(message)

    if (
      this.message === MESSAGES.SENDING ||
      this.message === MESSAGES.SPEAKING
    ) {
      this.advanceConversation()
    }

    if (
      this.message === MESSAGES.SENDING &&
      !this.config.silenceDetection
    ) {
      this.audioControl.stopRecording()
    }
  }

  advanceConversation () {
    this.audioControl.supportsAudio(supported => {
      if (supported) {
        switch (this.message) {
          case MESSAGES.PASSIVE:
            this.initialConversation()
            break;
          case MESSAGES.LISTENING:
            this.listeningConversation()
            break;
          case MESSAGES.SENDING:
            this.sendingConversation()
            break;
          case MESSAGES.SPEAKING:
            this.speakingConversation()
            break;
          default:
            break;
        }
      } else {
        this.onError('Audio is not supported.')
      }
    })
  }

  updateConfig (config) {
    this.config = applyDefaults(config)
  }

  reset () {
    this.transition(MESSAGES.PASSIVE)

    this.audioControl.clear()
  }

  initialConversation () {
    this.audioControl.startRecording({
      onSilence: this.onSilence,
      visualizer: this.onAudioData,
      config: this.config
    })

    console.log('initialConversation: ', MESSAGES.LISTENING)

    this.transition(MESSAGES.LISTENING)
  }

  listeningConversation () {
    this.audioControl.exportWAV((blob) => {
      this.audioInput = blob

      console.log('listeningConversation: ', MESSAGES.SENDING)

      this.transition(MESSAGES.SENDING)
    })
  }

  onAudioStream ({ data }) {
    console.log('data: ', data)

    if (data.audioStream) {
      data.audioStream = bufferToArrayBuffer(data.audioStream)

      this.audioOutput = data

      this.onSuccess(data)

      console.log('sendingConversation success: ', MESSAGES.SPEAKING)

      this.transition(MESSAGES.SPEAKING)
    } else {
      this.onError(data)

      console.log('sendingConversation error: ', MESSAGES.PASSIVE)

      this.transition(MESSAGES.PASSIVE)
    }
  }

  sendingConversation () {
    this.config.inputStream = this.audioInput

    let data = new FormData()

    data.append('inputStream', this.config.inputStream)
    data.append('name', this.config.name)
    data.append('contentType', this.config.contentType)
    data.append('userId', this.config.userId)
    data.append('accept', this.config.accept)

    // TODO: Add sending text requests
    //       In case of text, we have the following params:
    // name, userId, inputText
    // url: `${settings.apiUrl}/vui-server/text`,

    axios({
      method: 'post',
      url: `${settings.apiUrl}/vui-server/content`,
      data,
      headers: {
        'X-API-key': settings.apiKey
      }
    }).then(this.onAudioStream).catch(err => {
      this.onError(err)

      console.log('sendingConversation error: ', MESSAGES.PASSIVE)

      this.transition(MESSAGES.PASSIVE)
    })
  }

  speakingConversation () {
    if (this.audioOutput.audioStream) {
      this.audioControl.play(this.audioOutput.audioStream, () => {
        if (
          this.audioOutput.dialogState === 'ReadyForFulfillment' ||
          this.audioOutput.dialogState === 'Fulfilled' ||
          this.audioOutput.dialogState === 'Failed' ||
          !this.config.silenceDetection
        ) {
          console.log('speakingConversation: ', MESSAGES.PASSIVE)

          this.transition(MESSAGES.PASSIVE);
        } else {
          this.audioControl.startRecording(
            this.onSilence,
            this.onAudioData,
            this.config.silenceDetection
          )

          console.log('speakingConversation: ', MESSAGES.LISTENING)

          this.transition(MESSAGES.LISTENING)
        }
      })
    } else if (this.audioOutput && this.audioOutput.message) {
      if (this.synthesizer.isSynthesizerSupported()) {
        this.synthesizer.speak({
          phrase: this.audioOutput.message,
          onSpeechEnd: (e) => {
            console.log('onSpeechEnd e: ', e)
          },
          onSpeechError: (e) => {
            console.log('onSpeechError: ', e)
          }
        })
      }
    } else {
      console.error('speakingConversation Error: AudioOutput ContentType is ', this.audioOutput.contentType, ', but should be strictly audio/mpeg !')

      console.log('speakingConversation: ', MESSAGES.PASSIVE)

      this.transition(MESSAGES.PASSIVE)
    }
  }
}

export default Conversation
