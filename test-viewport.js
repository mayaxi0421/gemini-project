const https = require('https');
const fs = require('fs');

const testUrl = 'https://api.microlink.io/?url=https://cloud.baidu.com/product/wenxinworkshop&screenshot=true&meta=false&embed=screenshot.url&waitFor=5000&viewport.width=1440&viewport.height=4000&force=true';

https.get(testUrl, (res) => {
  console.log('Status:', res.statusCode);
  console.log('Headers:', res.headers);
  if (res.statusCode === 302 || res.statusCode === 301) {
    console.log('Redirect:', res.headers.location);
  }
});
