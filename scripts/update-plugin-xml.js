const args = process.argv.slice(2);
const fs = require('fs');
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

const update = async (version) => {
  const xml = fs.readFileSync(xmlPath, 'utf-8');
  const parsed = await parse(xml);

  parsed.plugin.$.version = version;
  fs.writeFileSync(xmlPath, stringify(parsed));
};

return update(args[0]);
