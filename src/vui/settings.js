const settings = {
  apiKey: null,
  apiUrl: 'https://api.vuics.com/latest'
}

export const setApiKey = key => {
  settings.apiKey = key
}

export const setApiUrl = url => {
  settings.apiUrl = url
}

export default settings
