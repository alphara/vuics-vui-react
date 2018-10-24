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
    onStateChange = () => {},
    onSuccess = () => {},
    onError = () => {},
    onAudioData = () => {}
  }) {
    console.log('new Conversation')
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
    console.log('onSilence this.config.silenceDetection: ', this.config.silenceDetection)

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
    console.log('advanceConversation this.message: ', this.message)

    this.audioControl.supportsAudio(supported => {
      console.log('supportsAudio: ', supported)

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
    console.log('initialConversation: ', MESSAGES.LISTENING)

    this.transition(MESSAGES.LISTENING)

    this.audioControl.startRecording({
      onSilence: this.onSilence,
      visualizer: this.onAudioData,
      config: this.config
    });
  }

  listeningConversation () {
    console.log('listeningConversation: ', MESSAGES.SENDING)

    this.transition(MESSAGES.SENDING)

    this.audioControl.exportWAV((blob) => {
      this.audioInput = blob
    })
  }

  sendingConversation () {
    console.log('sendingConversation')
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
    }).then(({ data }) => {
      data.audioStream = bufferToArrayBuffer(data.audioStream)

      this.audioOutput = data

      console.log('sendingConversation success: ', MESSAGES.SPEAKING)

      this.transition(MESSAGES.SPEAKING)

      this.onSuccess(data)
    }).catch((err) => {
      console.log('sendingConversation error: ', MESSAGES.PASSIVE)

      this.transition(MESSAGES.PASSIVE)

      this.onError(err)
    })
  }

  speakingConversation () {
    console.log('speakingConversation')

    if (this.audioOutput.contentType === 'audio/mpeg') {
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
          console.log('speakingConversation: ', MESSAGES.LISTENING)

          this.transition(MESSAGES.LISTENING)

          this.audioControl.startRecording(
            this.onSilence,
            this.onAudioData,
            this.config.silenceDetection
          )
        }
      })
    } else {
      console.error('speakingConversation Error: AudioOutput ContentType is ', this.audioOutput.contentType, ', but should be strictly audio/mpeg !')

      console.log('speakingConversation: ', MESSAGES.PASSIVE)

      this.transition(MESSAGES.PASSIVE)
    }
  }
}

export default Conversation
