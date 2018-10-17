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

    this.state = {
      recognitionCallbacks: props.recognitionCallbacks
        ? props.recognitionCallbacks
        : {
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
        },
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
    }

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

      this.recognition.lang = props.locale;
      // this.recognition.lang = 'ru-RU';

      this.recognition.onstart = () => {
        console.log('recognition onstart')

        this.setState(
          () => ({
            listening: true
          }),
          () => {
            this._invokeRecognitionCallbacks(
              this.state.recognitionCallbacks.start,
              {
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
                isListening: this.isListening,
                trigger: this.trigger
              }
            )
          }
        )
      }

      this.recognition.onsoundstart = () => {
        this._invokeRecognitionCallbacks(
          this.state.recognitionCallbacks.soundstart,
          {
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
            isListening: this.isListening,
            trigger: this.trigger
          }
        )
      }

      this.recognition.onerror = event => {
        console.log('recognition onerror')

        this._invokeRecognitionCallbacks(
          this.state.recognitionCallbacks.error,
          event,
          {
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
            isListening: this.isListening,
            trigger: this.trigger
          }
        )

        switch (event.error) {
          case 'network':
            this._invokeRecognitionCallbacks(
              this.state.recognitionCallbacks.errorNetwork,
              event,
              {
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
                isListening: this.isListening,
                trigger: this.trigger
              }
            )
            break
          case 'not-allowed':
          case 'service-not-allowed':
            this.setState(
              () => ({
                autoRestart: false
              })
            )

            if (new Date().getTime() - this.state.lastStartedAt < 200) {
              this._invokeRecognitionCallbacks(
                this.state.recognitionCallbacks.errorPermissionBlocked,
                event,
                {
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
                  isListening: this.isListening,
                  trigger: this.trigger
                }
              )
            } else {
              this._invokeRecognitionCallbacks(
                this.state.recognitionCallbacks.errorPermissionDenied,
                event,
                {
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
                  isListening: this.isListening,
                  trigger: this.trigger
                }
              )
            }
            break;
          default:
        }
      }

      this.recognition.onend = () => {
        console.log('recognition onend')

        this.setState(
          () => ({
            listening: false
          })
        )

        this._invokeRecognitionCallbacks(
          this.state.recognitionCallbacks.end,
          {
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
            isListening: this.isListening,
            trigger: this.trigger
          }
        )

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
      }

      this.recognition.onresult = event => {
        console.log('recognition onresult')

        if (this.state.pauseListening) {
          if (this.state.debugState) {
            this._logMessage('Speech heard, but recognizer is paused')
          }

          return false
        }

        const SpeechRecognitionResult = event.results[event.resultIndex];

        const results = [];

        for (let k = 0; k < SpeechRecognitionResult.length; k++) {
          results[k] = SpeechRecognitionResult[k].transcript
        }

        this._parseResults(results)
      };
    } else {
      this._logMessage('SpeechRecognition does not supported by your browser!');
    }

    this.buttonRef = createRef()
    this.canvasWrapperRef = createRef()
    this.canvasRef = createRef()

    this.conversation = null
    this.canvasCtx = null
  }

  static propTypes = {
    locale: PropTypes.string.isRequired,

    children: PropTypes.node.isRequired,

    vuicsVuiId: PropTypes.string.isRequired,

    intentHandlers: PropTypes.object.isRequired,
    speechHandlers: PropTypes.object,
    recognitionCallbacks: PropTypes.object,

    fillStyle: PropTypes.string,
    lineWidth: PropTypes.number,
    strokeStyle: PropTypes.string
  }

  static defaultProps = {
    fillStyle: 'rgb(27,28,29)',
    lineWidth: 2,
    strokeStyle: 'rgb(33,186,70)',
    recognitionCallbacks: {
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
    },
    speechHandlers: {}
  }

  componentDidMount = () => {
    this.addSpeechHandlers(this.props.speechHandlers)

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

  _onSpeechEnd = (cb) => () => {
    cb()

    this.setState(
      () => ({
        state: 'Passive',
        listening: false
      })
    )
  }

  _onSpeechError = (cb) => () => {
    cb()

    this.setState(
      () => ({
        state: 'Passive',
        listening: false
      })
    )
  }

  speak = ({
    phrase,
    voiceIndex = 0,
    pitch = 1,
    rate = 1,
    onSpeechEnd = () => {},
    onSpeechError = () => {}
  }) => {
    if (synth.speaking) {
      console.error('Synthesizer is already speaking.');
      return;
    }
    this.setState(
      () => ({
        state: 'Speaking',
        listening: false,
        recognizing: false
      })
    )

    const utterThis = new window.SpeechSynthesisUtterance(phrase);

    utterThis.onend = this._onSpeechEnd(onSpeechEnd)
    utterThis.onerror = this._onSpeechError(onSpeechError)

    utterThis.voice = this.voices[voiceIndex];
    utterThis.pitch = pitch;
    utterThis.rate = rate;

    synth.speak(utterThis);
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

  addSpeechHandlers = (speechHandlers) => {
    if (
      !this.isRecognitionSupported() ||
      Object.keys(speechHandlers).length === 0
    ) {
      return
    }

    Object.keys(speechHandlers).forEach((key) => {
      console.log('addSpeechHandlers key: ', key)

      const speechHandler = speechHandlers[key]

      if (typeof speechHandler === 'function') {
        this._registerCommand(
          this._commandToRegExp(key),
          speechHandler,
          key
        )
      } else if (
        typeof speechHandler === 'object' &&
        speechHandler.regexp instanceof RegExp
      ) {
        this._registerCommand(
          new RegExp(speechHandler.regexp.source, 'i'),
          speechHandler.callback,
          key
        )
      } else {
        if (this.state.debugState) {
          this._logMessage('Can not register speechHandler: %c' + key, debugStyle)
        }
      }
    })
  }

  removeSpeechHandlers = (commandsToRemove) => {
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
                return false
              }
            }

            return true
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
      this.state.recognitionCallbacks[type] !== undefined
    ) {
      this.setState(
        ({ recognitionCallbacks }) => ({
          recognitionCallbacks: {
            ...recognitionCallbacks,
            [type]: [
              ...recognitionCallbacks[type],
              {
                callback: cb,
                context: context || this
              }
            ]
          }
        })
      )
    }
  }

  removeCallback = (type, callback) => {
    if (!this.isRecognitionSupported()) {
      return
    }

    Object.keys(this.state.recognitionCallbacks).forEach((callbackType) => {
      if (type === undefined || type === callbackType) {
        if (callback === undefined) {
          this.setState(
            ({ recognitionCallbacks }) => ({
              recognitionCallbacks: {
                ...recognitionCallbacks,
                [callbackType]: []
              }
            })
          )
        } else {
          this.setState(
            ({ recognitionCallbacks }) => ({
              recognitionCallbacks: {
                ...recognitionCallbacks,
                [callbackType]: recognitionCallbacks[callbackType].filter((cb) => cb.callback !== callback)
              }
            })
          )
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

      return
    }

    this._parseResults(
      !Array.isArray(sentences)
        ? [sentences]
        : sentences
    )
  }

  isRecognitionSupported = () => {
    if (!SpeechRecognition) {
      this._logMessage('SpeechRecognition does not supported by your browser!')

      return false
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

  _invokeRecognitionCallbacks = (recognitionCallbacks, ...args) => {
    recognitionCallbacks.length > 0 &&
    recognitionCallbacks.forEach((callbackType) => {
      callbackType(...args)
    })
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
    this._invokeRecognitionCallbacks(
      this.state.recognitionCallbacks.result,
      results,
      {
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
        isListening: this.isListening,
        trigger: this.trigger
      }
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

          console.log('parameters: ', parameters)

          currentCommand.callback.apply(this, [parameters, {
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
            isListening: this.isListening,
            trigger: this.trigger
          }]); // eslint-disable-line babel/no-invalid-this

          this._invokeRecognitionCallbacks(
            this.state.recognitionCallbacks.resultMatch,
            {
              commandText,
              originalPhrase: currentCommand.originalPhrase,
              results
            },
            {
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
              isListening: this.isListening,
              trigger: this.trigger
            }
          );

          return;
        }
      }
    }

    this._invokeRecognitionCallbacks(
      this.state.recognitionCallbacks.resultNoMatch,
      results,
      {
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
        isListening: this.isListening,
        trigger: this.trigger
      }
    );
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
      }),
      () => {
        if (!data.intentName) {
          return
        }
        if (
          typeof this.props.recognitionCallbacks[data.intentName] === 'function'
        ) {
          this.props.recognitionCallbacks[data.intentName](data, {
            isSynthesizerSupported: () => !!synth,
            isRecognitionSupported: this.isRecognitionSupported,

            speak: this.speak,

            state: this.state.state,
            transcript: data.inputTranscript,
            message: data.message,
            recognizing: this.state.recognizing,
            listening: this.state.listening,

            onClick: this.onClick,

            start: this.start,
            abort: this.abort,
            pause: this.pause,
            resume: this.resume,
            debug: this.debug,
            setLanguage: this.setLanguage,
            addSpeechHandlers: this.addSpeechHandlers,
            removeSpeechHandlers: this.removeSpeechHandlers,
            addCallback: this.addCallback,
            removeCallback: this.removeCallback,
            isListening: this.isListening,
            trigger: this.trigger
          })
        } else {
          console.error('Intent ', data.intentName, ' have no callback attached!')
        }
      }
    )
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
        addSpeechHandlers: this.addSpeechHandlers,
        removeSpeechHandlers: this.removeSpeechHandlers,
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
