const https = require('https');
const data = JSON.stringify({
  query: `{
    farms(where: {id: "10000"}) {
      id
      bumpkinId
    }
  }`
});

const options = {
  hostname: 'api.thegraph.com',
  path: '/subgraphs/name/sunflower-land/sunflower-land',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
};

const req = https.request(options, (res) => {
  let resData = '';
  res.on('data', d => resData += d);
  res.on('end', () => console.log(resData));
});
req.write(data);
req.end();
