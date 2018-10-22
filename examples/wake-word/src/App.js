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
  state = {
    recognizing: false,
  };

  onData = data => {
    console.log('intentName:', data.intentName)
    if (this.state.recognizing) {
      Recognizer.resume();
    }
  }

  savedOnClick = () => {};

  wakeUp = () => { console.log('wakeUp'); this.savedOnClick(); }

  componentDidMount = () => {
    const onWakeWord = (greeting, vuiname) => {
      console.log('greeting:', greeting, ', vuiname:', vuiname);
      Synthesizer.speak({ phrase: 'Listening' });
      setTimeout(this.wakeUp, 1000);
      Recognizer.abort(); // alternative way: Recognizer.pause();
    }

    const onSleepWord = (farewell, vuiname) => {
      console.log('farewell:', farewell, ', vuiname:', vuiname);
      Synthesizer.speak({ phrase: 'Talk to you soon' });
      Recognizer.abort();
      this.setState({ recognizing: false });
    }

    Recognizer.addCommands({
      ':greeting :vuiname': {
        'regexp': /^(Hello|Hey|Hi) (Vuics|Voice|Voice Interface|Voice User Interface)$/,
        'callback': onWakeWord,
      },
      'Click to Speak': onWakeWord,

      ':farewell :vuiname': {
        'regexp': /^(Goodbye|Bye|Bye-bye) (Vuics|Voice|Voice Interface|Voice User Interface)$/,
        'callback': onSleepWord,
      },
    });
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
          name='VuicsHome'
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
