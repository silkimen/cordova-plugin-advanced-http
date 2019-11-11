const BlobMock = require('./Blob.mock');
const FileMock = require('./File.mock');

module.exports = class FormDataMock {
  constructor() {
    this.map = new Map();
  }

  append(name, value, filename) {
    if (value instanceof BlobMock) {
      this.map.set(name, new FileMock(value, filename))
    } else {
      this.map.set(name, value);
    }
  }

  delete() {
    throw new Error('Not implemented in FormDataMock.');
  }

  entries() {
    return this.map.entries();
  }

  forEach(cb) {
    return this.map.forEach(cb);
  }

  get(key) {
    return this.map.get(key);
  }

  getAll() {
    throw new Error('Not implemented in FormDataMock.');
  }

  has(key) {
    return this.map.has(key);
  }

  keys() {
    return this.map.keys();
  }

  set(key, value) {
    return this.map.set(key, value);
  }

  values() {
    return this.map.values();
  }
};
