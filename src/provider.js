import React, {
  Component,
  createRef,
  createContext
} from 'react'
import PropTypes from 'prop-types'

import {
  Conversation
} from './vui'

import { generateSyntesizer } from './vui/synthesizer'
import { generateRecognizer } from './vui/recognizer'

export const {
  Provider,
  Consumer
} = createContext('VuicsContext')

export default class Vuics extends Component {
  constructor (props) {
    super(props)

    this.state = {
      state: 'Passive',
      transcript: '',
      listening: false,
      message: 'Click to Speak!'
    }

    this.setCanvasDimensions = this.setCanvasDimensions.bind(this)
    this.onStateChange = this.onStateChange.bind(this)
    this.onAudioData = this.onAudioData.bind(this)
    this.onData = this.onData.bind(this)
    this.onError = this.onError.bind(this)
    this.onClick = this.onClick.bind(this)

    this.onSpeechStart = this.onSpeechStart.bind(this)
    this.onSpeechEnd = this.onSpeechEnd.bind(this)
    this.onSpeechError = this.onSpeechError.bind(this)

    this.buttonRef = createRef()
    this.canvasWrapperRef = createRef()
    this.canvasRef = createRef()

    this.conversation = null
    this.canvasCtx = null

    this.synthesizer = generateSyntesizer({
      voiceIndex: 0,
      pitch: 1,
      rate: 1,
      onSpeechStart: this.onSpeechStart,
      onSpeechEnd: this.onSpeechEnd,
      onSpeechError: this.onSpeechError
    })

    this.recognizer = generateRecognizer({
      callbacks: props.recognitionCallbacks,
      commands: props.recognizerHandlers,
      autoRestart: true,
      debugState: true,
      locale: props.locale,
      api: {
        isSynthesizerSupported: this.synthesizer.isSynthesizerSupported,
        changeVoiceIndex: this.synthesizer.changeVoiceIndex,
        changePitch: this.synthesizer.changePitch,
        changeRate: this.synthesizer.changeRate,
        speak: this.synthesizer.speak,

        state: this.state.state,
        transcript: this.state.transcript,
        message: this.state.message,
        recognizing: this.state.recognizing,

        onClick: this.onClick
      }
    })
  }

  static propTypes = {
    locale: PropTypes.string.isRequired,

    children: PropTypes.node.isRequired,

    name: PropTypes.string.isRequired,

    intentHandlers: PropTypes.object.isRequired,
    recognizerHandlers: PropTypes.object,
    recognitionCallbacks: PropTypes.object,

    fillStyle: PropTypes.string,
    lineWidth: PropTypes.number,
    strokeStyle: PropTypes.string
  }

  static defaultProps = {
    fillStyle: 'rgb(27,28,29)',
    lineWidth: 2,
    strokeStyle: 'rgb(33,186,70)',
    recognitionCallbacks: {
      start: [],
      error: [],
      end: [],
      soundstart: [],
      result: [],
      resultMatch: [],
      resultNoMatch: [],
      errorNetwork: [],
      errorPermissionBlocked: [],
      errorPermissionDenied: []
    },
    recognizerHandlers: {}
  }

  componentDidMount () {
    this.recognizer.addRecognizerHandlers(this.props.recognizerHandlers)

    window.addEventListener('resize', this.setCanvasDimensions)

    this.setCanvasDimensions()

    this.canvasCtx = this.canvasRef.current.getContext('2d')
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.setCanvasDimensions)
  }

  onSpeechStart () {

  }

  onSpeechEnd (e) {
    console.log('onSpeechEnd e: ', e)
  }

  onSpeechError (e) {
    console.log('onSpeechError e: ', e)
  }

  setCanvasDimensions () {
    this.setState(
      () => ({
        width: this.canvasWrapperRef.current.clientWidth,
        height: this.canvasWrapperRef.current.clientHeight
      })
    )
  }

  onAudioData (dataArray, bufferLength) {
    var animationId

    this.canvasCtx
      .clearRect(
        0,
        0,
        this.canvasRef.current.clientWidth,
        this.canvasRef.current.clientHeight
      )

    const draw = () => {
      if (!this.state.listening) {
        return
      }

      this.canvasCtx.fillStyle = this.props.fillStyle

      this.canvasCtx
        .fillRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )

      this.canvasCtx.lineWidth = this.props.lineWidth

      this.canvasCtx.strokeStyle = this.props.strokeStyle

      this.canvasCtx.beginPath()

      const sliceWidth = this.canvasRef.current.clientWidth * 1.0 / bufferLength

      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = v * this.canvasRef.current.clientHeight / 2

        if (i === 0) {
          this.canvasCtx.moveTo(x, y)
        } else {
          this.canvasCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      this.canvasCtx
        .lineTo(
          this.canvasRef.current.width,
          this.canvasRef.height / 2
        )

      this.canvasCtx.stroke()
    }

    if (typeof animationId === 'undefined') {
      animationId = window.requestAnimationFrame(draw)
    }
  }

  onStateChange (state) {
    console.log('state:', state)

    if (state === 'Listening') {
      this.setState(
        () => ({
          state,
          listening: true
        })
      )
    }

    if (state === 'Sending') {
      this.setState(
        () => ({
          state,
          listening: false
        })
      )

      this.canvasCtx
        .fillRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )

      this.canvasCtx
        .clearRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )
    }

    if (state === 'Passive') {
      this.setState(
        () => ({
          state,
          listening: false
        })
      )

      this.canvasCtx
        .fillRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )

      this.canvasCtx
        .clearRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )
    }

    if (state === 'Speaking') {
      this.setState(
        () => ({
          state,
          listening: false
        })
      )
    }
  }

  onData (data) {
    console.log('data:', data)

    console.log('Transcript:', data.inputTranscript, ', Response:', data.message)

    this.setState(
      () => ({
        transcript: data.inputTranscript,
        message: data.message
      }),
      () => {
        if (!data.intentName) {
          return
        }
        if (
          typeof this.props.intentHandlers[data.intentName] === 'function'
        ) {
          this.props.intentHandlers[data.intentName](data, {
            isSynthesizerSupported: this.synthesizer.isSynthesizerSupported,
            speak: this.synthesizer.speak,
            changeVoiceIndex: this.synthesizer.changeVoiceIndex,
            changePitch: this.synthesizer.changePitch,
            changeRate: this.synthesizer.changeRate,

            isRecognitionSupported: this.recognizer.isRecognitionSupported,
            start: this.recognizer.start,
            abort: this.recognizer.abort,
            pause: this.recognizer.pause,
            resume: this.recognizer.resume,
            debug: this.recognizer.debug,
            changeLocale: this.recognizer.changeLocale,
            addRecognizerHandlers: this.recognizer.addRecognizerHandlers,
            removeRecognizerHandlers: this.recognizer.removeRecognizerHandlers,
            addCallback: this.recognizer.addCallback,
            removeCallback: this.recognizer.removeCallback,
            isListening: this.recognizer.isListening,
            trigger: this.recognizer.trigger,

            state: this.state.state,
            transcript: data.inputTranscript,
            message: data.message,
            listening: this.state.listening,

            onClick: this.onClick
          })
        } else {
          console.error('Intent ', data.intentName, ' have no callback attached!')
        }
      }
    )
  }

  onError (error) {
    console.log('onError error: ', error)
  }

  onClick () {
    if (
      this.state.state === 'Listening' ||
      this.state.state === 'Sending' ||
      this.state.state === 'Speaking'
    ) {
      console.log('onClick this.state.state: ', this.state.state)

      if (this.conversation) {
        this.conversation.stopRecord()
      }

      return
    }

    this.conversation = new Conversation({
      config: {
        name: this.props.name
      },
      synthesizer: this.synthesizer,
      onStateChange: this.onStateChange,
      onSuccess: this.onData,
      onError: this.onError,
      onAudioData: this.onAudioData
    })

    this.conversation.advanceConversation()
  }

  render () {
    return (
      <Provider
        value={{ // eslint-disable-line react-perf/jsx-no-new-object-as-prop
          isRecognitionSupported: this.recognizer.isRecognitionSupported,
          isSynthesizerSupported: this.synthesizer.isSynthesizerSupported,

          speak: this.synthesizer.speak,

          buttonRef: this.buttonRef,
          canvasRef: this.canvasRef,
          canvasWrapperRef: this.canvasWrapperRef,
          state: this.state.state,
          transcript: this.state.transcript,
          message: this.state.message,
          width: this.state.width,
          height: this.state.height,

          onClick: this.onClick,

          start: this.recognizer.start,
          abort: this.recognizer.abort,
          pause: this.recognizer.pause,
          resume: this.recognizer.resume,
          debug: this.recognizer.debug,
          changeLocale: this.recognizer.changeLocale,
          addRecognizerHandlers: this.recognizer.addRecognizerHandlers,
          removeRecognizerHandlers: this.recognizer.removeRecognizerHandlers,
          addCallback: this.recognizer.addCallback,
          removeCallback: this.recognizer.removeCallback,
          isListening: this.recognizer.isListening,
          trigger: this.recognizer.trigger,
          recognizing: this.state.recognizing,
          listening: this.state.listening
        }}

      >
        {
          this.props.children
        }
      </Provider>
    )
  }
}
