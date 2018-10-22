import AudioControl from './control';
import settings from './settings'
import axios from 'axios';

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

function Conversation (config, onStateChange, onSuccess, onError, onAudioData) {
  let currentState;

  this.config = applyDefaults(config);
  this.vuiConfig = this.config.vuiConfig;
  this.messages = MESSAGES;
  onStateChange = onStateChange || function () { /* no op */ };
  this.onSuccess = onSuccess || function () { /* no op */ };
  this.onError = onError || function () { /* no op */ };
  this.onAudioData = onAudioData || function () { /* no op */ };

  if (!this.config.vuiConfig.name) {
    this.onError('A Bot name must be provided.');
    return;
  }

  this.onSilence = function onSilence () {
    if (config.silenceDetection) {
      audioControl.stopRecording();
      currentState.advanceConversation();
    }
  };

  this.stopRecord = function stopRecord () {
    audioControl.stopRecording();
    audioControl.clear();
    currentState = new Initial(currentState.state)

    const state = currentState.state
    onStateChange(state.message)
    this.reset()
  }

  this.transition = function transition (conversation) {
    currentState = conversation;
    const state = currentState.state;
    onStateChange(state.message);

    if (
      state.message === state.messages.SENDING ||
      state.message === state.messages.SPEAKING
    ) {
      currentState.advanceConversation();
    }
    if (
      state.message === state.messages.SENDING &&
      !this.config.silenceDetection
    ) {
      audioControl.stopRecording();
    }
  };

  this.advanceConversation = function advanceConversation () {
    audioControl.supportsAudio(function supportsAudio (supported) {
      if (supported) {
        currentState.advanceConversation();
      } else {
        onError('Audio is not supported.');
      }
    });
  };

  this.updateConfig = function updateConfig (config) {
    this.config = applyDefaults(config);
    this.vuiConfig = this.config.vuiConfig;
  };

  this.reset = function reset () {
    audioControl.clear();
    currentState = new Initial(currentState.state);
  };

  currentState = new Initial(this);

  return {
    advanceConversation: this.advanceConversation,
    updateConfig: this.updateConfig,
    reset: this.reset,
    stopRecord: this.stopRecord
  };
}

function Initial (state) {
  this.state = state;
  state.message = state.messages.PASSIVE;

  this.advanceConversation = function advanceConversation () {
    audioControl.startRecording(
      state.onSilence,
      state.onAudioData,
      state.config.silenceDetectionConfig
    );

    state.transition(new Listening(state));
  };
}

function Listening (state) {
  this.state = state;
  state.message = state.messages.LISTENING;

  this.advanceConversation = function advanceConversation () {
    audioControl.exportWAV(function exportWAV (blob) {
      state.audioInput = blob;
      state.transition(new Sending(state));
    });
  };
}

function Sending (state) {
  this.state = state;
  state.message = state.messages.SENDING;

  this.advanceConversation = function advanceConversation () {
    state.vuiConfig.inputStream = state.audioInput;

    let data = new FormData();
    data.append('inputStream', state.vuiConfig.inputStream);
    data.append('name', state.vuiConfig.name);
    data.append('contentType', state.vuiConfig.contentType);
    data.append('userId', state.vuiConfig.userId);
    data.append('accept', state.vuiConfig.accept);

    axios({
      method: 'post',
      url: `${settings.apiUrl}/vui-server/content`,
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
}

function Speaking (state) {
  this.state = state;
  state.message = state.messages.SPEAKING;

  this.advanceConversation = function advanceConversation () {
    if (state.audioOutput.contentType === 'audio/mpeg') {
      audioControl.play(state.audioOutput.audioStream, function play () {
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
}

function applyDefaults (config) {
  config = config || {};
  config.silenceDetection = config.hasOwnProperty('silenceDetection')
    ? config.silenceDetection
    : true;

  const vuiConfig = config.vuiConfig || {};

  vuiConfig.name = vuiConfig.hasOwnProperty('name')
    ? vuiConfig.name
    : '';

  vuiConfig.contentType = vuiConfig.hasOwnProperty('contentType')
    ? vuiConfig.contentType
    : DEFAULT_CONTENT_TYPE;

  vuiConfig.userId = vuiConfig.hasOwnProperty('userId')
    ? vuiConfig.userId
    : DEFAULT_USER_ID;

  vuiConfig.accept = vuiConfig.hasOwnProperty('accept')
    ? vuiConfig.accept
    : DEFAULT_ACCEPT_HEADER_VALUE;

  config.vuiConfig = vuiConfig;

  return config;
}

export default Conversation;
