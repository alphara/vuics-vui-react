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
    isSynthesizerSupported, // func
    isRecognitionSupported, // func

    speak, // func
    onClick, // func

    state, // string
    transcript, // string
    message, // string

    recognizing, // bool,
    listening, // bool

    start, // func
    abort, // func
    pause, // func
    resume, // func
    debug, // func
    setLanguage, // func
    isListening, // func
    trigger // func
  }) => {
    console.log('greeting:', greeting, ', vuiname:', vuiname);

    speak({
      phrase: 'Listening',
      onError: (event) => {

      },
      onEnd: (event) => {

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

  onGoodbay = ({
    farewell,
    vuiname
  }, {
    isSynthesizerSupported, // func
    isRecognitionSupported, // func

    speak, // func

    state, // string
    transcript, // string
    message, // string

    recognizing, // bool,
    listening, // bool

    start, // func
    abort, // func
    pause, // func
    resume, // func
    debug, // func
    setLanguage, // func
    isListening, // func
    trigger // func
  }) => {
    console.log('farewell:', farewell, ', vuiname:', vuiname);

    speak({
      phrase: 'Talk to you soon',
      onError: (event) => {

      },
      onEnd: (event) => {

      },
      voiceIndex: 0,
      pitch: 1,
      rate: 1
    });

    abort();
  }

  render = () => (
    <div>
      <VuicsProvider
        vuicsVuiId='VuicsHome'
        onConversationData={(data, {
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
          addCommands, // func
          removeCommands, // func
          addCallback, // func
          removeCallback, // func
          isListening, // func
          trigger // func
        }) => {
          console.log('intentName:', data.intentName)

          resume();
        }}
        fillStyle='rgb(27,28,29)'
        lineWidth={2}
        strokeStyle='rgb(33,186,70)'
        locale='EN_us'
        commands={{ // eslint-disable-line  react-perf/jsx-no-new-object-as-prop
          ':greeting :vuiname': {
            'regexp': /^(Hello|Hey|Hi) (Vuics|Voice|Voice Interface|Voice User Interface)$/,
            'callback': this.onGreetings
          },
          'Click to Speak': this.onGreetings,

          ':farewell :vuiname': {
            'regexp': /^(Goodbye|Bye|Bye-bye) (Vuics|Voice|Voice Interface|Voice User Interface)$/,
            'callback': this.onGoodbay
          }
        }}
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
              addCommands, // func
              removeCommands, // func
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
                        onError: (event) => {

                        },
                        onEnd: (event) => {

                        },
                        voiceIndex: 0,
                        pitch: 1,
                        rate: 1
                      })

                      start({ paused: false });
                    } else {
                      speak({
                        phrase: "I'm not listening anymore.",
                        onError: (event) => {

                        },
                        onEnd: (event) => {

                        },
                        voiceIndex: 0,
                        pitch: 1,
                        rate: 1
                      })

                      abort();
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
    </div>
  )
}
