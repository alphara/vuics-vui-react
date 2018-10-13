import React, {
  Component,
  createRef,
  createContext
} from 'react'
import PropTypes from 'prop-types'

import {
  Conversation
} from './vui'

export const {
  Provider,
  Consumer
} = createContext('VuicsContext')

const synth = window.speechSynthesis;

const SpeechRecognition =
  window.SpeechRecognition ||
  window.webkitSpeechRecognition ||
  window.mozSpeechRecognition ||
  window.msSpeechRecognition ||
  window.oSpeechRecognition;

const callbacks = {
  start: [],
  error: [],
  end: [],
  soundstart: [],
  result: [],
  resultMatch: [],
  resultNoMatch: [],
  errorNetwork: [],
  errorPermissionBlocked: [],
  errorPermissionDenied: []
};

const debugStyle = 'font-weight: bold; color: #00f;';
// The command matching code is a modified version of Backbone.Router by Jeremy Ashkenas, under the MIT license.
const optionalParam = /\s*\((.*?)\)\s*/g;
const optionalRegex = /(\(\?:[^)]+\))\?/g;
const namedParam = /(\(\?)?:\w+/g;
const splatParam = /\*\w+/g;
const escapeRegExp = /[\-{}\[\]+?.,\\\^$|#]/g; // eslint-disable-line no-useless-escape

export default class Vuics extends Component {
  constructor (props) {
    super(props)

    if (synth) {
      this.voices = synth.getVoices()

      if (synth.onvoiceschanged !== undefined) {
        synth.onvoiceschanged = this.onVoicesChanged
      }
    } else {
      this._logMessage('SpeechSynthezis does not supported by your browser!');
    }

    if (SpeechRecognition) {
      this.recognition = null

      this.init({
        commands: {},
        resetCommands: false,
        lang: props.locale
      })
    } else {
      this._logMessage('SpeechRecognition does not supported by your browser!');
    }

    this.buttonRef = createRef()
    this.canvasWrapperRef = createRef()
    this.canvasRef = createRef()

    this.conversation = null
    this.canvasCtx = null
  }

  componentDidMount = () => {
    this.addCommands(this.props.commands)
  }

  static propTypes = {
    locale: PropTypes.string.isRequired,
    commands: PropTypes.object.isRequired,

    children: PropTypes.node.isRequired,

    vuicsVuiId: PropTypes.string.isRequired,
    onConversationData: PropTypes.func.isRequired,

    fillStyle: PropTypes.string,
    lineWidth: PropTypes.number,
    strokeStyle: PropTypes.string
  }

  static defaultProps = {
    fillStyle: 'rgb(27,28,29)',
    lineWidth: 2,
    strokeStyle: 'rgb(33,186,70)'
  }

  state = {
    commandsList: [],
    autoRestart: false,
    lastStartedAt: 0,
    autoRestartCount: 0,
    debugState: true,
    pauseListening: false,
    recognizing: false,

    transcript: '',
    listening: false,
    state: 'Passive',
    message: 'Click to Speak!'
  };

  componentDidMount = () => {
    window.addEventListener('resize', this.setCanvasDimensions)

    this.setCanvasDimensions()

    this.canvasCtx = this.canvasRef.current.getContext('2d')
  }

  componentWillUnmount = () => {
    window.removeEventListener('resize', this.setCanvasDimensions)
  }

  onVoicesChanged = () => {
    this.voices = synth.getVoices();
  }

  speak = ({
    phrase,
    onEnd = () => {},
    onError = () => {},
    voiceIndex = 0,
    pitch = 1,
    rate = 1
  }) => {
    if (synth.speaking) {
      console.error('Synthesizer is already speaking.');
      return;
    }
    this.setState(
      () => ({
        listening: false,
        recognizing: false
      })
    )

    const utterThis = new window.SpeechSynthesisUtterance(phrase);

    utterThis.onend = onEnd
    utterThis.onerror = onError

    utterThis.voice = this.voices[voiceIndex];
    utterThis.pitch = pitch;
    utterThis.rate = rate;

    synth.speak(utterThis);
  }

  init = ({ commands, resetCommands = true, lang = 'en-US' }) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    if (
      this.recognition !== null &&
      this.recognition.abort
    ) {
      this.recognition.abort();
    }

    this.recognition = new SpeechRecognition();

    this.recognition.maxAlternatives = 5;

    // In HTTPS, turn off continuous mode for faster results.
    // In HTTP,  turn on  continuous mode for much slower results, but no repeating security notices
    this.recognition.continuous = window.location.protocol === 'http:';

    this.recognition.lang = lang;
    // this.recognition.lang = 'ru-RU';

    this.recognition.onstart = () => {
      console.log('recognition onstart')

      this.setState(
        () => ({
          listening: true
        }),
        () => {
          this._invokeCallbacks(callbacks.start)
        }
      )
    };

    this.recognition.onsoundstart = () => {
      this._invokeCallbacks(callbacks.soundstart);
    };

    this.recognition.onerror = event => {
      console.log('recognition onerror')

      this._invokeCallbacks(callbacks.error, event);

      switch (event.error) {
        case 'network':
          this._invokeCallbacks(callbacks.errorNetwork, event);
          break;
        case 'not-allowed':
        case 'service-not-allowed':
          this.setState(
            () => ({
              autoRestart: false
            })
          )

          if (new Date().getTime() - this.state.lastStartedAt < 200) {
            this._invokeCallbacks(callbacks.errorPermissionBlocked, event);
          } else {
            this._invokeCallbacks(callbacks.errorPermissionDenied, event);
          }
          break;
        default:
      }
    };

    this.recognition.onend = () => {
      console.log('recognition onend')

      this.setState(
        () => ({
          listening: false
        })
      )

      this._invokeCallbacks(callbacks.end);

      if (this.state.autoRestart) {
        const timeSinceLastStart =
          new Date().getTime() - this.state.lastStartedAt;

        this.setState(
          ({ autoRestartCount }) => ({
            autoRestartCount: autoRestartCount + 1
          })
        )

        if (this.state.autoRestartCount % 10 === 0) {
          if (this.state.debugState) {
            this._logMessage('Speech Recognition is repeatedly stopping and starting. Check that you are online and have opened only one window/tab with Speech Recognition in the browser.');
          }
        }

        if (timeSinceLastStart < 1000) {
          setTimeout(() => {
            this.start({
              paused: this.state.pauseListening
            });
          }, 1000 - timeSinceLastStart);
        } else {
          this.start({
            paused: this.state.pauseListening
          });
        }
      }
    };

    this.recognition.onresult = event => {
      console.log('recognition onresult')

      if (this.state.pauseListening) {
        if (this.state.debugState) {
          this._logMessage('Speech heard, but recognizer is paused');
        }

        return false;
      }

      const SpeechRecognitionResult = event.results[event.resultIndex];

      const results = [];

      for (let k = 0; k < SpeechRecognitionResult.length; k++) {
        results[k] = SpeechRecognitionResult[k].transcript;
      }

      this._parseResults(results);
    };

    if (resetCommands) {
      console.log('recognition resetCommands')

      this.setState(
        () => ({
          commandsList: []
        })
      )
    }

    if (Object.keys(commands).length > 0) {
      this.addCommands(commands);
    }
  }

  start = ({ paused, autoRestart, continuous }) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    this.setState(
      () => ({
        listening: false,
        recognizing: true,
        pauseListening: paused !== undefined ? !!paused : false,
        autoRestart: autoRestart !== undefined ? !!autoRestart : true,
        lastStartedAt: new Date().getTime()
      })
    )

    if (continuous !== undefined) {
      this.recognition.continuous = !!continuous;
    }

    try {
      this.recognition.start();
    } catch (e) {
      this.setState(
        () => ({
          listening: true,
          recognizing: false
        })
      )

      if (this.state.debugState) {
        this._logMessage(e.message);
      }
    }
  }

  abort = () => {
    if (!this.isRecognitionSupported()) {
      return
    }

    this.setState(
      () => ({
        recognizing: false,
        autoRestart: false,
        autoRestartCount: 0
      })
    )

    this.recognition.abort();
  }

  pause = () => {
    if (!this.isRecognitionSupported()) {
      return
    }

    this.setState(
      () => ({
        recognizing: false,
        pauseListening: true
      })
    )
  }

  resume = () => {
    if (!this.isRecognitionSupported()) {
      return
    }

    this.start({
      paused: true
    });
  }

  debug = (newState = true) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    this.setState(
      () => ({
        debugState: !!newState
      })
    )
  }

  setLanguage = (language) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    this.recognition.lang = language;
  }

  addCommands = (commands) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    Object.keys(commands).forEach((phrase) => {
      const cb = window[commands[phrase]] || commands[phrase];

      if (typeof cb === 'function') {
        this._registerCommand(this._commandToRegExp(phrase), cb, phrase);
      } else if (typeof cb === 'object' && cb.regexp instanceof RegExp) {
        this._registerCommand(new RegExp(cb.regexp.source, 'i'), cb.callback, phrase);
      } else {
        if (this.state.debugState) {
          this._logMessage('Can not register command: %c' + phrase, debugStyle);
        }
      }
    })
  }

  removeCommands = (commandsToRemove) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    if (commandsToRemove === undefined) {
      this.setState(
        () => ({
          commandsList: []
        })
      )
    } else {
      const arrayCommandsToRemove = Array.isArray(commandsToRemove)
        ? commandsToRemove
        : [commandsToRemove];

      this.setState(
        ({ commandsList }) => ({
          commandsList: commandsList.filter(command => {
            for (let i = 0; i < arrayCommandsToRemove.length; i++) {
              if (arrayCommandsToRemove[i] === command.originalPhrase) {
                return false;
              }
            }

            return true;
          })
        })
      )
    }
  }

  addCallback = (type, callback, context) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    const cb = window[callback] || callback;

    if (
      typeof cb === 'function' &&
      callbacks[type] !== undefined
    ) {
      callbacks[type].push({
        callback: cb,
        context: context || this
      });
    }
  }

  removeCallback = (type, callback) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    Object.keys(callbacks).forEach((callbackType) => {
      if (type === undefined || type === callbackType) {
        if (callback === undefined) {
          callbacks[callbackType] = [];
        } else {
          callbacks[callbackType] = callbacks[callbackType].filter((cb) => cb.callback !== callback);
        }
      }
    })
  }

  isListening = () => {
    if (!this.isRecognitionSupported()) {
      return
    }

    return (
      this.state.listening &&
      !this.state.pauseListening
    );
  }

  trigger = (sentences) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    if (!this.isListening()) {
      if (this.state.debugState) {
        if (!this.state.listening) {
          this._logMessage('Cannot trigger while recognizer is aborted');
        } else {
          this._logMessage('Speech heard, but recognizer is paused');
        }
      }

      return;
    }

    this._parseResults(!Array.isArray(sentences) ? [sentences] : sentences);
  }

  isRecognitionSupported = () => {
    if (!SpeechRecognition) {
      this._logMessage('SpeechRecognition does not supported by your browser!');

      return false;
    } else {
      return true
    }
  }

  _commandToRegExp = (command) => {
    command = command.replace(escapeRegExp, '\\$&')
      .replace(optionalParam, '(?:$1)?')
      .replace(namedParam, (match, optional) =>
        optional
          ? match
          : '([^\\s]+)'
      )
      .replace(splatParam, '(.*?)')
      .replace(optionalRegex, '\\s*$1?\\s*');

    return new RegExp('^' + command + '$', 'i');
  }

  _invokeCallbacks = (callbacks, ...args) => {
    callbacks.forEach((callback) => {
      callback.callback.apply(callback.context, args);
    });
  }

  _logMessage = (text, extraParameters) => {
    if (text.indexOf('%c') === -1 && !extraParameters) {
      console.log(text);
    } else {
      console.log(text, extraParameters || debugStyle);
    }
  }

  _registerCommand = (command, callback, originalPhrase) => {
    this.setState(
      ({ commandsList }) => ({
        commandsList: [
          ...commandsList, {
            command,
            callback,
            originalPhrase
          }
        ]
      })
    )

    if (this.state.debugState) {
      this._logMessage('Command successfully loaded: %c' + originalPhrase, debugStyle);
    }
  }

  _parseResults = (results) => {
    this._invokeCallbacks(
      callbacks.result,
      results
    );

    for (let i = 0; i < results.length; i++) {
      const commandText = results[i].trim();

      if (this.state.debugState) {
        this._logMessage('Speech recognized: %c' + commandText, debugStyle);
      }

      for (let j = 0, l = this.state.commandsList.length; j < l; j++) {
        const currentCommand = this.state.commandsList[j];

        const result = currentCommand.command.exec(commandText);

        if (result) {
          const parameters = result.slice(1);

          if (this.state.debugState) {
            this._logMessage('command matched: %c' + currentCommand.originalPhrase, debugStyle);

            if (parameters.length) {
              this._logMessage('with parameters', parameters);
            }
          }

          currentCommand.callback.apply(this, parameters, {
            isSynthesizerSupported: () => !!synth,
            isRecognitionSupported: this.isRecognitionSupported,

            speak: this.speak,

            state: this.state.state,
            transcript: this.state.transcript,
            message: this.state.message,
            recognizing: this.state.recognizing,
            listening: this.state.listening,

            onClick: this.onClick,

            start: this.start,
            abort: this.abort,
            pause: this.pause,
            resume: this.resume,
            debug: this.debug,
            setLanguage: this.setLanguage,
            addCommands: this.addCommands,
            removeCommands: this.removeCommands,
            addCallback: this.addCallback,
            removeCallback: this.removeCallback,
            isListening: this.isListening,
            trigger: this.trigger
          }); // eslint-disable-line babel/no-invalid-this

          this._invokeCallbacks(
            callbacks.resultMatch,
            commandText,
            currentCommand.originalPhrase,
            results
          );

          return;
        }
      }
    }

    this._invokeCallbacks(callbacks.resultNoMatch, results);
  }

  setCanvasDimensions = () => {
    this.setState(
      () => ({
        width: this.canvasWrapperRef.current.clientWidth,
        height: this.canvasWrapperRef.current.clientHeight
      })
    )
  };

  visualizeAudioBuffer = (dataArray, bufferLength) => {
    var animationId

    this.canvasCtx
      .clearRect(
        0,
        0,
        this.canvasRef.current.clientWidth,
        this.canvasRef.current.clientHeight
      )

    const draw = () => {
      if (!this.state.listening) {
        return
      }

      this.canvasCtx.fillStyle = this.props.fillStyle

      this.canvasCtx
        .fillRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )

      this.canvasCtx.lineWidth = this.props.lineWidth

      this.canvasCtx.strokeStyle = this.props.strokeStyle

      this.canvasCtx.beginPath()

      const sliceWidth = this.canvasRef.current.clientWidth * 1.0 / bufferLength

      let x = 0

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0
        const y = v * this.canvasRef.current.clientHeight / 2

        if (i === 0) {
          this.canvasCtx.moveTo(x, y)
        } else {
          this.canvasCtx.lineTo(x, y)
        }

        x += sliceWidth
      }

      this.canvasCtx
        .lineTo(
          this.canvasRef.current.width,
          this.canvasRef.height / 2
        )

      this.canvasCtx.stroke()
    }

    if (typeof animationId === 'undefined') {
      animationId = window.requestAnimationFrame(draw)
    }
  };

  onChangeState = state => {
    console.log('state:', state)

    if (state === 'Listening') {
      this.setState(
        () => ({
          state,
          listening: true
        })
      )
    }

    if (state === 'Sending') {
      this.setState(
        () => ({
          state,
          listening: false
        })
      )

      this.canvasCtx
        .fillRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )

      this.canvasCtx
        .clearRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )
    }

    if (state === 'Passive') {
      this.setState(
        () => ({
          state,
          listening: false
        })
      )

      this.canvasCtx
        .fillRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )

      this.canvasCtx
        .clearRect(
          0,
          0,
          this.canvasRef.current.clientWidth,
          this.canvasRef.current.clientHeight
        )
    }

    if (state === 'Speaking') {
      this.setState(
        () => ({
          state,
          listening: false
        })
      )
    }
  }

  onData = data => {
    console.log('data:', data)

    console.log('Transcript:', data.inputTranscript, ', Response:', data.message)

    this.setState(
      () => ({
        transcript: data.inputTranscript,
        message: data.message
      })
    )

    this.props.onConversationData(data, {
      isSynthesizerSupported: () => !!synth,
      isRecognitionSupported: this.isRecognitionSupported,

      speak: this.speak,

      state: this.state.state,
      transcript: this.state.transcript,
      message: this.state.message,
      recognizing: this.state.recognizing,
      listening: this.state.listening,

      onClick: this.onClick,

      start: this.start,
      abort: this.abort,
      pause: this.pause,
      resume: this.resume,
      debug: this.debug,
      setLanguage: this.setLanguage,
      addCommands: this.addCommands,
      removeCommands: this.removeCommands,
      addCallback: this.addCallback,
      removeCallback: this.removeCallback,
      isListening: this.isListening,
      trigger: this.trigger
    })
  }

  onError = error => {
    console.log('onError error: ', error)
  }

  onClick = () => {
    if (
      this.state.state === 'Listening' ||
      this.state.state === 'Sending' ||
      this.state.state === 'Speaking'
    ) {
      console.log('this.state.state: ', this.state.state)
      this.conversation.stopRecord()
      return
    }

    this.conversation = new Conversation(
      {
        vuiConfig: {
          botName: this.props.vuicsVuiId
        }
      },
      this.onChangeState,
      this.onData,
      this.onError,
      this.visualizeAudioBuffer
    )

    this.conversation.advanceConversation()
  }

  render = () => (
    <Provider
      value={{ // eslint-disable-line react-perf/jsx-no-new-object-as-prop
        isRecognitionSupported: this.isRecognitionSupported,
        isSynthesizerSupported: () => !!synth,

        speak: this.speak,

        buttonRef: this.buttonRef,
        canvasRef: this.canvasRef,
        canvasWrapperRef: this.canvasWrapperRef,
        state: this.state.state,
        transcript: this.state.transcript,
        message: this.state.message,
        width: this.state.width,
        height: this.state.height,

        onClick: this.onClick,

        init: this.init,
        start: this.start,
        abort: this.abort,
        pause: this.pause,
        resume: this.resume,
        debug: this.debug,
        setLanguage: this.setLanguage,
        addCommands: this.addCommands,
        removeCommands: this.removeCommands,
        addCallback: this.addCallback,
        removeCallback: this.removeCallback,
        isListening: this.isListening,
        trigger: this.trigger,
        recognizing: this.state.recognizing,
        listening: this.state.listening
      }}

    >
      {
        this.props.children
      }
    </Provider>
  )
}
