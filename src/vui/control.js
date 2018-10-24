import AudioRecorder from './recorder.js'

const UNSUPPORTED = 'Audio is not supported.'

class AudioControl {
  constructor () {
    console.log('New AudioControl')
    this.recorder = null
    this.audioRecorder = null
    this.audioSupported = false
    this.playbackSource = null

    this.supportsAudio()
  }

  startRecording ({
    onSilence = () => {},
    visualizer = () => {},
    config
  }) {
    console.log('startRecording config: ', config, ' onSilence: ', onSilence)

    if (!this.audioSupported) {
      throw new Error(UNSUPPORTED)
    }

    this.recorder = this.audioRecorder.createRecorder(config)

    this.recorder.record({
      onSilence,
      visualizer
    })
  }

  stopRecording () {
    if (!this.audioSupported) {
      throw new Error(UNSUPPORTED)
    }

    this.recorder.stop()
  }

  exportWAV (
    callback = () => {
      throw new Error('You must pass a callback function to export.')
    },
    sampleRate = 16000
  ) {
    if (!this.audioSupported) {
      throw new Error(UNSUPPORTED)
    }

    this.recorder.exportWAV(callback, sampleRate)

    this.recorder.clear()
  }

  playHtmlAudioElement (buffer, callback) {
    if (typeof buffer === 'undefined') {
      return
    }

    const audio = document.createElement('audio')

    audio.src = window.URL.createObjectURL(new Blob([buffer]))

    audio.addEventListener('ended', () => {
      audio.currentTime = 0

      if (typeof callback === 'function') {
        callback()
      }
    })

    audio.play()
  }

  play (buffer, callback) {
    if (typeof buffer === 'undefined') {
      return
    }

    const myBlob = new Blob([buffer])

    const fileReader = new FileReader()

    fileReader.onload = () => {
      this.playbackSource = this.audioRecorder.getAudioContext().createBufferSource()

      this.audioRecorder.getAudioContext().decodeAudioData(this.result, buf => {
        this.playbackSource.buffer = buf

        this.playbackSource.connect(
          this.audioRecorder.getAudioContext().destination
        )

        this.playbackSource.onended = (event) => {
          if (typeof callback === 'function') {
            callback()
          }
        }

        this.playbackSource.start(0)
      })
    }

    fileReader.readAsArrayBuffer(myBlob)
  }

  stop () {
    if (typeof playbackSource === 'undefined') {
      return
    }

    this.playbackSource.stop()
  }

  clear () {
    this.recorder.clear()
  }

  supportsAudio (callback = () => {}) {
    console.log('supportsAudio')

    if (this.audioSupported) {
      callback(true) // eslint-disable-line standard/no-callback-literal
      return true
    }

    if (
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      this.audioSupported = true

      this.audioRecorder = AudioRecorder

      this.audioRecorder.requestDevice()
        .then(stream => {
          this.audioSupported = true

          callback(this.audioSupported)
        })
        .catch(error => {
          console.log('audioRecorder requestDevice error', error)

          this.audioSupported = false

          callback(this.audioSupported)
        })
    } else {
      this.audioSupported = false

      callback(this.audioSupported)
    }
  }
}

const Instance = new AudioControl()

export default Instance
