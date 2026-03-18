const https = require('https');
https.get('https://api.microlink.io/?url=https://figma.com&screenshot=true&meta=false&embed=screenshot.url&waitFor=2000&fullPage=true', (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
});
