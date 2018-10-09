# Recognizer API

## isSupported()

Returns true if speech recognition is supported by browser, or false if it's not supported.

## start([options])

Start listening.
It's a good idea to call this after adding some commands first, but not mandatory.

Receives an optional options object which supports the following options:

- `autoRestart`  (boolean, default: true) Should Recognizer restart itself if it is closed indirectly, because of silence or window conflicts?
- `continuous`   (boolean) Allow forcing continuous mode on or off. Annyang is pretty smart about this, so only set this if you know what you're doing.
- `paused`       (boolean, default: false) Start Recognizer in paused mode.

#### Examples:
```javascript
// Start listening, don't restart automatically
Recognizer.start({ autoRestart: false });
// Start listening, don't restart automatically, stop recognition after first phrase recognized
Recognizer.start({ autoRestart: false, continuous: false });
```

### Params:

* **Object** *[options]* - Optional options.

## abort()

Stop listening, and turn off mic.

Alternatively, to only temporarily pause Recognizer responding to commands without stopping the SpeechRecognition engine or closing the mic, use pause() instead.

See: [pause()](#pause)

## pause()

Pause listening. Recognizer will stop responding to commands (until the resume or start methods are called), without turning off the browser's SpeechRecognition engine or the mic.

Alternatively, to stop the SpeechRecognition engine and close the mic, use abort() instead.

See: [abort()](#abort)

## resume()

Resumes listening and restores command callback execution when a result matches.
If SpeechRecognition was aborted (stopped), start it.

## debug([newState=true])

Turn on output of debug messages to the console.

### Params:

* **boolean** *[newState=true]* - Turn on/off debug messages

## setLanguage(language)

Set the language the user will speak in. If this method is not called, defaults to 'en-US'.

### Params:

* **String** *language* - The language (locale)

## addCommands(commands)

Add commands that Recognizer will respond to.

#### Examples:
```javascript
var commands = {'hello :name': helloFunction, 'howdy': helloFunction};
var commands2 = {'hi': helloFunction};

Recognizer.addCommands(commands);
Recognizer.addCommands(commands2);
// Recognizer will now listen to all three commands
```

See: [Commands Object](#commands-object)

### Params:

* **Object** *commands* - Commands that Recognizer should listen to

## removeCommands([commandsToRemove])

Remove existing commands. Called with a single phrase, array of phrases, or methodically. Pass no params to remove all commands.

#### Examples:
```javascript
var commands = {'hello': helloFunction, 'howdy': helloFunction, 'hi': helloFunction};

// Remove all existing commands
Recognizer.removeCommands();

// Add some commands
Recognizer.addCommands(commands);

// Don't respond to hello
Recognizer.removeCommands('hello');

// Don't respond to howdy or hi
Recognizer.removeCommands(['howdy', 'hi']);
```

### Params:

* **String|Array|Undefined** *[commandsToRemove]* - Commands to remove

## addCallback(type, callback, [context])

Add a callback function to be called in case one of the following events happens:

* `start` - Fired as soon as the browser's Speech Recognition engine starts listening
* `soundstart` - Fired as soon as any sound (possibly speech) has been detected.
    This will fire once per Speech Recognition starting.
* `error` - Fired when the browser's Speech Recogntion engine returns an error, this generic error callback will be followed by more accurate error callbacks (both will fire if both are defined)
    Callback function will be called with the error event as the first argument
* `errorNetwork` - Fired when Speech Recognition fails because of a network error
    Callback function will be called with the error event as the first argument
* `errorPermissionBlocked` - Fired when the browser blocks the permission request to use Speech Recognition.
    Callback function will be called with the error event as the first argument
* `errorPermissionDenied` - Fired when the user blocks the permission request to use Speech Recognition.
    Callback function will be called with the error event as the first argument
* `end` - Fired when the browser's Speech Recognition engine stops
* `result` - Fired as soon as some speech was identified. This generic callback will be followed by either the `resultMatch` or `resultNoMatch` callbacks.
    Callback functions for to this event will be called with an array of possible phrases the user said as the first argument
* `resultMatch` - Fired when Recognizer was able to match between what the user said and a registered command
    Callback functions for this event will be called with three arguments in the following order:
      * The phrase the user said that matched a command
      * The command that was matched
      * An array of possible alternative phrases the user might have said
* `resultNoMatch` - Fired when what the user said didn't match any of the registered commands.
    Callback functions for this event will be called with an array of possible phrases the user might've said as the first argument

#### Examples:
```javascript
Recognizer.addCallback('error', function() {
  console.error('There was an error!');
});

Recognizer.addCallback('resultMatch', function(userSaid, commandText, phrases) {
  console.log(userSaid); // sample output: 'hello'
  console.log(commandText); // sample output: 'hello (there)'
  console.log(phrases); // sample output: ['hello', 'halo', 'yellow', 'polo', 'hello kitty']
});

// pass local context to a global function called notConnected
Recognizer.addCallback('errorNetwork', notConnected, this);
```

### Params:

* **String** *type* - Name of event that will trigger this callback
* **Function** *callback* - The function to call when event is triggered
* **Object** *[context]* - Optional context for the callback function

## removeCallback(type, callback)

Remove callbacks from events.

- Pass an event name and a callback command to remove that callback command from that event type.
- Pass just an event name to remove all callback commands from that event type.
- Pass undefined as event name and a callback command to remove that callback command from all event types.
- Pass no params to remove all callback commands from all event types.

#### Examples:
```javascript
Recognizer.addCallback('start', myFunction1);
Recognizer.addCallback('start', myFunction2);
Recognizer.addCallback('end', myFunction1);
Recognizer.addCallback('end', myFunction2);

// Remove all callbacks from all events:
Recognizer.removeCallback();

// Remove all callbacks attached to end event:
Recognizer.removeCallback('end');

// Remove myFunction2 from being called on start:
Recognizer.removeCallback('start', myFunction2);

// Remove myFunction1 from being called on all events:
Recognizer.removeCallback(undefined, myFunction1);
```

### Params:

* *type* Name of event type to remove callback from
* *callback* The callback function to remove

### Return:

* undefined

## isListening()

Returns true if speech recognition is currently on.
Returns false if speech recognition is off or Recognizer is paused.

### Return:

* boolean true = SpeechRecognition is on and Recognizer is listening

## getSpeechRecognizer()

Returns the instance of the browser's SpeechRecognition object used by Recognizer.
Useful in case you want direct access to the browser's Speech Recognition engine.

### Return:

* SpeechRecognition The browser's Speech Recognizer currently used by Recognizer

## trigger(string|array)

Simulate speech being recognized. This will trigger the same events and behavior as when the Speech Recognition
detects speech.

Can accept either a string containing a single sentence, or an array containing multiple sentences to be checked
in order until one of them matches a command (similar to the way Speech Recognition Alternatives are parsed)

#### Examples:
```javascript
Recognizer.trigger('Time for some thrilling heroics');
Recognizer.trigger(
    ['Time for some thrilling heroics', 'Time for some thrilling aerobics']
  );
```

### Params:

* *string|array* sentences A sentence as a string or an array of strings of possible sentences

### Return:

* undefined

# Good to Know

## Commands Object

addCommands() method receive a `commands` object.

Recognizer understands commands with `named variables`, `splats`, and `optional words`.

* Use `named variables` for one word arguments in your command.
* Use `splats` to capture multi-word text at the end of your command (greedy).
* Use `optional words` or phrases to define a part of the command as optional.

#### Examples:
```javascript
<script>
var commands = {
  // Recognizer will capture anything after a splat (*) and pass it to the function.
  // e.g. saying "Show me Batman and Robin" will call showFlickr('Batman and Robin');
  'show me *tag': (tag) => {
    console.log('tag:', tag)
  },

  // A named variable is a one word variable, that can fit anywhere in your command.
  // e.g. saying "calculate October stats" will call calculateStats('October');
  'calculate :month stats': (month) => {
    console.log('month:', month)
  },

  // By defining a part of the following command as optional, Recognizer will respond
  // to both: "say hello to my little friend" as well as "say hello friend"
  'say hello (to my little) friend': () => {
    console.log('Hello!')
  }
};
```

### Using Regular Expressions in commands

For advanced commands, you can pass a regular expression object, instead of
a simple string command.

This is done by passing an object containing two properties: `regexp`, and
`callback` instead of the function.

#### Examples:
```javascript
var calculateFunction = function(month) { console.log(month); }
var commands = {
  // This example will accept any word as the "month"
  'calculate :month stats': calculateFunction,
  // This example will only accept months which are at the start of a quarter
  'calculate :quarter stats': {'regexp': /^calculate (January|April|July|October) stats$/, 'callback': calculateFunction}
}
 ```

## License

```
The MIT License (MIT)

Original work Copyright (c) 2016 Tal Ater
Modified work Copyright (c) 2018 Artem Arakcheev

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
