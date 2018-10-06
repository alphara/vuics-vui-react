import React, {
  Component
} from 'react'

import {
  Vuics,
  initVuics,
  ButtonDefault,
  Oscillograph,
  Consumer
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
  onData = data => {
    console.log('intentName:', data.intentName)
  }

  render = () => (
    <div>
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
        </Consumer>

        <Oscillograph
          canvasWrapperClassName='canvasWrapper'
          canvasClassName='canvas'
        />
      </Vuics>

    </div>
  )
}
