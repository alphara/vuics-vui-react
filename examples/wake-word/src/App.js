import React, {
  Component
} from 'react'

import {
  Vuics,
  initVuics,
  ButtonDefault,
  Oscilloscope,
  Consumer,
  Synthesizer,
  Recognizer,
} from '@vuics/vui-react'

import {
  Button,
  Loader,
  Radio,
} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

initVuics({
  apiKey: process.env.REACT_APP_VUICS_API_KEY
})

export default class App extends Component {
  onData = data => {
    console.log('intentName:', data.intentName)
    Recognizer.resume();
    this.setState({ recognizing: true });
  }

  state = {
    recognizing: false,
  };

  savedOnClick = () => {};

  wakeUp = () => { console.log('wakeUp'); this.savedOnClick(); }

  componentDidMount = () => {
    const onWakeWord = () => {
      Synthesizer.speak({ phrase: 'Listening' });
      setTimeout(this.wakeUp, 1000);
      Recognizer.abort(); // alternative way: Recognizer.pause();
      this.setState({ recognizing: false });
    }

    const onSleepWord = () => {
      Synthesizer.speak({ phrase: 'Talk to you soon' });
      Recognizer.abort();
      this.setState({ recognizing: false });
    }

    Recognizer.addCommands({
      'Hello Voice': onWakeWord,
      'Hey Voice': onWakeWord,
      'Hi Voice': onWakeWord,
      'Hello Vuics': onWakeWord,
      'Hey Vuics': onWakeWord,
      'Hi Vuics': onWakeWord,
      'Hello Voice Interface': onWakeWord,
      'Hey Voice Interface': onWakeWord,
      'Hi Voice Interface': onWakeWord,
      'Hello Voice User Interface': onWakeWord,
      'Hey Voice User Interface': onWakeWord,
      'Hi Voice User Interface': onWakeWord,
      'Click to Speak': onWakeWord,

      'Goodbye Voice': onSleepWord,
      'Bye Voice': onSleepWord,
      'Bye-bye Voice': onSleepWord,
      'Goodbye Vuics': onSleepWord,
      'Bye Vuics': onSleepWord,
      'Bye-bye Vuics': onSleepWord,
      'Goodbye Voice Interface': onSleepWord,
      'Bye Voice Interface': onSleepWord,
      'Bye-bye Voice Interface': onSleepWord,
      'Goodbye Voice User Interface': onSleepWord,
      'Bye Voice User Interface': onSleepWord,
      'Bye-bye Voice User Interface': onSleepWord,
    });
    Recognizer.start();
    this.setState({ recognizing: true });
  }

  render = () => {
    return (
      <div>
        <Button onClick={() => {
          Synthesizer.speak({ phrase: 'Hello!   I am your Voice User Interface.'})
        }} color='blue'>
          Speak
        </Button>
        <Radio toggle
          label={
            Recognizer.isSupported() ?
              'Wake-Word "Hello Voice" ' :
              'No browser support of Wake-Word '
          }
          disabled={!Recognizer.isSupported()}
          checked={this.state.recognizing}
          onChange={(event, data) => {
            if (data.checked) {
              Recognizer.resume();
            } else {
              Recognizer.abort();
            }
            this.setState({ recognizing: data.checked })
          }}
        />

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
                this.savedOnClick = onClick
                return (
                  <Button
                    className='button'
                    onClick={this.wakeUp}
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
