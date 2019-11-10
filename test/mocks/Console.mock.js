module.exports = class ConsoleMock {
  constructor() {
    this.messageList = [];
  }

  debug(...message) { this.messageList.push({ type: 'debug', message }); }
  error(...message) { this.messageList.push({ type: 'error', message }); }
  log(...message) { this.messageList.push({ type: 'log', message }); }
  info(...message) { this.messageList.push({ type: 'info', message }); }
  warn(...message) { this.messageList.push({ type: 'warn', message }); }
}
