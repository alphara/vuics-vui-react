import work from 'webworkify-webpack';

class Recorder {
  constructor (source, { time = 1500, amplitude = 0.2 } = {}) {
    console.log('new Recorder')
    this.recording = false

    this.start = 0
    this.time = time
    this.amplitude = amplitude

    this.onAudioProcess = this.onAudioProcess.bind(this)
    this.onMessage = this.onMessage.bind(this)
    this.record = this.record.bind(this)
    this.stop = this.stop.bind(this)
    this.clear = this.clear.bind(this)
    this.exportWAV = this.exportWAV.bind(this)
    this.analyse = this.analyse.bind(this)

    this.worker = work(require.resolve('./worker.js'))
    this.worker.onmessage = this.onMessage
    this.worker.postMessage({
      command: 'init',
      config: {
        sampleRate: source.context.sampleRate
      }
    })

    this.node = source.context.createScriptProcessor(4096, 1, 1)
    this.node.onaudioprocess = this.onAudioProcess

    this.analyser = source.context.createAnalyser()
    this.analyser.minDecibels = -90
    this.analyser.maxDecibels = -10
    this.analyser.smoothingTimeConstant = 0.85

    source.connect(this.analyser)
    this.analyser.connect(this.node)
    this.node.connect(source.context.destination)

    this.onSilence = this.onSilence.bind(this)
    this.currCallback = this.currCallback.bind(this)
    this.visualizationCallback = this.visualizationCallback.bind(this)
  }

  onSilence () {}

  currCallback () {}

  visualizationCallback () {}

  onAudioProcess ({ inputBuffer }) {
    if (!this.recording) {
      return
    }

    this.worker.postMessage({
      command: 'record',
      buffer: [
        inputBuffer.getChannelData(0)
      ]
    })

    this.analyse()
  }

  onMessage ({ data }) {
    this.currCallback(data);
  }

  record ({ onSilence, visualizer }) {
    console.log('record')
    this.onSilence = onSilence

    this.visualizationCallback = visualizer

    this.start = Date.now()

    this.recording = true
  }

  stop () {
    this.recording = false
  }

  clear = () => {
    this.stop()

    this.worker.postMessage({
      command: 'clear'
    })
  }

  exportWAV (callback, sampleRate) {
    this.currCallback = callback;

    this.worker.postMessage({
      command: 'export',
      sampleRate: sampleRate
    });
  }

  // analyser.fftSize = 2048;
  // var bufferLength = analyser.fftSize;
  // var dataArray = new Uint8Array(bufferLength);
  // var amplitude = silenceDetectionConfig.amplitude;
  // var time = silenceDetectionConfig.time;
  //
  // analyser.getByteTimeDomainData(dataArray);
  //
  // if (typeof visualizationCallback === 'function') {
  //   visualizationCallback(dataArray, bufferLength);
  // }
  //
  // for (var i = 0; i < bufferLength; i++) {
  //   // Normalize between -1 and 1.
  //   var curr_value_time = (dataArray[i] / 128) - 1.0;
  //   if (curr_value_time > amplitude || curr_value_time < (-1 * amplitude)) {
  //     start = Date.now();
  //   }
  // }
  // var newtime = Date.now();
  // var elapsedTime = newtime - start;
  // if (elapsedTime > time) {
  //   silenceCallback();
  // }

  analyse () {
    this.analyser.fftSize = 2048;

    const bufferLength = this.analyser.fftSize

    const dataArray = new Uint8Array(bufferLength);

    this.analyser.getByteTimeDomainData(dataArray);

    if (typeof this.visualizationCallback === 'function') {
      this.visualizationCallback(dataArray, bufferLength);
    }

    for (let i = 0; i < bufferLength; i++) {
      // Normalize between -1 and 1.
      const currValueTime = (dataArray[i] / 128) - 1.0;

      if (currValueTime > this.amplitude || currValueTime < (-1 * this.amplitude)) {
        this.start = Date.now();
      }
    }

    if ((Date.now() - this.start) > this.time) {
      this.onSilence();
    }
  }
}

class AudioRecorder {
  constructor () {
    console.log('new AudioRecorder')
    this.audioContext = null
    this.audioStream = null
    this.recorder = null

    this.requestDevice = this.requestDevice.bind(this)
    this.createRecorder = this.createRecorder.bind(this)
    this.getAudioContext = this.getAudioContext.bind(this)
  }

  requestDevice () {
    if (this.audioContext === null) {
      window.AudioContext = window.AudioContext || window.webkitAudioContext

      this.audioContext = new window.AudioContext()
    }

    return navigator.mediaDevices
      .getUserMedia({
        audio: true
      })
      .then((stream) => {
        this.audioStream = stream;
      })
  }

  createRecorder (config) {
    if (this.recorder !== null) {
      return this.recorder
    } else {
      this.recorder = new Recorder(
        this.audioContext.createMediaStreamSource(this.audioStream),
        config
      )
    }

    return this.recorder
  }

  getAudioContext () {
    return this.audioContext
  }
}

const Instance = new AudioRecorder()

export default Instance
