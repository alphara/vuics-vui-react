import AudioControl from './control';
import settings from './settings'
import axios from 'axios';

const DEFAULT_LATEST = '$LATEST';
const DEFAULT_CONTENT_TYPE = 'audio/x-l16; sample-rate=16000';
const DEFAULT_USER_ID = 'userId';
const DEFAULT_ACCEPT_HEADER_VALUE = 'audio/mpeg';
const MESSAGES = Object.freeze({
  PASSIVE: 'Passive',
  LISTENING: 'Listening',
  SENDING: 'Sending',
  SPEAKING: 'Speaking'
});

const audioControl = new AudioControl({ checkAudioSupport: false });

const bufferToArrayBuffer = (buffer) => {
  const ab = new ArrayBuffer(buffer.data.length);
  const view = new Uint8Array(ab);
  for (let i = 0; i < buffer.data.length; ++i) {
    view[i] = buffer.data[i];
  }
  return ab;
}

const Conversation = function (config, onStateChange, onSuccess, onError, onAudioData) {
  let currentState;

  this.config = applyDefaults(config);
  this.vuiConfig = this.config.vuiConfig;
  this.messages = MESSAGES;
  onStateChange = onStateChange || function () { /* no op */ };
  this.onSuccess = onSuccess || function () { /* no op */ };
  this.onError = onError || function () { /* no op */ };
  this.onAudioData = onAudioData || function () { /* no op */ };

  if (!this.config.vuiConfig.botName) {
    this.onError('A Bot name must be provided.');
    return;
  }

  this.onSilence = function () {
    if (config.silenceDetection) {
      audioControl.stopRecording();
      currentState.advanceConversation();
    }
  };

  this.transition = function (conversation) {
    currentState = conversation;
    const state = currentState.state;
    onStateChange(state.message);

    if (state.message === state.messages.SENDING || state.message === state.messages.SPEAKING) {
      currentState.advanceConversation();
    }
    if (state.message === state.messages.SENDING && !this.config.silenceDetection) {
      audioControl.stopRecording();
    }
  };

  this.advanceConversation = function () {
    audioControl.supportsAudio(function (supported) {
      if (supported) {
        currentState.advanceConversation();
      } else {
        onError('Audio is not supported.');
      }
    });
  };

  this.updateConfig = function (newValue) {
    this.config = applyDefaults(newValue);
    this.vuiConfig = this.config.vuiConfig;
  };

  this.reset = function () {
    audioControl.clear();
    currentState = new Initial(currentState.state);
  };

  currentState = new Initial(this);

  return {
    advanceConversation: this.advanceConversation,
    updateConfig: this.updateConfig,
    reset: this.reset
  };
};

const Initial = function (state) {
  this.state = state;
  state.message = state.messages.PASSIVE;
  this.advanceConversation = function () {
    audioControl.startRecording(state.onSilence, state.onAudioData, state.config.silenceDetectionConfig);
    state.transition(new Listening(state));
  };
};

const Listening = function (state) {
  this.state = state;
  state.message = state.messages.LISTENING;
  this.advanceConversation = function () {
    audioControl.exportWAV(function (blob) {
      state.audioInput = blob;
      state.transition(new Sending(state));
    });
  };
};

const Sending = function (state) {
  this.state = state;
  state.message = state.messages.SENDING;
  this.advanceConversation = function () {
    state.vuiConfig.inputStream = state.audioInput;

    let data = new FormData();
    data.append('inputStream', state.vuiConfig.inputStream);
    data.append('botAlias', state.vuiConfig.botAlias);
    data.append('botName', state.vuiConfig.botName);
    data.append('contentType', state.vuiConfig.contentType);
    data.append('userId', state.vuiConfig.userId);
    data.append('accept', state.vuiConfig.accept);

    // fetch(`${settings.apiUrl}/vui`, {
    //   method: 'POST', // *GET, POST, PUT, DELETE, etc.
    //   mode: 'cors', // no-cors, cors, *same-origin
    //   cache: 'no-cache', // *default, no-cache, reload, force-cache, only-if-cached
    //   credentials: 'include', // include, same-origin, *omit
    //   headers: {
    //     'X-API-key': settings.apiKey
    //     // 'Content-Type': 'application/json; charset=utf-8'
    //     // "Content-Type": "application/x-www-form-urlencoded",
    //   },
    //   // redirect: 'follow', // manual, *follow, error
    //   // referrer: 'no-referrer', // no-referrer, *client
    //   body: data // body data type must match "Content-Type" header
    // })
    //   .then(response => response.json())
    //   .then((response) => {
    //     console.log('fetch response: ', response)
    //     response.audioStream = bufferToArrayBuffer(response.audioStream);
    //     state.audioOutput = response;
    //
    //     state.transition(new Speaking(state));
    //     state.onSuccess(response);
    //   })
    //   .catch(err => {
    //     console.log('Sending error: ', err)
    //     state.onError(err);
    //     state.transition(new Initial(state));
    //   })

    axios({
      method: 'post',
      url: `${settings.apiUrl}/vui`,
      data,
      headers: {
        'X-API-key': settings.apiKey
      }
    }).then((response) => {
      response.data.audioStream = bufferToArrayBuffer(response.data.audioStream);
      state.audioOutput = response.data;
      state.transition(new Speaking(state));
      state.onSuccess(response.data);
    }).catch((err) => {
      state.onError(err);
      state.transition(new Initial(state));
    });
  };
};

const Speaking = function (state) {
  this.state = state;
  state.message = state.messages.SPEAKING;
  this.advanceConversation = function () {
    if (state.audioOutput.contentType === 'audio/mpeg') {
      audioControl.play(state.audioOutput.audioStream, function () {
        if (state.audioOutput.dialogState === 'ReadyForFulfillment' ||
          state.audioOutput.dialogState === 'Fulfilled' ||
          state.audioOutput.dialogState === 'Failed' ||
          !state.config.silenceDetection) {
          state.transition(new Initial(state));
        } else {
          audioControl.startRecording(state.onSilence, state.onAudioData, state.config.silenceDetectionConfig);
          state.transition(new Listening(state));
        }
      });
    } else {
      state.transition(new Initial(state));
    }
  };
};

const applyDefaults = function (config) {
  config = config || {};
  config.silenceDetection = config.hasOwnProperty('silenceDetection') ? config.silenceDetection : true;

  const vuiConfig = config.vuiConfig || {};
  vuiConfig.botAlias = vuiConfig.hasOwnProperty('botAlias') ? vuiConfig.botAlias : DEFAULT_LATEST;
  vuiConfig.botName = vuiConfig.hasOwnProperty('botName') ? vuiConfig.botName : '';
  vuiConfig.contentType = vuiConfig.hasOwnProperty('contentType') ? vuiConfig.contentType : DEFAULT_CONTENT_TYPE;
  vuiConfig.userId = vuiConfig.hasOwnProperty('userId') ? vuiConfig.userId : DEFAULT_USER_ID;
  vuiConfig.accept = vuiConfig.hasOwnProperty('accept') ? vuiConfig.accept : DEFAULT_ACCEPT_HEADER_VALUE;
  config.vuiConfig = vuiConfig;

  return config;
};

export default Conversation;
