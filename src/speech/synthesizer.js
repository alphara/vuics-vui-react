const synth = window.speechSynthesis;

let voices;
const onVoicesChanged = () => {
  voices = synth.getVoices();
  console.log('voices:', voices);
}

onVoicesChanged();
if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = onVoicesChanged;
}

export default class Synthesizer {
  static speak = ({ phrase }) => {
    if (synth.speaking) {
        console.error('speechSynthesis.speaking');
        return;
    }
    var utterThis = new SpeechSynthesisUtterance(phrase);
    utterThis.onend = function (event) {
        console.log('SpeechSynthesisUtterance.onend');
    }
    utterThis.onerror = function (event) {
        console.error('SpeechSynthesisUtterance.onerror');
    }
    console.log('voices:', voices);
    // TODO: select voices
    utterThis.voice = voices[0];
    utterThis.pitch = 1;
    utterThis.rate = 1;
    synth.speak(utterThis);
  }
}
