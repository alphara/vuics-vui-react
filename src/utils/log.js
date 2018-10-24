const debugStyle = 'font-weight: bold; color: #00f;'

export function logMessage (text, extraParameters) {
  if (text.indexOf('%c') === -1 && !extraParameters) {
    console.log(text);
  } else {
    console.log(text, extraParameters || debugStyle)
  }
}
