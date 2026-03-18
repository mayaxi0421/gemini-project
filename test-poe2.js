const https = require('https');

const testUrl = 'https://api.microlink.io/?url=https://poe.com&screenshot=true&meta=false&embed=screenshot.url';

https.get(testUrl, (res) => {
  console.log('Status:', res.statusCode);
  let data = '';
  res.on('data', chunk => data += chunk.length);
  res.on('end', () => console.log('Total chunks:', data.length));
});
