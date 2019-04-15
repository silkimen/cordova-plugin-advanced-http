const fs = require('fs');
const https = require('https');
const path = require('path');

const SOURCE_URL = 'https://badssl.com/certs/badssl.com-client.p12';
const TARGET_PATH = path.join(__dirname, '../test/e2e-app-template/www/certificates/badssl-client-cert.pkcs');

const downloadPkcsContainer = (source, target) => new Promise((resolve, reject) => {
  const file = fs.createWriteStream(target);

  const req = https.get(source, response => {
    response.pipe(file)
    resolve(target);
  });

  req.on('error', error => {
    return reject(error)
  });

  req.end();
});

console.log(`Updating client certificate from ${SOURCE_URL}`);

downloadPkcsContainer(SOURCE_URL, TARGET_PATH)
  .catch(error => {
    console.error(`Updating client certificate failed: ${error}`);
    process.exit(1);
  });
