module.exports = class BlobMock {
  constructor(blobParts, options) {
    if (blobParts instanceof BlobMock) {
      this._buffer = blobParts._buffer;
    } else {
      this._buffer = new Uint8Array(Buffer.concat(blobParts.map(part => Buffer.from(part, 'utf8')))).buffer;
    }

    this._type = options.type || '';
  }

  get size() {
    return this._buffer.length;
  }

  get type() {
    return this._type;
  }

  arrayBuffer() {
    throw new Error('Not implemented in BlobMock.');
  }

  slice() {
    throw new Error('Not implemented in BlobMock.');
  }

  stream() {
    throw new Error('Not implemented in BlobMock.');
  }

  text() {
    throw new Error('Not implemented in BlobMock.');
  }
}
