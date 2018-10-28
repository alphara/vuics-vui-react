const SpeechRecognition = SpeechRecognition ||
                          webkitSpeechRecognition ||
                          mozSpeechRecognition ||
                          msSpeechRecognition ||
                          oSpeechRecognition;
const SpeechGrammarList = SpeechGrammarList ||
                          webkitSpeechGrammarList ||
                          mozSpeechGrammarList ||
                          msSpeechGrammarList ||
                          oSpeechGrammarList;
const SpeechRecognitionEvent = SpeechRecognitionEvent ||
                               webkitSpeechRecognitionEvent ||
                               mozSpeechRecognitionEvent ||
                               msSpeechRecognitionEvent ||
                               oSpeechRecognitionEvent;

let recognition;

// Check browser support
if (!SpeechRecognition) {
  console.error('The browser does not support speech recognition')
}

// let recStarted = false;

const listen = ({
  phrases = [],
  lang = 'en-US',
  interimResults = false,
  maxAlternatives = 1,
  onResult = () => {},
  onError = () => {}
}) => {
  // To ensure case consistency while checking with the returned output text
  phrases = phrases.map(x => x.toLowerCase())

  // JSpeech Grammar Format (JSGF)
  // https://www.w3.org/TR/jsgf/

  recognition = new SpeechRecognition();

  const grammar = '#JSGF V1.0; grammar phrase; public <phrase> = ' + phrases.join(' | ') + ';';
  var speechRecognitionList = new SpeechGrammarList();
  speechRecognitionList.addFromString(grammar, 1);
  recognition.grammars = speechRecognitionList;
  recognition.lang = lang;
  recognition.interimResults = interimResults;
  recognition.maxAlternatives = maxAlternatives;
  recognition.start();

  recognition.onresult = (event) => {
    console.log('event.results:', event.results);

    const transcript = event.results[0][0].transcript;
    const confidence = event.results[0][0].confidence;
    console.log('transcript:', transcript);
    console.log('confidence:', confidence);
    onResult({ results: event.results, transcript, confidence });
  }

  recognition.onspeechend = () => {
    recognition.stop();
    console.log('Speech end')
  }

  recognition.onerror = (event) => {
    console.error('Recognition error:', event.error);
    onError({ err: event.error });
  }

  recognition.onaudiostart = (event) => {
    // Triggered when the user agent has started to capture audio.
    console.log('SpeechRecognition.onaudiostart:', event);
  }

  recognition.onaudioend = (event) => {
    // Triggered when the user agent has finished capturing audio.
    console.log('SpeechRecognition.onaudioend:', event);
  }

  recognition.onend = (event) => {
    // Triggered when the speech recognition service has disconnected.
    console.log('SpeechRecognition.onend:', event);
  }

  recognition.onnomatch = (event) => {
    // Triggered when the speech recognition service returns a final result with no significant recognition. This may involve some degree of recognition, which doesn't meet or exceed the confidence threshold.
    console.log('SpeechRecognition.onnomatch:', event);
  }

  recognition.onsoundstart = (event) => {
    // Triggered when any sound — recognisable speech or not — has been detected.
    console.log('SpeechRecognition.onsoundstart:', event);
  }

  recognition.onsoundend = (event) => {
    // Triggered when any sound — recognisable speech or not — has stopped being detected.
    console.log('SpeechRecognition.onsoundend:', event);
  }

  recognition.onspeechstart = (event) => {
    // Triggered when sound that is recognised by the speech recognition service as speech has been detected.
    console.log('SpeechRecognition.onspeechstart:', event);
  }
  recognition.onstart = (event) => {
    // Triggered when the speech recognition service has begun listening to incoming audio with intent to recognize grammars associated with the current SpeechRecognition.
    console.log('SpeechRecognition.onstart:', event);
  }
};

export default listen;
