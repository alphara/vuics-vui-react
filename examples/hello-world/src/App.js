import React, {
  Component
} from 'react'

import {
  Vuics,
  initVuics,
  ButtonDefault,
  Oscilloscope,
} from '@vuics/vui-react'

import {
  Segment,
  Header,
  Grid,
  Form,
  Message,
  Accordion,
  Icon,
} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

initVuics({
  apiKey: process.env.REACT_APP_VUICS_API_KEY
})

export default class App extends Component {
  onData = data => {
    console.log('intentName:', data.intentName)
  }

  state = {
    activeIndex: -1
  }

  handleClick = (e, titleProps) => {
    const { index } = titleProps
    const { activeIndex } = this.state
    const newIndex = activeIndex === index ? -1 : index

    this.setState({ activeIndex: newIndex })
  }

  render = () => {
    const { activeIndex } = this.state
    return (
      <div>
        <style>
          {`
            body > div,
            body > div > div,
            body > div > div > div.login-form {
              height: 100%;
              background-color: mintcream;
            }
          `}
        </style>

        <Grid textAlign='center' style={{ height: '100%' }} verticalAlign='middle'>
          <Grid.Column style={{ maxWidth: 450 }}>
            <Header as='h1' color='teal' textAlign='center'>
              Hello World!
              <Header.Subheader>Vuics Example</Header.Subheader>
            </Header>
            <Form size='large'>
              <Segment>
                <p>
                  You could <i>click</i> on the button and say <b>"Hi"</b>.
                </p>

                <Vuics
                  name='HelloWorld'
                  onConversationData={this.onData}
                  fillStyle='rgb(255,255,255)'
                  lineWidth={1}
                  strokeStyle='pink'
                >
                  <Oscilloscope
                    canvasWrapperClassName='canvasWrapper'
                    canvasClassName='canvas'
                  />
                  <ButtonDefault
                    className='button'
                  />
                </Vuics>
              </Segment>
            </Form>

            <br/>

            <Accordion styled>
              <Accordion.Title active={activeIndex === 0} index={0} onClick={this.handleClick}>
                <Icon name='dropdown' />
                See code
              </Accordion.Title>
              <Accordion.Content active={activeIndex === 0}>
                <p>
                  This is a code of the Hello World voice user interface.
                </p>
                <Message size='small' floating>
                  <pre style={{ textAlign: 'left' }}>
                    { JSON.stringify({
                      name: 'HelloWorld',
                      intents: [
                        {
                          name: 'Hello',
                          sampleUtterances: [
                            'Hello',
                            'Hi',
                            'Hey'
                          ],
                          answer: 'Hello World!'
                        }
                      ]
                    }, null, 2)}
                  </pre>
                </Message>
                <p>
                  <b>Try</b> to <i>code</i> it on the&nbsp;
                  <a href="https://vuics.com/builder" target="_blank" rel="noopener noreferrer">
                    <b>Vuics.com</b>
                  </a>&nbsp;
                  platform.
                </p>
                <p>
                  Find the &nbsp;
                  <a href="https://github.com/alphara/vuics-vui-react/tree/master/examples/hello-world" target="_blank" rel="noopener noreferrer">
                    <b>source code</b>
                  </a>&nbsp;
                  on GitHub.
                </p>
              </Accordion.Content>
            </Accordion>

          </Grid.Column>
        </Grid>
      </div>
    )
  }
}
