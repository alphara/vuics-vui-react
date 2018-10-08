# FAQ

Frequently asked questions about [Vuics.com](https://vuics.com) client and API.

## What is difference between Server-side and Client-side Speech APIs

Vuics Speech API has costs. Web Speech API is free.
With using the Web Speech API, we lower costs on the speech
processing for our users significantly. The problem here is that
Speech recognition works only in Chrome browser. Safari and Firefox still
don’t support the recognition. At the time, all the modern browsers support
speech synthesis. So we are going to solve the problem with using
Web Speech API on the browsers where it is supported; or if not supported,
then we provide voice interface service with other speech engines.
So we want to make the VUIs cheap and available for everyone.

