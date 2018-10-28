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
  Portal,
  // Divider,
  Placeholder,
  Card,
  Form,
  Modal,
  Grid,
} from 'semantic-ui-react'
import 'semantic-ui-css/semantic.min.css'

import ReactJsonView from 'react-json-view'
import WebsiteExample from './website-example.json'

initVuics({
  apiKey: process.env.REACT_APP_VUICS_API_KEY
})

const options = [
  { key: 'Male', text: 'Male', value: 'Male' },
  { key: 'Female', text: 'Female', value: 'Female' },
];

export default class App extends Component {
  state = {
    recognizing: false,
    messageVisible: false,
    messageHeader: 'Message Header',
    messageContent: 'Message Content',
    messagePositive: true,
    messageInfo: false,
    node: null,
    modalOpen: false,
    form: {
      FirstName: '',
      LastName: '',
      Size: '',
      Gender: '',
      About: '',
      Agree: false,
    },
    submittedVisible: false,
    submittedHeader: '',
    submittedContent: '',
  };

  handleOpen = () => this.setState({ modalOpen: true })

  handleClose = () => this.setState({ modalOpen: false })

  handleMessageDismiss = () => {
    this.setState({ messageVisible: false })
  }

  handleSubmittedDismiss = () => {
    this.setState({ submittedVisible: false })
  }

  handleFormChange = (e, { name, value }) => this.setState(({ form }) => {
    form[name] = value;
    return { form };
  })

  handleFormSubmit = () => {
    this.setState({
      submittedVisible: true,
      submittedHeader: 'The form has been submitted',
      submittedContent: (<div>
                          <br/>
                          Submitted fields:<br/>
                          <pre>
                            {JSON.stringify(this.state.form, null, 2)}
                          </pre>
                        </div>),
    });
  }

  showMessage = ({
    messageHeader, messageContent, messagePositive = false, messageInfo = false
  } = {}) => {
    this.setState({
      messageVisible: true,
      messageHeader,
      messageContent,
      messagePositive,
      messageInfo,
    });
    setTimeout(() => {
      this.setState({ messageVisible: false })
    }, 10000);
  }

  fillFormFromSlots = (slots) => {
    const capitalizeFirstLetter = (string) => {
      return string.charAt(0).toUpperCase() + string.slice(1);
    }

    this.setState({
      form: {
        FirstName: slots.FirstName ? capitalizeFirstLetter(slots.FirstName) : '',
        LastName: slots.LastName ? capitalizeFirstLetter(slots.LastName) : '',
        Size: slots.Size ? capitalizeFirstLetter(slots.Size) : '',
        Gender: slots.Gender ? capitalizeFirstLetter(slots.Gender) : '',
        About: slots.About ? capitalizeFirstLetter(slots.About) : '',
        Agree: !!['yes', 'agree', 'confirm', 'approve', 1, true].includes(
                    slots.Agree
                  ),
      },
    });
  }

  onData = data => {
    console.log('intentName:', data.intentName);
    this.showMessage({
      messageHeader: data.intentName,
      messageContent: data.message,
      messagePositive: data.dialogState === 'Fulfilled',
      messageInfo: false
    });
    if (this.state.recognizing) {
      Recognizer.resume();
    }

    switch (data.intentName) {
      case 'GetStarted':
      case 'About':
        window.location = '#about';
        break;
      case 'Form':
        window.location = '#form';
        break;
      case 'Code':
        window.location = '#code';
        break;
      case 'Login':
        this.handleOpen();
        break;
      case 'FillForm':
        window.location = '#form';
        this.fillFormFromSlots(data.slots);
        if (data.dialogState === 'Fulfilled') {
          this.handleFormSubmit();
        }
        break;
      default:
    }
  }

  savedOnClick = () => {};

  wakeUp = () => { this.savedOnClick(); }

  componentDidMount = () => {
    const onWakeWord = (greeting, vuiname) => {
      Synthesizer.speak({ phrase: 'Listening' });
      setTimeout(this.wakeUp, 1000);
      Recognizer.abort();
      this.showMessage({
        messageHeader: 'Wake-word',
        messageContent: 'Listening',
        messageInfo: true,
      });
    }

    const onSleepWord = (farewell, vuiname) => {
      Synthesizer.speak({ phrase: 'Talk to you soon' });
      Recognizer.abort();
      this.setState({ recognizing: false });
      this.showMessage({
        messageHeader: 'Sleep-word',
        messageContent: 'Sleeping',
        messageInfo: true,
      });
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
        <Menu fixed='top' style={{ height: '4em' }}>
          <Container>
            <Vuics
              name='WebsiteExample'
              onConversationData={this.onData}
              fillStyle='white'
              lineWidth={1}
              strokeStyle='teal'
            >
              <Menu.Item header>
                <a href='https://vuics.com' target="_blank" rel="noopener noreferrer">
                <Image size='mini' src='/logo/vuics-icon-vui.png' verticalAlign='middle' spaced='right'/>
                Vuics
                </a>
              </Menu.Item>
              <Menu.Item color='teal'>
                <a href="#about">
                  <Icon name='building outline' />&nbsp;
                  About
                </a>
              </Menu.Item>
              <Menu.Item>
                <a href="#form">
                  <Icon name='edit' />&nbsp;
                  Form
                </a>
              </Menu.Item>
              <Menu.Item>
                <a href="#code">
                <Icon name='code' />&nbsp;
                Code
                </a>
              </Menu.Item>
              <Menu.Item>
                <Button inverted primary color='green' onClick={this.handleOpen}>
                  Log in / Sign Up
                </Button>
              </Menu.Item>
              <Menu.Item position='right'>
                <Radio toggle
                  label={
                    Recognizer.isSupported() ?
                      'Wake-word' :
                      'No support'
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
                <Oscilloscope
                  canvasWrapperClassName='canvasWrapper'
                  canvasClassName='canvas'
                  width={100}
                  height={20}
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
                          color='teal'
                        >
                          {
                            state === 'Passive' ? (<span><Icon name='bullhorn'/>VUI</span>) :
                            state === 'Listening' ? (<span><Icon name='microphone'/></span>) :
                            state === 'Sending' ? (<Loader active size='tiny' inline='centered' />) :
                            (<span><Icon name='headphones'/></span>)
                          }
                        </Button>
                      )
                    }
                  }
                </Consumer>
              </Menu.Item>
            </Vuics>
          </Container>
        </Menu>

        <Portal open={this.state.messageVisible}>
          <Segment style={{
            left: '33%',
            position: 'fixed',
            top: '10%',
            zIndex: 1000,
            padding: '0 0 0 0',
            border: 'none',
            width: '40em',
          }}>
            <Message
              floating
              positive={this.state.messagePositive}
              info={this.state.messageInfo}
              warning={!this.state.messagePositive && !this.state.messageInfo}
              onDismiss={this.handleMessageDismiss}
            >
              <Message.Header>
                <Icon name='bullhorn' />
                {this.state.messageHeader}
              </Message.Header>
              {this.state.messageContent}
            </Message>
          </Segment>
        </Portal>

        <div id='main'/>
        <Segment
          vertical inverted
          style={{ minHeight: '700px', paddingTop: '18em', textAlign: 'center' }}
        >
          <Header as='h1' icon textAlign='center'>
            <Icon name='rocket' circular/>
            <Header.Content>
              Your Website
              <Header.Subheader as='i' style={{ color: 'grey' }}>
                A Website Example with<br/> Voice User Interface integrated.
              </Header.Subheader>
            </Header.Content>
          </Header>
          <Button size='huge' color='teal' style={{ marginTop: '5em' }}>
            <a href="#about" style={{ color: 'white', }}>
              Get Started
              <Icon name='right arrow' />
            </a>
          </Button>
        </Segment>

        <Container text style={{ marginTop: '3em', textAlign: 'center' }}>
          <div id='about'/>
          <Segment style={{ textAlign: 'left', padding: '9em 0' }} vertical>
            <Header as='h1' color='teal' textAlign='center'>
              <Icon name='building outline' />&nbsp;
              About
            </Header>

            <br/>
            <Placeholder fluid>
              <Placeholder.Header image>
                <Placeholder.Line />
                <Placeholder.Line />
              </Placeholder.Header>
              <Placeholder.Paragraph>
                <Placeholder.Line />
                <Placeholder.Line />
                <Placeholder.Line />
              </Placeholder.Paragraph>
            </Placeholder>
            <br/>
            <br/>

            <p style={{ fontSize: '1.33em' }}>
              The Website Example has integrated Voice User Interface (VUI).
              Try it!
            </p>
            <p style={{ fontSize: '1em' }}>
              Click the <b>"VUI"</b> button in the right-top corner or
              simply say <b><i>"Hello Voice"</i></b> wake-word,
              and then:
            </p>

            <List bulleted>
              <List.Item>
                Navigate with commands: <i>"Go to about"</i>,
                <i>"Open form"</i> and <i>"Show me code"</i>.
              </List.Item>
              <List.Item>
                Log in and Sign up with <i>"Log in"</i>, or <i>"Sign up"</i>.
              </List.Item>
              <List.Item>
                Submit a form<i>"Fill out the form"</i>.
              </List.Item>
            </List>

            <p style={{ fontSize: '1em' }}>
              If you want disable using wake-word,
              say <i>"Goodbye Voice"</i> sleep-word.
            </p>
            <br/>
            <br/>
            <Placeholder fluid>
              <Placeholder.Paragraph>
                <Placeholder.Line />
                <Placeholder.Line />
                <Placeholder.Line />
              </Placeholder.Paragraph>
            </Placeholder>
            <br/>
            <br/>

            <Card.Group itemsPerRow={3}>
              <Card>
                <Card.Content>
                  <Placeholder>
                    <Placeholder.Image square />
                  </Placeholder>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content>
                  <Placeholder>
                    <Placeholder.Image square />
                  </Placeholder>
                </Card.Content>
              </Card>
              <Card>
                <Card.Content>
                  <Placeholder>
                    <Placeholder.Image square />
                  </Placeholder>
                </Card.Content>
              </Card>
            </Card.Group>
          </Segment>

          <div id='form'/>
          <Segment style={{ textAlign: 'left', padding: '9em 0' }} vertical>
            <Header as='h1' color='teal' textAlign='center'>
              <Icon name='edit' />&nbsp;
              Form
            </Header>
            <br/>
            <br/>

            <Form onSubmit={this.handleFormSubmit}>
              <Form.Group widths='equal'>
                <Form.Input
                  fluid
                  label='First name'
                  placeholder='First name'
                  name='FirstName'
                  value={this.state.form.FirstName}
                  onChange={this.handleFormChange}
                />
                <Form.Input
                  fluid
                  label='Last name'
                  placeholder='Last name'
                  name='LastName'
                  value={this.state.form.LastName}
                  onChange={this.handleFormChange}
                />
                <Form.Select
                  fluid
                  label='Gender'
                  options={options}
                  placeholder='Gender'
                  name='Gender'
                  value={this.state.form.Gender}
                  onChange={this.handleFormChange}
                />
              </Form.Group>
              <Form.Group inline>
                <label>Size</label>
                <Form.Radio
                  label='Small'
                  value='Small'
                  name='Size'
                  checked={this.state.form.Size === 'Small'}
                  onChange={this.handleFormChange}
                />
                <Form.Radio
                  label='Medium'
                  value='Medium'
                  name='Size'
                  checked={this.state.form.Size === 'Medium'}
                  onChange={this.handleFormChange}
                />
                <Form.Radio
                  label='Large'
                  value='Large'
                  name='Size'
                  checked={this.state.form.Size === 'Large'}
                  onChange={this.handleFormChange}
                />
              </Form.Group>
              <Form.TextArea
                label='About'
                placeholder='Tell us more about you...'
                name='About'
                value={this.state.form.About}
                onChange={this.handleFormChange}
              />
              <Form.Checkbox
                label='I agree to the Terms and Conditions'
                name='Agree'
                checked={this.state.form.Agree}
                onChange={this.handleFormChange}
              />
              <br/>
              <Form.Button floated='right'>Submit</Form.Button>
            </Form>
            <br/>
            <br/>
            {
              this.state.submittedVisible && (
                <Message info onDismiss={this.handleSubmittedDismiss}>
                  <Message.Header>{this.state.submittedHeader}</Message.Header>
                  {this.state.submittedContent}
                </Message>
              )
            }
          </Segment>

          <div id='code'/>
          <Segment style={{ textAlign: 'left', padding: '9em 0' }} vertical>
            <Header as='h1' color='teal' textAlign='center'>
              <Icon name='code' />&nbsp;
              Code
            </Header>

            <p>
              This is a code of the Website example voice user interface.
            </p>
            <p>
              <b>Try</b> to <i>code</i> it on the&nbsp;
              <a href="https://vuics.com/builder" target="_blank" rel="noopener noreferrer">
                <b>Vuics.com</b>
              </a>&nbsp;
              platform.
            </p>
            <ReactJsonView
              src={WebsiteExample}
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
              <a href="https://github.com/alphara/vuics-vui-react/tree/master/examples/website" target="_blank" rel="noopener noreferrer">
                <b>Website</b>
              </a>&nbsp;
              example on GitHub.
            </p>
          </Segment>
        </Container>

        <Segment inverted vertical style={{ margin: '1em 0em 0em', padding: '5em 0 5em' }}>
          <Container textAlign='center'>
            <List horizontal inverted divided link>
              <List.Item as='a' href='/' target="_blank" rel="noopener noreferrer">
                Vuics Website Example with Voice User Interface integrated.
              </List.Item>
              <List.Item as='a' href='https://vuics.com' target="_blank" rel="noopener noreferrer">
                © 2018, Vuics
              </List.Item>
            </List>
          </Container>
        </Segment>

        <Modal
          open={this.state.modalOpen}
          onClose={this.handleClose}
          size='small'
          closeIcon
          basic
        >
          <Modal.Content>
            <Grid textAlign='center' style={{ height: '100%' }} verticalAlign='middle'>
              <Grid.Column style={{ maxWidth: 450 }}>
                <Header as='h2' color='teal' textAlign='center'>
                  Log-in to your account
                </Header>
                <br/>
                <br/>
                <Form size='large'>
                  <Segment stacked>
                    <Form.Input fluid icon='user' iconPosition='left' placeholder='E-mail address' />
                    <Form.Input
                      fluid
                      icon='lock'
                      iconPosition='left'
                      placeholder='Password'
                      type='password'
                    />

                    <Button color='teal' fluid size='large'>
                      Login
                    </Button>
                  </Segment>
                </Form>
                <Message>
                  New to us? <Button>Sign Up</Button>
                </Message>
              </Grid.Column>
            </Grid>

          </Modal.Content>
        </Modal>

      </div>
    )
  }
}
