const https = require('https');

const testUrl = 'https://image.thum.io/get/width/1200/crop/15000/delay/8/noanimate/https://huggingface.co';

https.get(testUrl, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});
