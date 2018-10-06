import React, {
  Component,
  createRef,
  createContext
} from 'react'
import PropTypes from 'prop-types'

import {
  Conversation
} from './vui'

export const {
  Provider,
  Consumer
} = createContext('VuicsContext')

export default class Vuics extends Component {
  constructor (props) {
    super(props)

    this.buttonRef = createRef()
    this.canvasWrapperRef = createRef()
    this.canvasRef = createRef()

    this.conversation = null
    this.canvasCtx = null
  }

  static propTypes = {
    children: PropTypes.node.isRequired,

    vuicsVuiId: PropTypes.string.isRequired,
    onConversationData: PropTypes.func.isRequired,

    fillStyle: PropTypes.string,
    lineWidth: PropTypes.number,
    strokeStyle: PropTypes.string
  }

  static defaultProps = {
    fillStyle: 'rgb(27,28,29)',
    lineWidth: 2,
    strokeStyle: 'rgb(33,186,70)'
  }

  state = {
    transcript: '',
    listening: false,
    state: 'Passive',
    message: 'Click to Speak!'
  };

  componentDidMount = () => {
    window.addEventListener('resize', this.setCanvasDimensions)

    this.setCanvasDimensions()

    this.canvasCtx = this.canvasRef.current.getContext('2d')
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.setCanvasDimensions)
  }

  setCanvasDimensions = () => {
    this.setState(
      () => ({
        width: this.canvasWrapperRef.current.clientWidth,
        height: this.canvasWrapperRef.current.clientHeight
      })
    )
  };

  visualizeAudioBuffer = (dataArray, bufferLength) => {
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
  };

  onChangeState = state => {
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

  onData = data => {
    console.log('data:', data)

    console.log('Transcript:', data.inputTranscript, ', Response:', data.message)

    this.setState(
      () => ({
        transcript: data.inputTranscript,
        message: data.message
      })
    )

    this.props.onConversationData(data)
  }

  onError = error => {
    console.log('onError error: ', error)
  }

  onClick = () => {
    if (
      this.state.state === 'Listening' ||
      this.state.state === 'Sending' ||
      this.state.state === 'Speaking'
    ) {
      console.log('this.state.state: ', this.state.state)
      this.conversation.stopRecord()
      return
    }

    this.conversation = new Conversation(
      {
        vuiConfig: {
          botName: this.props.vuicsVuiId
        }
      },
      this.onChangeState,
      this.onData,
      this.onError,
      this.visualizeAudioBuffer
    )

    this.conversation.advanceConversation()
  }

  render = () => (
    <Provider
      value={{ // eslint-disable-line react-perf/jsx-no-new-object-as-prop
        buttonRef: this.buttonRef,
        canvasRef: this.canvasRef,
        canvasWrapperRef: this.canvasWrapperRef,
        state: this.state.state,
        transcript: this.state.transcript,
        message: this.state.message,
        width: this.state.width,
        height: this.state.height,
        onClick: this.onClick
      }}

    >
      {
        this.props.children
      }
    </Provider>
  )
}
