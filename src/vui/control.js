import AudioRecorder from './recorder.js';

let recorder;
let audioRecorder;
let checkAudioSupport;
let audioSupported;
let playbackSource;

const UNSUPPORTED = 'Audio is not supported.';

function AudioControl (options = {}) {
  this.checkAudioSupport = options.checkAudioSupport !== false;
  console.log('checkAudioSupport:', checkAudioSupport)

  function startRecording (
    onSilence = () => {},
    visualizer = () => {},
    silenceDetectionConfig
  ) {
    audioSupported = audioSupported !== false;
    if (!audioSupported) {
      throw new Error(UNSUPPORTED);
    }

    recorder = audioRecorder.createRecorder(silenceDetectionConfig);

    recorder.record(onSilence, visualizer);
  }

  function stopRecording () {
    audioSupported = audioSupported !== false;

    if (!audioSupported) {
      throw new Error(UNSUPPORTED);
    }

    recorder.stop();
  }

  function exportWAV (
    callback = () => {
      throw new Error('You must pass a callback function to export.')
    },
    sampleRate = 16000
  ) {
    audioSupported = audioSupported !== false;

    if (!audioSupported) {
      throw new Error(UNSUPPORTED);
    }

    recorder.exportWAV(callback, sampleRate);

    recorder.clear();
  }

  function playHtmlAudioElement (buffer, callback) {
    if (typeof buffer === 'undefined') {
      return;
    }

    const audio = document.createElement('audio');

    audio.src = window.URL.createObjectURL(new Blob([buffer]));

    audio.addEventListener('ended', () => {
      audio.currentTime = 0;
      if (typeof callback === 'function') {
        callback();
      }
    });

    audio.play();
  }

  function play (buffer, callback) {
    if (typeof buffer === 'undefined') {
      return;
    }

    const myBlob = new Blob([buffer]);

    const fileReader = new FileReader();

    fileReader.onload = function onload () {
      playbackSource = audioRecorder.audioContext().createBufferSource();

      audioRecorder.audioContext().decodeAudioData(this.result, buf => {
        playbackSource.buffer = buf;

        playbackSource.connect(audioRecorder.audioContext().destination);

        playbackSource.onended = (event) => {
          if (typeof callback === 'function') {
            callback();
          }
        };

        playbackSource.start(0);
      });
    };

    fileReader.readAsArrayBuffer(myBlob);
  }

  function stop () {
    if (typeof playbackSource === 'undefined') {
      return;
    }

    playbackSource.stop();
  }

  function clear () {
    recorder.clear();
  }

  function supportsAudio (callback = () => {}) {
    if (
      navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia
    ) {
      audioRecorder = AudioRecorder();

      audioRecorder.requestDevice()
        .then(stream => {
          audioSupported = true;
          callback(audioSupported);
        })
        .catch(error => {
          console.log('audioRecorder requestDevice error', error)
          audioSupported = false;
          callback(audioSupported);
        });
    } else {
      audioSupported = false;
      callback(audioSupported);
    }
  }

  if (this.checkAudioSupport) {
    supportsAudio();
  }

  return ({
    startRecording,
    stopRecording,
    exportWAV,
    play,
    stop,
    clear,
    playHtmlAudioElement,
    supportsAudio
  });
}

export default AudioControl;
