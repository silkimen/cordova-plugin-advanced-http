module.exports = class FileReaderMock {
  constructor() {
    this.EMPTY = 0;
    this.LOADING = 1;
    this.DONE = 2;

    this.error = null;
    this.onabort = () => {};
    this.onerror = () => {};
    this.onload = () => {};
    this.onloadend = () => {};
    this.onloadstart = () => {};
    this.onprogress = () => {};
    this.readyState = this.EMPTY;
    this.result = null;
  }

  readAsArrayBuffer(file) {
    this.readyState = this.LOADING;
    this.onloadstart();
    this.onprogress();
    this.result = file._buffer;
    this.readyState = this.DONE;
    this.onloadend();
    this.onload();
  }

  readAsBinaryString() {
    throw new Error('Not implemented in FileReaderMock.');
  }

  readAsDataUrl() {
    throw new Error('Not implemented in FileReaderMock.');
  }

  readAsText() {
    throw new Error('Not implemented in FileReaderMock.');
  }
}
