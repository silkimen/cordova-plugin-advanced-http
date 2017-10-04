const args = process.argv.slice(2);
const fs = require('mz/fs');
const path = require('path');
const xml2js = require('xml2js');
const xmlPath = path.join(__dirname, '..', 'plugin.xml');

const parse = xml => new Promise((resolve, reject) => {
  const parser = new xml2js.Parser();

  parser.parseString(xml, (error, result) => {
    if (error) {
      reject(error);
    } else {
      resolve(result);
    }
  });
});

const stringify = obj => {
  const builder = new xml2js.Builder();

  return builder.buildObject(obj);
};

fs.readFile(xmlPath, 'utf-8')
  .then(xml => parse(xml))
  .then(parsed => {
    parsed.plugin.$.version = args[0];

    return fs.writeFile(xmlPath, stringify(parsed));
  });
