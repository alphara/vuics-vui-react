import React, {
  Component,
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
  static propTypes = {
    locale: PropTypes.string.isRequired,

    children: PropTypes.node.isRequired,

    name: PropTypes.string.isRequired,
    authToken: PropTypes.string,
    apiKey: PropTypes.string,

    onConversationData: PropTypes.func.isRequired,

    intentHandlers: PropTypes.object,
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

  constructor (props) {
    super(props)

    this.state = {
      state: 'Passive',
      transcript: '',
      listening: false,
      speaking: false,
      recognizing: false,
      message: 'Click to Speak!'
    }

    this.onClick = this.onClick.bind(this)

    this.clearCanvas = this.clearCanvas.bind(this)
    this.getCanvasRef = this.getCanvasRef.bind(this)
    this.getCanvasWrapperRef = this.getCanvasWrapperRef.bind(this)
    this.setCanvasDimensions = this.setCanvasDimensions.bind(this)

    this.onConversationStateChange = this.onConversationStateChange.bind(this)
    this.onConversationSuccess = this.onConversationSuccess.bind(this)
    this.onConversationError = this.onConversationError.bind(this)
    this.onAudioData = this.onAudioData.bind(this)

    this.onRecognitionStart = this.onRecognitionStart.bind(this)
    this.onRecognitionSoundStart = this.onRecognitionSoundStart.bind(this)
    this.onRecognitionEnd = this.onRecognitionEnd.bind(this)
    this.onRecognitionResult = this.onRecognitionResult.bind(this)
    this.onRecognitionError = this.onRecognitionError.bind(this)

    this.onSpeechStart = this.onSpeechStart.bind(this)
    this.onSpeechEnd = this.onSpeechEnd.bind(this)
    this.onSpeechError = this.onSpeechError.bind(this)

    this.canvasWrapperRef = null
    this.canvasRef = null
    this.canvasCtx = null

    this.conversation = null

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

        speaking: this.state.speaking,
        state: this.state.state,
        transcript: this.state.transcript,
        message: this.state.message,

        onClick: this.onClick
      },
      onRecognitionStart: this.onRecognitionStart,
      onRecognitionSoundStart: this.onRecognitionSoundStart,
      onRecognitionEnd: this.onRecognitionEnd,
      onRecognitionResult: this.onRecognitionResult,
      onRecognitionError: this.onRecognitionError
    })
  }

  componentDidMount () {
    this.recognizer.addRecognizerHandlers(this.props.recognizerHandlers)

    window.addEventListener('resize', this.setCanvasDimensions)

    this.setCanvasDimensions()

    if (this.canvasRef !== null) {
      this.canvasCtx = this.canvasRef.getContext('2d')
    }
  }

  componentWillUnmount () {
    window.removeEventListener('resize', this.setCanvasDimensions)
  }

  getCanvasRef (ref) {
    this.canvasRef = ref
  }

  getCanvasWrapperRef (ref) {
    this.canvasWrapperRef = ref
  }

  setCanvasDimensions () {
    if (this.canvasWrapperRef !== null) {
      this.setState(
        () => ({
          width: this.canvasWrapperRef.clientWidth,
          height: this.canvasWrapperRef.clientHeight
        })
      )
    }
  }

  onRecognitionStart () {
    console.log('onRecognitionStart')

    this.setState(
      () => ({
        recognizing: true
      })
    )
  }
  onRecognitionSoundStart () {
    console.log('onRecognitionSoundStart')

    this.setState(
      () => ({
        recognizing: true
      })
    )
  }
  onRecognitionEnd () {
    console.log('onRecognitionEnd')

    this.setState(
      () => ({
        recognizing: false
      })
    )
  }
  onRecognitionResult () {
    console.log('onRecognitionResult')

    this.setState(
      () => ({
        recognizing: false
      })
    )
  }
  onRecognitionError () {
    console.log('onRecognitionError')

    this.setState(
      () => ({
        recognizing: false
      })
    )
  }

  onSpeechStart () {
    console.log('onSpeechStart')

    this.setState(
      () => ({
        speaking: true
      })
    )
  }

  onSpeechEnd (e) {
    console.log('onSpeechEnd e: ', e)

    this.setState(
      () => ({
        speaking: false
      })
    )
  }

  onSpeechError (e) {
    console.log('onSpeechError e: ', e)

    this.setState(
      () => ({
        speaking: false
      })
    )
  }

  onAudioData (dataArray, bufferLength) {
    if (this.canvasRef !== null) {
      let animationId

      this.canvasCtx
        .clearRect(
          0,
          0,
          this.canvasRef.clientWidth,
          this.canvasRef.clientHeight
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
            this.canvasRef.clientWidth,
            this.canvasRef.clientHeight
          )

        this.canvasCtx.lineWidth = this.props.lineWidth

        this.canvasCtx.strokeStyle = this.props.strokeStyle

        this.canvasCtx.beginPath()

        const sliceWidth = this.canvasRef.clientWidth * 1.0 / bufferLength

        let x = 0

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0
          const y = v * this.canvasRef.clientHeight / 2

          if (i === 0) {
            this.canvasCtx.moveTo(x, y)
          } else {
            this.canvasCtx.lineTo(x, y)
          }

          x += sliceWidth
        }

        this.canvasCtx
          .lineTo(
            this.canvasRef.width,
            this.canvasRef.height / 2
          )

        this.canvasCtx.stroke()
      }

      if (typeof animationId === 'undefined') {
        animationId = window.requestAnimationFrame(draw)
      }
    }
  }

  clearCanvas = () => {
    if (this.canvasRef !== null) {
      this.canvasCtx
        .fillRect(
          0,
          0,
          this.canvasRef.clientWidth,
          this.canvasRef.clientHeight
        )

      this.canvasCtx
        .clearRect(
          0,
          0,
          this.canvasRef.clientWidth,
          this.canvasRef.clientHeight
        )
    }
  }

  onConversationStateChange (state) {
    console.log('state:', state)

    if (state === 'Passive') {
      this.setState(
        () => ({
          state,
          listening: false
        })
      )

      this.clearCanvas()
    }

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

      this.clearCanvas()
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

  onConversationSuccess (data) {
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
        console.log(data)

        if (
          this.props.intentHandlers &&
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

        this.props.onConversationData(data)
      }
    )
  }

  onConversationError (error) {
    console.log('onConversationError error: ', error)
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
        name: this.props.name,
        authToken: this.props.authToken,
        apiKey: this.props.apiKey
      },
      synthesizer: this.synthesizer,
      onStateChange: this.onConversationStateChange,
      onSuccess: this.onConversationSuccess,
      onError: this.onConversationError,
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

          getCanvasRef: this.getCanvasRef,
          getCanvasWrapperRef: this.getCanvasWrapperRef,

          listening: this.state.listening,
          speaking: this.state.speaking,
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
          trigger: this.recognizer.trigger
        }}
      >
        {
          this.props.children
        }
      </Provider>
    )
  }
}
