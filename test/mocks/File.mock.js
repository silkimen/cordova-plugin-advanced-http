const BlobMock = require('./Blob.mock');

module.exports = class FileMock extends BlobMock {
  constructor(blob, fileName) {
    super(blob, { type: blob.type });
    this._fileName = fileName !== undefined ? fileName : 'blob';
    this.__lastModifiedDate = new Date();
  }

  get name() {
    return this._fileName;
  }

  get lastModifiedDate() {
    return this.__lastModifiedDate;
  }
}
