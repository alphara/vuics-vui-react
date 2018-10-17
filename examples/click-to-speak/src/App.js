import React, {
  Component
} from 'react'

import {
  Vuics,
  initVuics,
  ButtonDefault,
  Oscilloscope,
  VuicsConsumer
} from '@vuics/vui-react'

import {
  Button,
  Loader
} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

initVuics({
  apiKey: process.env.REACT_APP_VUICS_API_KEY
})

export default class App extends Component {
  hello = (data, api) => {
    const {
      intentName, // string
      audioStream, // ArrayBuffer
      contentType, // string
      dialogState, // string
      slots // object
    } = data

    const {
      isSynthesizerSupported, // func
      isRecognitionSupported, // func

      speak, // func

      state, // string
      transcript, // string
      message, // string

      recognizing, // bool,
      listening, // bool

      onClick, // func

      start, // func
      abort, // func
      pause, // func
      resume, // func
      debug, // func
      setLanguage, // func
      addSpeechHandlers, // func
      removeSpeechHandlers, // func
      addCallback, // func
      removeCallback, // func
      isListening, // func
      trigger // func
    } = api

    console.log('data:', data, ', api:', api)
  }

  howareyou = (data, api) => {
    const {
      intentName, // string
      audioStream, // ArrayBuffer
      contentType, // string
      dialogState, // string
      slots // object
    } = data

    const {
      isSynthesizerSupported, // func
      isRecognitionSupported, // func

      speak, // func

      state, // string
      transcript, // string
      message, // string

      recognizing, // bool,
      listening, // bool

      onClick, // func

      start, // func
      abort, // func
      pause, // func
      resume, // func
      debug, // func
      setLanguage, // func
      addSpeechHandlers, // func
      removeSpeechHandlers, // func
      addCallback, // func
      removeCallback, // func
      isListening, // func
      trigger // func
    } = api

    console.log('data:', data, ', api:', api)
  }

  intentHandlers = {
    'Hello': this.hello,
    'HowAreYou': this.howareyou,
  }

  recognitionCallbacks = {
    start: [
      (api) => {

      }
    ],
    end: [
      (api) => {

      }
    ],
    soundstart: [
      (api) => {

      }
    ],
    result: [
      (results, api) => {

      }
    ],
    resultMatch: [
      ({ commandText, originalPhrase, results }, api) => {

      }
    ],
    resultNoMatch: [
      (results, api) => {

      }
    ],
    error: [
      (event, api) => {
        console.log('error event', event)
      }
    ],
    errorNetwork: [
      (event, api) => {
        console.log('errorNetwork event', event)
      }
    ],
    errorPermissionBlocked: [
      (event, api) => {
        console.log('errorPermissionBlocked event', event)
      }
    ],
    errorPermissionDenied: [
      (event, api) => {
        console.log('errorPermissionDenied event', event)
      }
    ]
  }

  render = () => (
    <div>
      <Vuics
        vuicsVuiId='VuicsHome'
        fillStyle='rgb(27,28,29)'
        lineWidth={2}
        strokeStyle='rgb(33,186,70)'
        intentHandlers={this.intentHandlers}
        recognitionCallbacks={this.recognitionCallbacks}
      >
        <ButtonDefault
          className='button'
        />

        <VuicsConsumer>
          {
            ({ buttonRef, onClick, state, message }) => (
              <Button
                className='button'
                onClick={onClick}
                ref={buttonRef}
                size='huge'
                color='green'
              >
                {
                  state === 'Passive'
                    ? 'Click to Speak 🎙️ =>'
                    : state === 'Listening'
                      ? '🎤 Say a Phrase (e.g. "Help me")'
                      : state === 'Sending'
                        ? <Loader active inline='centered' />
                        : '🔊' + message
                }
              </Button>
            )
          }
        </VuicsConsumer>

        <Oscilloscope
          canvasWrapperClassName='canvasWrapper'
          canvasClassName='canvas'
        />
      </Vuics>

    </div>
  )
}
