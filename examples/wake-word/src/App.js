import React, { Component } from 'react'

import {
  Vuics,
  initVuics,
  ButtonDefault,
  Analyzer,
  Consumer,
  speak,
  listen,
} from '@vuics/vui-react'

import {
  Button,
  Loader
} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

initVuics({
  apiKey: process.env.REACT_APP_VUICS_API_KEY
})

let savedOnClick = () => {}
let wakeUp = () => { console.log('wakeUp'); savedOnClick(); }

export default class App extends Component {
  onData = data => {
    console.log('intentName:', data.intentName)
    listen.resume();
  }

  componentDidMount = () => {
    const onWakeWord = () => {
      // speak({ phrase: 'Hello! I am Voice User Interface!' })
      speak({ phrase: 'Listening' });
      wakeUp();
      listen.pause();
    }

    // const onBye = () => {
    //   speak({ phrase: 'Talk to you soon' });
    // }

    // const onHowAreYou = () => speak({ phrase: 'I am fine. Thank you!' });

    listen.addCommands({
      'Hello Voice': onWakeWord,
      'Hello Voice Interface': onWakeWord,
      'Hello Voice User Interface': onWakeWord,
      'Click to Speak': onWakeWord,
      // 'How are you': onHowAreYou,
      // 'How are you doing': onHowAreYou,
      // 'Whats up': onHowAreYou,
      // 'Goodbye': onBye,
      // 'Bye': onBye,
      // 'See you': onBye,
      // 'Talk to you later': onBye,
      // 'Talk to you soon': onBye
    });
    // listen.start({ paused: true });
    listen.start();
  }

  render = () => {
    return (
      <div>
        <Button onClick={() => {
          speak({ phrase: 'Hello!   I am your Voice User Interface.'})
        }} color='blue'>
          Speak
        </Button>
        <Button onClick={() => {
          console.log('Resume listening');
          listen.resume();
        }} color='yellow'>
          Resume listening
        </Button>
        <Button onClick={() => {
          console.log('Stop listening');
          listen.abort();
        }} color='yellow'>
          Stop listening
        </Button>

        <Vuics
          vuicsVuiId='VuicsHome'
          onConversationData={this.onData}
          fillStyle='rgb(27,28,29)'
          lineWidth={2}
          strokeStyle='rgb(33,186,70)'
        >
          <ButtonDefault
            className='button'
          />

          <Consumer>
            {
              ({ buttonRef, onClick, disabled, children, state, message }) => {
                savedOnClick = onClick
                return (
                  <Button
                    className='button'
                    // onClick={onClick}
                    onClick={wakeUp}
                    ref={buttonRef}
                    size='huge'
                    color='green'
                    disabled={state !== 'Passive'}
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
            }
          </Consumer>
          {/*
          <Consumer>
            {
              ({ buttonRef, onClick, disabled, children, state, message }) => (
                <Button
                  className='button'
                  onClick={onClick}
                  ref={buttonRef}
                  size='huge'
                  color='green'
                  disabled={state !== 'Passive'}
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
          </Consumer>
          */}

          <Analyzer
            canvasWrapperClassName='canvasWrapper'
            canvasClassName='canvas'
          />
        </Vuics>

      </div>
    )
  }
}
