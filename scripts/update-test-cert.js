const fs = require('fs');
const https = require('https');
const path = require('path');

const SOURCE_HOST = 'httpbin.org';
const TARGET_PATH = path.join(__dirname, '../test/e2e-app-template/www/certificates/httpbin.org.cer');

const getCert = hostname => new Promise((resolve, reject) => {
  const options = {
    hostname,
    agent: false,
    rejectUnauthorized: false,
    ciphers: 'ALL'
  };

  const req = https.get(options, response => {
    const certificate = response.socket.getPeerCertificate();

    if (certificate === null) {
      return reject({ message: 'The website did not provide a certificate' });
    }

    resolve(certificate);
  });

  req.on('error', error => {
    return reject(error)
  });

  req.end();
});

console.log(`Updating test certificate from ${SOURCE_HOST}`);

getCert(SOURCE_HOST)
  .then(cert => {
    fs.writeFileSync(TARGET_PATH, cert.raw);
  })
  .catch(error => {
    console.error(`Updating test cert failed: ${error}`);
    process.exit(1);
  });
