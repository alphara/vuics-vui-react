import React, {
  Component
} from 'react'

import {
  Vuics,
  initVuics,
  Oscilloscope,
  Consumer,
  Synthesizer,
  Recognizer,
} from '@vuics/vui-react'

import {
  Segment,
  Header,
  Message,
  Icon,
  Button,
  Loader,
  Radio,
  Menu,
  Container,
  List,
  Image,
} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

import ReactJsonView from 'react-json-view'
import OrderCoffee from './ordercoffee.json'

initVuics({
  apiKey: process.env.REACT_APP_VUICS_API_KEY
})

export default class App extends Component {
  state = {
    recognizing: false,
    messageVisible: false,
    messageHeader: '',
    messageContent: '',
  };

  handleMessageDismiss = () => {
    this.setState({ messageVisible: false })
  }

  onData = data => {
    console.log('intentName:', data.intentName);
    if (data.dialogState === 'Fulfilled') {
      this.setState({
        messageVisible: true,
        messageHeader: 'Coffee Ordered',
        messageContent: data.message,
      });
    }
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
        <Menu fixed='top' inverted>
          <Container text>
            <Menu.Item header>
              <a href='https://vuics.com' target="_blank" rel="noopener noreferrer">
              <Image size='mini' src='/logo/vuics-icon-vui.png' verticalAlign='middle' spaced='right'/>
              Vuics
              </a>
            </Menu.Item>
            <Menu.Item>
              <a href="#main">
                <Icon name='coffee' inverted />&nbsp;
                Order Coffee
              </a>
            </Menu.Item>
            <Menu.Item>
              <a href="#vui">
                <Icon name='bullhorn' inverted />&nbsp;
                Voice User Interface
              </a>
            </Menu.Item>
            <Menu.Item>
              <a href="#code">
              <Icon name='code' inverted />&nbsp;
              Code
              </a>
            </Menu.Item>
          </Container>
        </Menu>

        <Container text style={{ marginTop: '3em', textAlign: 'center' }}>
          <div id='main'/>
          <Segment style={{ padding: '5em 0' }} vertical>

            <Header as='h1' color='brown' icon textAlign='center'>
              <Icon name='coffee' circular />
              <Header.Content>
                Order Coffee
                <Header.Subheader as='i'>
                  Vuics Example
                </Header.Subheader>
              </Header.Content>
            </Header>
          </Segment>
          <div id='vui'/>
          <Segment style={{ padding: '5em 0' }} vertical>
            <Header as='h1' color='green' textAlign='center'>
              Voice User Interface
            </Header>
            <br/>
            <p>
              You could <i>click</i> on the button and say <b>"Order coffee"</b>.
            </p>
            <br/>
            <Radio toggle
              label={
                Recognizer.isSupported() ?
                  'Wake-Word "Hello Voice", Sleep-Word "Goodbye Voice"' :
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
            <br/>
            <br/>

            <Vuics
              name='OrderCoffee'
              onConversationData={this.onData}
              fillStyle='white'
              lineWidth={2}
              strokeStyle='rgb(33,186,70)'
            >
              <Oscilloscope
                canvasWrapperClassName='canvasWrapper'
                canvasClassName='canvas'
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
                          state === 'Passive' ? (<span>Click to Speak</span>) :
                          state === 'Listening' ? (<span><Icon name='microphone'/> Say phrase</span>) :
                          state === 'Sending' ? (<Loader active inline='centered' />) :
                          (<span><Icon name='headphones'/>{message}</span>)
                        }
                      </Button>
                    )
                  }
                }
              </Consumer>
            </Vuics>
            <br/>
            <br/>
            {
              this.state.messageVisible && (
                <Message info onDismiss={this.handleMessageDismiss}>
                  <Message.Header>{this.state.messageHeader}</Message.Header>
                  {this.state.messageContent}
                </Message>
              )
            }
          </Segment>

          <div id='code'/>
          <Segment style={{ textAlign: 'left', padding: '5em 0' }} vertical>
            <Header as='h1' color='blue' textAlign='center'>
              Code
            </Header>

            <p>
              This is a code of the Order Coffee voice user interface.
            </p>
            <p>
              <b>Try</b> to <i>code</i> it on the&nbsp;
              <a href="https://vuics.com/builder" target="_blank" rel="noopener noreferrer">
                <b>Vuics.com</b>
              </a>&nbsp;
              platform.
            </p>
            <ReactJsonView
              src={OrderCoffee}
              name={null}
              collapsed={false}
              indentWidth={2}
              enableClipboard={true}
              displayObjectSize={false}
              displayDataTypes={false}
            />
            <br/>
            <p>
              You could find a full source code of the&nbsp;
              <a href="https://github.com/alphara/vuics-vui-react/tree/master/examples/order-coffee" target="_blank" rel="noopener noreferrer">
                <b>Order Coffee</b>
              </a>&nbsp;
              example on GitHub.
            </p>
          </Segment>
        </Container>

        <Segment inverted vertical style={{ margin: '1em 0em 0em', padding: '5em 0 5em' }}>
          <Container textAlign='center'>
            <List horizontal inverted divided link>
              <List.Item as='a' href='https://vuics.com' target="_blank" rel="noopener noreferrer">
                <Image size='tiny' src='/logo/vuics-icon-vui.png'/><br/>
                Vuics
              </List.Item>
            </List>
          </Container>
        </Segment>
      </div>
    )
  }
}
