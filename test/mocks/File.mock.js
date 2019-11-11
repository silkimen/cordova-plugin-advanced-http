const BlobMock = require('./Blob.mock');

module.exports = class FileMock extends BlobMock {
  constructor(blob, fileName) {
    super(blob, { type: blob.type });
    this._fileName = fileName || '';
  }

  get name() {
    return this._fileName;
  }
}
