const https = require('https');

const testUrl = 'https://api.microlink.io/?url=https://poe.com&screenshot=true&meta=false&embed=screenshot.url';

https.get(testUrl, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});
