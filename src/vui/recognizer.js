// The command matching code is a modified version of Backbone.Router by Jeremy Ashkenas, under the MIT license.
import { logMessage } from '../utils/log'

var optionalParam = /\s*\((.*?)\)\s*/g;
var optionalRegex = /(\(\?:[^)]+\))\?/g;
var namedParam = /(\(\?)?:\w+/g;
var splatParam = /\*\w+/g;
var escapeRegExp = /[-{}[\]+?.,\\^$|#]/g; // /[\-{}\[\]+?.,\\\^$|#]/g;

function commandToRegExp (command) {
  const newCcommand = command
    .replace(escapeRegExp, '\\$&')
    .replace(optionalParam, '(?:$1)?')
    .replace(namedParam, (match, optional) => optional ? match : '([^\\s]+)')
    .replace(splatParam, '(.*?)')
    .replace(optionalRegex, '\\s*$1?\\s*')

  return new RegExp('^' + newCcommand + '$', 'i')
}

class Recognizer {
  constructor ({
    callbacks = {
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
    commands = {},
    autoRestart = true,
    debugState = true,
    locale = 'en-US', // 'ru-RU'
    api
  } = {}) {
    this.api = api
    this.callbacks = callbacks
    this.commands = commands
    this.autoRestart = autoRestart
    this.debugState = debugState
    this.locale = locale

    this.commandsList = []
    this.lastStartedAt = 0
    this.autoRestartCount = 0

    this.pauseListening = false
    this.listening = false

    this._onRecognitionStart = this._onRecognitionStart.bind(this)
    this._onRecognitionSoundStart = this._onRecognitionSoundStart.bind(this)
    this._onRecognitionError = this._onRecognitionError.bind(this)
    this._onRecognitionEnd = this._onRecognitionEnd.bind(this)
    this._onRecognitionResult = this._onRecognitionResult.bind(this)

    this._registerCommand = this._registerCommand.bind(this)
    this._parseResults = this._parseResults.bind(this)
    this._invokeCallbacks = this._invokeCallbacks.bind(this)

    this.getApi = this.getApi.bind(this)

    this.changeLocale = this.changeLocale.bind(this)
    this.isRecognitionSupported = this.isRecognitionSupported.bind(this)
    this.start = this.start.bind(this)
    this.abort = this.abort.bind(this)
    this.pause = this.pause.bind(this)
    this.resume = this.resume.bind(this)
    this.debug = this.debug.bind(this)
    this.trigger = this.trigger.bind(this)

    this.addRecognizerHandlers = this.addRecognizerHandlers.bind(this)
    this.removeCommands = this.removeCommands.bind(this)
    this.addCallback = this.addCallback.bind(this)
    this.removeCallback = this.removeCallback.bind(this)

    this.isListening = this.isListening.bind(this)

    this.SpeechRecognition = typeof document !== 'undefined' && (
      window.SpeechRecognition ||
      window.webkitSpeechRecognition ||
      window.mozSpeechRecognition ||
      window.msSpeechRecognition ||
      window.oSpeechRecognition
    )

    if (this.recognition && this.recognition.abort) {
      this.recognition.abort()
    }

    if (this.resetCommands) {
      this.commandsList = []
    }

    if (Object.keys(this.commands).length) {
      this.addRecognizerHandlers(this.commands)
    }

    if (!this.SpeechRecognition) {
      logMessage('Speech Recognition does not supported by your browser!')
    }

    this.recognition = new this.SpeechRecognition()
    this.recognition.maxAlternatives = 5
    // In HTTPS, turn off continuous mode for faster results.
    // In HTTP,  turn on  continuous mode for much slower results, but no repeating security notices
    this.recognition.continuous = (typeof document !== 'undefined' && window.location.protocol === 'http:')

    this.recognition.lang = this.locale

    this.recognition.onstart = this._onRecognitionStart

    this.recognition.onsoundstart = this._onRecognitionSoundStart

    this.recognition.onerror = this._onRecognitionError

    this.recognition.onend = this._onRecognitionEnd

    this.recognition.onresult = this._onRecognitionResult
  }

  getApi () {
    return Object.assign(this.api, {
      isRecognitionSupported: this.isRecognitionSupported,
      listening: this.listening,
      start: this.start,
      abort: this.abort,
      pause: this.pause,
      resume: this.resume,
      debug: this.debug,
      addCommands: this.addCommands,
      removeCommands: this.removeCommands,
      addCallback: this.addCallback,
      removeCallback: this.removeCallback,
      changeLocale: this.changeLocale,
      isListening: this.isListening,
      trigger: this.trigger
    })
  }

  _invokeCallbacks (callbacks, ...args) {
    console.log('_invokeCallbacks args: ', args)

    callbacks.length > 0 &&
    callbacks.forEach((callback) => {
      callback.callback.apply(callback.context, [args, this.getApi()])
    })
  }

  _onRecognitionStart () {
    this.listening = true

    this._invokeCallbacks(this.callbacks.start, this.getApi())
  }

  _onRecognitionSoundStart () {
    this._invokeCallbacks(this.callbacks.soundstart, this.getApi())
  }

  _onRecognitionError (event) {
    this._invokeCallbacks(this.callbacks.error, event, this.getApi())

    switch (event.error) {
      case 'network':
        this._invokeCallbacks(this.callbacks.errorNetwork, event, this.getApi())
        break

      case 'not-allowed':
      case 'service-not-allowed':
        this.autoRestart = false

        if (new Date().getTime() - this.lastStartedAt < 200) {
          this._invokeCallbacks(this.callbacks.errorPermissionBlocked, event, this.getApi())
        } else {
          this._invokeCallbacks(this.callbacks.errorPermissionDenied, event, this.getApi())
        }

        break
      default:
        break
    }
  }

  _onRecognitionEnd () {
    this.listening = false

    this._invokeCallbacks(this.callbacks.end, this.getApi())

    if (this.autoRestart) {
      const timeSinceLastStart = new Date().getTime() - this.lastStartedAt

      this.autoRestartCount += 1

      if (this.autoRestartCount % 10 === 0) {
        if (this.debugState) {
          logMessage('Speech Recognition is repeatedly stopping and starting. Check that you are online and have opened only one window/tab with Speech Recognition in the browser.')
        }
      }

      if (timeSinceLastStart < 1000) {
        setTimeout(() => {
          this.start({
            paused: this.pauseListening
          })
        }, 1000 - timeSinceLastStart)
      } else {
        this.start({
          paused: this.pauseListening
        })
      }
    }
  }

  _onRecognitionResult (event) {
    if (this.pauseListening) {
      if (this.debugState) {
        logMessage('Speech heard, but recognizer is paused')
      }

      return false
    }

    const result = event.results[event.resultIndex]

    const results = []

    for (let k = 0; k < result.length; k++) {
      results[k] = result[k].transcript
    }

    this._parseResults(results)
  }

  _registerCommand (command, callback, originalPhrase) {
    this.commandsList
      .push({
        command,
        callback,
        originalPhrase
      })

    if (this.debugState) {
      logMessage('Command successfully loaded: %c' + originalPhrase)
    }
  }

  _parseResults (results) {
    console.log('_parseResults results: ', results)

    this._invokeCallbacks(this.callbacks.result, results, this.getApi())

    let commandText

    for (let i = 0; i < results.length; i++) {
      commandText = results[i].trim()

      if (this.debugState) {
        logMessage('Speech recognized: %c' + commandText)
      }

      for (let j = 0, l = this.commandsList.length; j < l; j++) {
        const currentCommand = this.commandsList[j];

        const result = currentCommand.command.exec(commandText)

        if (result) {
          const parameters = result.slice(1);

          if (this.debugState) {
            logMessage('command matched: %c' + currentCommand.originalPhrase)

            if (parameters.length) {
              logMessage('with parameters', parameters)
            }
          }

          currentCommand.callback.apply(this, [parameters, this.getApi()])

          this._invokeCallbacks(
            this.callbacks.resultMatch,
            commandText,
            currentCommand.originalPhrase,
            results,
            this.getApi()
          )

          return
        }
      }
    }

    this._invokeCallbacks(
      this.callbacks.resultNoMatch,
      results,
      this.getApi()
    )
  }

  changeLocale (locale) {
    this.locale = locale
  }

  isRecognitionSupported () {
    return !!this.SpeechRecognition
  }

  start (options = {}) {
    if (options.paused !== undefined) {
      this.pauseListening = !!options.paused
    } else {
      this.pauseListening = false
    }

    if (options.autoRestart !== undefined) {
      this.autoRestart = !!options.autoRestart
    } else {
      this.autoRestart = true
    }

    if (options.continuous !== undefined) {
      this.recognition.continuous = !!options.continuous
    }

    this.lastStartedAt = new Date().getTime()

    try {
      this.recognition.start()
    } catch (e) {
      if (this.debugState) {
        logMessage(e.message)
      }
    }
  }

  abort () {
    this.autoRestart = false

    this.autoRestartCount = 0

    this.recognition.abort()
  }

  pause () {
    this.pauseListening = true;
  }

  resume () {
    this.start()
  }

  debug (newState = true) {
    this.debugState = newState
  }

  addRecognizerHandlers (commands) {
    let cb

    Object.keys(commands).forEach(phrase => {
      cb = commands[phrase]

      if (typeof cb === 'function') {
        this._registerCommand(commandToRegExp(phrase), cb, phrase)
      } else if (typeof cb === 'object' && cb.regexp instanceof RegExp) {
        this._registerCommand(new RegExp(cb.regexp.source, 'i'), cb.callback, phrase)
      } else {
        if (this.debugState) {
          logMessage('Can not register command: %c' + phrase)
        }
      }
    })
    // for (let phrase in commands) {
    //   if (commands.hasOwnProperty(phrase)) {
    //     cb = commands[phrase]
    //
    //     if (typeof cb === 'function') {
    //       this._registerCommand(commandToRegExp(phrase), cb, phrase)
    //     } else if (typeof cb === 'object' && cb.regexp instanceof RegExp) {
    //       this._registerCommand(new RegExp(cb.regexp.source, 'i'), cb.callback, phrase);
    //     } else {
    //       if (debugState) {
    //         logMessage('Can not register command: %c' + phrase, debugStyle);
    //       }
    //     }
    //   }
    // }
  }

  removeCommands (commandsToRemove) {
    if (commandsToRemove === undefined) {
      this.commandsList = []
    } else {
      commandsToRemove = Array.isArray(commandsToRemove)
        ? commandsToRemove
        : [commandsToRemove]

      this.commandsList = this.commandsList.filter(command => {
        for (let i = 0; i < commandsToRemove.length; i++) {
          if (commandsToRemove[i] === command.originalPhrase) {
            return false
          }
        }

        return true
      })
    }
  }

  addCallback (type, callback, context) {
    if (typeof callback === 'function' && this.callbacks[type] !== undefined) {
      this.callbacks[type].push({
        callback,
        context: context || this
      })
    }
  }

  removeCallback (type, callback) {
    Object.keys(this.callbacks).forEach(callbackType => {
      if (type === undefined || type === callbackType) {
        if (callback === undefined) {
          this.callbacks[callbackType] = []
        } else {
          this.callbacks[callbackType] = this.callbacks[callbackType].filter(cb => cb.callback !== callback)
        }
      }
    })
    // for (let callbackType in callbacks) {
    //   if (callbacks.hasOwnProperty(callbackType)) {
    //     if (type === undefined || type === callbackType) {
    //       if (callback === undefined) {
    //         callbacks[callbackType] = [];
    //       } else {
    //         callbacks[callbackType] = callbacks[callbackType].filter(cb => cb.callback !== callback)
    //       }
    //     }
    //   }
    // }
  }

  isListening () {
    return this.listening && !this.pauseListening
  }

  trigger (sentences) {
    if (!this.listening) {
      if (this.debugState) {
        if (!this.listening) {
          logMessage('Cannot trigger while recognizer is aborted')
        } else {
          logMessage('Speech heard, but recognizer is paused')
        }
      }

      return
    }

    if (!Array.isArray(sentences)) {
      sentences = [sentences]
    }

    this._parseResults(sentences)
  }
}

export function generateRecognizer (options) {
  return new Recognizer(options)
}

export default Recognizer
