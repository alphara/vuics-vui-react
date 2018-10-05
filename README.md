# vuics-vui-react

> Vuics React.js Component for Voice User Interface integration

[![NPM](https://img.shields.io/npm/v/@vuics/vui-react.svg)](https://www.npmjs.com/package/@vuics/vui-react) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Install

```bash
npm i @vuics/vui-react
```

Additionally, you may need to install the following packages:
```
npm i prop-types react react-dom react-scripts aws-sdk webworkify-webpack
```

## Usage

Please contact us on Vuics.com to get credentials such as:
```
export REACT_APP_VUICS_API_KEY=
```

Then add the code below into your React.js application:
```jsx
import React, { Component } from 'react'

import {
  Vuics,
  initVuics,
  ButtonDefault,
  Analyzer,
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

  render = () => {
    return (
      <div>
        <Vuics
          vuicsVuiId='VuicsHome'
          onConversationData={this.onData}
          fillStyle='rgb(27,28,29)'
          lineWidth={2}
          strokeStyle='rgb(33,186,70)'
        >
          <ButtonDefault />

          <Consumer>
            {
              ({ buttonRef, onClick, className, disabled, children, state, message }) => (
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

          <Analyzer
            canvasWrapperClassName='canvasWrapper'
            canvasClassName='canvas'
          />
        </Vuics>

      </div>
    )
  }
}
```

## API

### Initialize Vuics
```
initVuics({
  apiKey: process.env.REACT_APP_VUICS_API_KEY, // API key
  apiUrl: process.env.REACT_APP_VUICS_API_URL, // API URL, default: https://api.vuics.com/latest
})
```

## License

ISC
