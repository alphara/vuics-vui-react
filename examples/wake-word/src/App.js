import React, { Component } from 'react'

import {
  VuicsProvider,
  VuicsConsumer,
  initVuics,
  ButtonDefault,
  Oscilloscope
} from '@vuics/vui-react'

import {
  Button,
  Loader,
  Radio
} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

initVuics({
  apiKey: process.env.REACT_APP_VUICS_API_KEY
})

export default class App extends Component {
  onGreetings = ([
    greeting,
    vuiname
  ], {
    // isSynthesizerSupported, // func
    // isRecognitionSupported, // func

    speak, // func
    onClick, // func

    // state, // string
    // transcript, // string
    // message, // string
    //
    // recognizing, // bool,
    // listening, // bool
    //
    // start, // func
    abort // func
    // pause, // func
    // resume, // func
    // debug, // func
    // setLanguage, // func
    // isListening, // func
    // trigger // func
  }) => {
    console.log('greeting:', greeting, ', vuiname:', vuiname);

    speak({
      phrase: 'Listening',
      onSpeechError: (event) => {

      },
      onSpeechEnd: (event) => {

      },
      voiceIndex: 0,
      pitch: 1,
      rate: 1
    });

    setTimeout(() => {
      console.log('wakeUp')

      onClick()
    }, 1000);

    abort(); // alternative way: Recognizer.pause();
  }

  onGoodbay = ([
    farewell,
    vuiname
  ], {
    // isSynthesizerSupported, // func
    // isRecognitionSupported, // func

    speak, // func
    //
    // state, // string
    // transcript, // string
    // message, // string
    //
    // recognizing, // bool,
    // listening, // bool
    //
    // start, // func
    abort // func
    // pause, // func
    // resume, // func
    // debug, // func
    // setLanguage, // func
    // isListening, // func
    // trigger // func
  }) => {
    console.log('farewell:', farewell, ', vuiname:', vuiname);

    speak({
      phrase: 'Talk to you soon',
      onSpeechError: (event) => {

      },
      onSpeechEnd: (event) => {

      },
      voiceIndex: 0,
      pitch: 1,
      rate: 1
    });

    abort();
  }

  hello = (data, api) => {
    const {
      intentName // string
      // audioStream, // ArrayBuffer
      // contentType, // string
      // dialogState, // string
      // slots // object
    } = data

    const {
      // isSynthesizerSupported, // func
      // isRecognitionSupported, // func
      //
      // speak, // func
      //
      // state, // string
      // transcript, // string
      // message, // string
      //
      // recognizing, // bool,
      // listening, // bool
      //
      // onClick, // func
      //
      // start, // func
      // abort, // func
      // pause, // func
      resume // func
      // debug, // func
      // setLanguage, // func
      // addSpeechHandlers, // func
      // removeSpeechHandlers, // func
      // addCallback, // func
      // removeCallback, // func
      // isListening, // func
      // trigger // func
    } = api

    console.log('intentName:', intentName)

    resume();
  }

  howareyou = (data, api) => {
    const {
      intentName // string
      // audioStream, // ArrayBuffer
      // contentType, // string
      // dialogState, // string
      // slots // object
    } = data

    const {
      // isSynthesizerSupported, // func
      // isRecognitionSupported, // func
      //
      // speak, // func
      //
      // state, // string
      // transcript, // string
      // message, // string
      //
      // recognizing, // bool,
      // listening, // bool
      //
      // onClick, // func
      //
      // start, // func
      // abort, // func
      // pause, // func
      resume // func
      // debug, // func
      // setLanguage, // func
      // addSpeechHandlers, // func
      // removeSpeechHandlers, // func
      // addCallback, // func
      // removeCallback, // func
      // isListening, // func
      // trigger // func
    } = api
    console.log('intentName:', intentName)

    resume();
  }

  intentHandlers = {
    'Hello': this.hello,
    'HowAreYou': this.howareyou
  }

  speechHandlers = {
    ':greeting :vuiname': {
      'regexp': /^(Hello|Hey|Hi) (Vuics|Voice|Voice Interface|Voice User Interface)$/,
      'callback': this.onGreetings
    },
    'Click to Speak': this.onGreetings,

    ':farewell :vuiname': {
      'regexp': /^(Goodbye|Bye|Bye-bye) (Vuics|Voice|Voice Interface|Voice User Interface)$/,
      'callback': this.onGoodbay
    }
  }

  recognitionCallbacks = {
    start: [
      (api) => {
        // console.log('recognitionCallbacks start api: ', api)
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
        // console.log('error event', event)
      }
    ],
    errorNetwork: [
      (event, api) => {
        // console.log('errorNetwork event', event)
      }
    ],
    errorPermissionBlocked: [
      (event, api) => {
        // console.log('errorPermissionBlocked event', event)
      }
    ],
    errorPermissionDenied: [
      (event, api) => {
        // console.log('errorPermissionDenied event', event)
      }
    ]
  }

  render = () => (
    <VuicsProvider
      name='VuicsHome'

      fillStyle='rgb(27,28,29)'
      lineWidth={2}
      strokeStyle='rgb(33,186,70)'
      locale='en_US'
      speechHandlers={this.speechHandlers}
      intentHandlers={this.intentHandlers}
      recognitionCallbacks={this.recognitionCallbacks}
    >
      <VuicsConsumer>
        {
          ({
            buttonRef, // object
            onClick, // func

            state, // string
            transcript, // string
            message, // string

            recognizing, // bool
            listening, // bool

            speak, // func

            isSynthesizerSupported, // func
            isRecognitionSupported, // func

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
          }) => (
            <div>
              <Button
                onClick={() => {
                  if (isSynthesizerSupported()) {
                    speak({
                      phrase: 'Hello!   I am your Voice User Interface.',
                      onError: (event) => {

                      },
                      onEnd: (event) => {

                      },
                      voiceIndex: 0,
                      pitch: 1,
                      rate: 1
                    })
                  }
                }}
                color='blue'
              >
                  Speak
              </Button>

              <Radio
                toggle
                label={
                  isRecognitionSupported()
                    ? 'Wake-Word "Hello Voice" '
                    : 'No browser support of Wake-Word '
                }
                disabled={!isRecognitionSupported()}
                checked={recognizing}
                onChange={(event, data) => {
                  if (data.checked) {
                    speak({
                      phrase: "I'm listening for Hello voice.",
                      voiceIndex: 0,
                      pitch: 1,
                      rate: 1,
                      onSpeechEnd: () => {
                        start({
                          paused: false
                        })
                      },
                      onSpeechError: () => {

                      }
                    })
                  } else {
                    abort();

                    speak({
                      phrase: "I'm not listening anymore.",
                      voiceIndex: 0,
                      pitch: 1,
                      rate: 1,
                      onSpeechEnd: () => {

                      },
                      onSpeechError: () => {

                      }
                    })
                  }
                }}
              />

              <ButtonDefault
                className='button'
              />

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

              <Oscilloscope
                canvasWrapperClassName='canvasWrapper'
                canvasClassName='canvas'
              />
            </div>
          )
        }
      </VuicsConsumer>
    </VuicsProvider>
  )
}
