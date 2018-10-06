import React, {
  Component
} from 'react'

import {
  Vuics,
  initVuics,
  ButtonDefault,
  Oscilloscope,
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
    this.setState({ listening: true });
  }

  state = {
    listening: false,
  };

  componentDidMount = () => {
    const onWakeWord = () => {
      // speak({ phrase: 'Hello! I am Voice User Interface!' })
      speak({ phrase: 'Listening' });
      wakeUp();
      // listen.pause();
      listen.abort();
      this.setState({ listening: false });
    }

    const onBye = () => {
      speak({ phrase: 'Talk to you soon' });
    }

    const onHowAreYou = () => speak({ phrase: 'I am fine. Thank you!' });

    listen.addCommands({
      'Hello Voice': onWakeWord,
      'Hey Voice': onWakeWord,
      'Hello Vuics': onWakeWord,
      'Hey Vuics': onWakeWord,
      'Hello Voice Interface': onWakeWord,
      'Hey Voice Interface': onWakeWord,
      'Hello Voice User Interface': onWakeWord,
      'Hey Voice User Interface': onWakeWord,
      'Click to Speak': onWakeWord,

      'How are you': onHowAreYou,
      'How are you doing': onHowAreYou,
      'Whats up': onHowAreYou,
      'Goodbye': onBye,
      'Bye': onBye,
      'See you': onBye,
      'Talk to you later': onBye,
      'Talk to you soon': onBye
    });
    listen.start();
    this.setState({ listening: true });
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
          if (this.state.listening) {
            console.log('Stop wake-word listening');
            listen.abort();
            this.setState({ listening: false });
          } else {
            console.log('Resume wake-word listening');
            listen.resume();
            this.setState({ listening: true });
          }
        }} color='yellow'>
          {
            this.state.listening ?
              'Stop wake-word listening' :
              'Resume wake-word listening'
          }
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
              ({ buttonRef, onClick, state, message }) => {
                savedOnClick = onClick
                return (
                  <Button
                    className='button'
                    onClick={wakeUp}
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
            }
          </Consumer>

          <Oscilloscope
            canvasWrapperClassName='canvasWrapper'
            canvasClassName='canvas'
          />
        </Vuics>
      </div>
    )
  }
}
