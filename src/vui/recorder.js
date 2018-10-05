import work from 'webworkify-webpack';

const worker = work(require.resolve('./worker.js'));
var audio_context, audio_stream;

var recorder = function (source, silenceDetectionConfig) {

  silenceDetectionConfig = silenceDetectionConfig || {};
  silenceDetectionConfig.time = silenceDetectionConfig.hasOwnProperty('time') ? silenceDetectionConfig.time : 1500;
  silenceDetectionConfig.amplitude = silenceDetectionConfig.hasOwnProperty('amplitude') ? silenceDetectionConfig.amplitude : 0.2;

  var recording = false,
    currCallback, start, silenceCallback, visualizationCallback;

  var node = source.context.createScriptProcessor(4096, 1, 1);

  worker.onmessage = function (message) {
    var blob = message.data;
    currCallback(blob);
  };

  worker.postMessage({
    command: 'init',
    config: {
      sampleRate: source.context.sampleRate,
    }
  });

  var record = function (onSilence, visualizer) {
    silenceCallback = onSilence;
    visualizationCallback = visualizer;
    start = Date.now();
    recording = true;
  };

  var stop = function () {
    recording = false;
  };

  var clear = function () {
    stop();
    worker.postMessage({command: 'clear'});
  };

  var exportWAV = function (callback, sampleRate) {
    currCallback = callback;
    worker.postMessage({
      command: 'export',
      sampleRate: sampleRate
    });
  };

  var analyse = function () {
    analyser.fftSize = 2048;
    var bufferLength = analyser.fftSize;
    var dataArray = new Uint8Array(bufferLength);
    var amplitude = silenceDetectionConfig.amplitude;
    var time = silenceDetectionConfig.time;

    analyser.getByteTimeDomainData(dataArray);

    if (typeof visualizationCallback === 'function') {
      visualizationCallback(dataArray, bufferLength);
    }

    for (var i = 0; i < bufferLength; i++) {
      // Normalize between -1 and 1.
      var curr_value_time = (dataArray[i] / 128) - 1.0;
      if (curr_value_time > amplitude || curr_value_time < (-1 * amplitude)) {
        start = Date.now();
      }
    }
    var newtime = Date.now();
    var elapsedTime = newtime - start;
    if (elapsedTime > time) {
      silenceCallback();
    }
  };

  node.onaudioprocess = function (audioProcessingEvent) {
    if (!recording) {
      return;
    }
    worker.postMessage({
      command: 'record',
      buffer: [
        audioProcessingEvent.inputBuffer.getChannelData(0),
      ]
    });
    analyse();
  };

  var analyser = source.context.createAnalyser();
  analyser.minDecibels = -90;
  analyser.maxDecibels = -10;
  analyser.smoothingTimeConstant = 0.85;

  source.connect(analyser);
  analyser.connect(node);
  node.connect(source.context.destination);

  return {
    record: record,
    stop: stop,
    clear: clear,
    exportWAV: exportWAV
  };
};

const AudioRecorder = function () {
  var requestDevice = function () {

    if (typeof audio_context === 'undefined') {
      window.AudioContext = window.AudioContext || window.webkitAudioContext;
      audio_context = new AudioContext();
    }

    return navigator.mediaDevices.getUserMedia({audio: true}).then(function (stream) {
      audio_stream = stream;
    });
  };

  var createRecorder = function (silenceDetectionConfig) {
    return recorder(audio_context.createMediaStreamSource(audio_stream), silenceDetectionConfig);
  };

  var audioContext = function () {
    return audio_context;
  };

  return {
    requestDevice: requestDevice,
    createRecorder: createRecorder,
    audioContext: audioContext
  };

};

export default AudioRecorder;
