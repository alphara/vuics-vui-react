const synth = window.speechSynthesis;

let voices;

const onVoicesChanged = () => {
  voices = synth.getVoices();
  // console.log('voices:', voices);
}

onVoicesChanged();

if (speechSynthesis.onvoiceschanged !== undefined) {
  speechSynthesis.onvoiceschanged = onVoicesChanged;
}

export default class Synthesizer {
  static speak = ({ phrase }) => {
    if (synth.speaking) {
      console.error('Synthesizer is already speaking.');
      return;
    }

    const utterThis = new window.SpeechSynthesisUtterance(phrase);

    utterThis.onend = (event) => {
      // console.log('SpeechSynthesisUtterance.onend');
    }
    utterThis.onerror = (event) => {
      console.error('An error has occurred with the speech synthesis:', event.error);
    }

    // TODO: select voices and speech params
    utterThis.voice = voices[0];
    utterThis.pitch = 1;
    utterThis.rate = 1;

    synth.speak(utterThis);
  }
}
