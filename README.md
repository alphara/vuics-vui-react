# vuics-vui-react

> Vuics.com React.js Component for Voice User Interface (VUI) integration

[![NPM](https://img.shields.io/npm/v/@vuics/vui-react.svg)](https://www.npmjs.com/package/@vuics/vui-react) [![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Description

A Set of React Components that provide easy usage of the [Vuics.com](https://vuics.com) API for building Voice User Interfaces for your website.

## Features

* Vuics API for building VUIs.
* Server-side Speech Synthesis and Speech Recognition with Vuics Speech API.
* Client-side Speech Synthesis and Speech Recognition with Web Speech API.
* Natural language understanding with Vuics API.
* Wake-word and sleep-word to enable/disable VUI with client-side speech recognition.
* Recording Audio from microphone.
* Default and custom Click-to-Speak Buttons.
* Oscilloscope component to visualize recording.
* Triggering actions by VUI events.
* Examples.
* And others.

## How to start?

Please do the following steps to integrate VUI into your React.js web application.

1. Sing up on [Vuics.com](https://vuics.com)
2. Contact us by [email](mailto:admin@vuics.com) with request to use Vuics API.
3. We will create a Vuics API Key and share to you.
4. Install the library and write the integration code (how? see below).
5. Feel free to ask us any questions or help with the integration.

## Install

```bash
npm i @vuics/vui-react
```

Additionally, you may need to install the following packages:
```
npm i prop-types react react-dom react-scripts webworkify-webpack
```

## Usage

Please contact us on Vuics.com to get credentials such as:
```
export REACT_APP_VUICS_API_KEY=
```

Then add the code below into your React.js application:
```javascript
import React, {
  Component
} from 'react'

import {
  Vuics,
  initVuics,
  ButtonDefault,
  Oscilloscope,
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

        <Oscilloscope
          canvasWrapperClassName='canvasWrapper'
          canvasClassName='canvas'
        />
      </Vuics>

    </div>
  )
}
```

## Examples

See examples in the [examples](./examples/) dir.

* [Click-to-Speak](./examples/click-to-speak/) example demonstrates usage of Click-To-Speak button for Voice User Interface.
* [Wake-Word](./examples/wake-word) example demontrate usage of Wake-Word and Sleep-Word for managing Voice User Interface.

## API

### Initialize Vuics
```
initVuics({
  apiKey: process.env.REACT_APP_VUICS_API_KEY, // API key
  apiUrl: process.env.REACT_APP_VUICS_API_URL, // API URL, default: https://api.vuics.com/latest
})
```

### React.js components

* `Vuics` - context provider component for voice user interface.

* `ButtonDefault` - default Click-To-Speek button that enables recording
from microphone and passing audio to voice user interface.

* `Oscilloscope` - visualizes audio recording.

* `Consumer` - makes available to use custom Click-To-Speak buttons.

### Client-side Speech API classes

#### Synthesizer

Synthesizer is a class for client-side speech synthesis.

* `Synthesizer.speak{{ phrase }}` - synthesizes text-to-speech and play the speech as audio.

#### Recognizer

Recognizer is a class for client-side speech recognition.

* `isSupported()` - returns true if speech recognition is supported by browser, or false if it's not supported.

* `start()` - start listening.

* `abort()` - stop listening, and turn off mic.

* `pause()` - pause listening.

* `resume()` - resumes listening and restores command callback execution when a result matches. If SpeechRecognition was aborted (stopped), start it.

* `addCommands({ 'command1': handler1, ... })` - add commands that Recognizer will respond to.

* `isListening()` - returns true if speech recognition is currently on. Returns false if speech recognition is off or Recognizer is paused.

Recognizer API is described additionally [here](./docs/Recognizer-API.md)

## License

ISC

## Questions

Some frequently asked questions answered here: [FAQ](./docs/FAQ.md)

Do you have any additional questions?

Feel free to ask us any questions. We would love to help with the integration.

You could contact us by [email](mailto:admin@vuics.com) or on [Vuics.com](https://vuics.com).

