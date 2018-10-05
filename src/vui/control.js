import AudioRecorder from './recorder.js';

var recorder;
var audioRecorder;
var checkAudioSupport;
var audioSupported;
var playbackSource;
var UNSUPPORTED = 'Audio is not supported.';

const AudioControl = function (options) {
  options = options || {};
  this.checkAudioSupport = options.checkAudioSupport !== false;
  console.log('checkAudioSupport:', checkAudioSupport)

  var startRecording = function (onSilence, visualizer, silenceDetectionConfig) {
    onSilence = onSilence || function () { /* no op */
      };
    visualizer = visualizer || function () { /* no op */
      };
    audioSupported = audioSupported !== false;
    if (!audioSupported) {
      throw new Error(UNSUPPORTED);
    }
    recorder = audioRecorder.createRecorder(silenceDetectionConfig);
    recorder.record(onSilence, visualizer);
  };

  var stopRecording = function () {
    audioSupported = audioSupported !== false;
    if (!audioSupported) {
      throw new Error(UNSUPPORTED);
    }
    recorder.stop();
  };

  var exportWAV = function (callback, sampleRate) {
    audioSupported = audioSupported !== false;
    if (!audioSupported) {
      throw new Error(UNSUPPORTED);
    }
    if (!(callback && typeof callback === 'function')) {
      throw new Error('You must pass a callback function to export.');
    }
    sampleRate = (typeof sampleRate !== 'undefined') ? sampleRate : 16000;
    recorder.exportWAV(callback, sampleRate);
    recorder.clear();
  };

  var playHtmlAudioElement = function (buffer, callback) {
    if (typeof buffer === 'undefined') {
      return;
    }
    var myBlob = new Blob([buffer]);
    var audio = document.createElement('audio');
    var objectUrl = window.URL.createObjectURL(myBlob);
    audio.src = objectUrl;
    audio.addEventListener('ended', function () {
      audio.currentTime = 0;
      if (typeof callback === 'function') {
        callback();
      }
    });
    audio.play();
  };

  var play = function (buffer, callback) {
    if (typeof buffer === 'undefined') {
      return;
    }
    var myBlob = new Blob([buffer]);
    var fileReader = new FileReader();
    fileReader.onload = function() {
      playbackSource = audioRecorder.audioContext().createBufferSource();
      audioRecorder.audioContext().decodeAudioData(this.result, function(buf) {
        playbackSource.buffer = buf;
        playbackSource.connect(audioRecorder.audioContext().destination);
        playbackSource.onended = function(event) {
          if (typeof callback === 'function') {
            callback();
          }
        };
        playbackSource.start(0);
      });
    };
    fileReader.readAsArrayBuffer(myBlob);
  };

  var stop = function() {
    if (typeof playbackSource === 'undefined') {
      return;
    }
    playbackSource.stop();
  };

  var clear = function () {
    recorder.clear();
  };

  var supportsAudio = function (callback) {
    callback = callback || function () { /* no op */
      };
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      audioRecorder = AudioRecorder();
      audioRecorder.requestDevice()
        .then(function (stream) {
          audioSupported = true;
          callback(audioSupported);
        })
        .catch(function (error) {
          audioSupported = false;
          callback(audioSupported);
        });
    } else {
      audioSupported = false;
      callback(audioSupported);
    }
  };

  if (this.checkAudioSupport) {
    supportsAudio();
  }

  return {
    startRecording: startRecording,
    stopRecording: stopRecording,
    exportWAV: exportWAV,
    play: play,
    stop: stop,
    clear: clear,
    playHtmlAudioElement: playHtmlAudioElement,
    supportsAudio: supportsAudio
  };
};

export default AudioControl;
