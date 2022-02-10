var req   = require('request'),
    exec  = require('child_process').exec,
    fs    = require('fs'),
    items = require('./items.json'),
    ctr   = 0;

require('dotenv').config()

const {TwitterApi} = require('twitter-api-v2');

const twitterClient = new TwitterApi({
  appKey: process.env.TWITTER_API_KEY,
  appSecret: process.env.TWITTER_API_SECRET,
  accessToken: process.env.TWITTER_ACCESS_TOKEN,
  accessSecret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});



function getItem() {
  if(items[ctr].detailsUrl != '') {
    req.get(items[ctr].detailsUrl, (err, res, body) => {
      if (err) return false;
      
      var outOfStock = body.search(/pdp-btn-soldout active/) !== -1;
      updateStatus(ctr, outOfStock);
    })
  } else {
    req.get(items[ctr].url, (err, res, body) => {
      if (err) return false;

      var onWebsite = body.search(/data-productsku="1729707-00-A"/) !== -1;
      updateStatus(ctr, onWebsite);
    });
  }
}

function updateStatus(_ctr, _avail) {
  items[_ctr].stockUpdate = '';
  items[_ctr].prevInstock = items[_ctr].instock;
  items[_ctr].instock = _avail;

  if(items[_ctr].instock != items[_ctr].prevInstock) {
    var msg = '';
    if(items[_ctr].instock)
    {
      //good news
      msg += '#TMYTowingAlert\r\n🥳💰💸 Good news ❗❗❗\r\n Towing package is now available in ' + items[_ctr].name + '\r\n' + items[_ctr].url;
    } else {
      //bad news
      msg += '#TMYTowingAlert\r\n😭😭😭 Bad news ❗❗❗\r\n Towing package NO longer available in ' + items[_ctr].name;
    }
    console.log('[%s] Tweeting immidiate update for %s', new Date().toISOString(), items[_ctr].name);
    tweetMessage(msg);
  }
  console.log('[%s] %s %s', new Date().toISOString(), items[_ctr].name, _avail ? '🟩 in stock' : '🟥 unavailable');

  ctr++;
  if (ctr < items.length) {
    getItem();
  } else {
    fs.writeFile('items.json', JSON.stringify(items, null, '  '), (err) => {
      if (err) console.log(err)
    });
  }
}

getItem();

setInterval(function() {
  ctr = 0;
  getItem();
}, 900000);


setInterval(function() {
  updateTwitterStock()
}, 21600000)

function tweetMessage(_msg) {
  twitterClient.v1.tweet(_msg).then((val) => {
  }).catch((err) => {
    console.log(err)
  })
}

function updateTwitterStock() {
  var msg = '#TMWTowingUpdate\r\n';

  for (let i = 0; i < items.length; i++) {
    msg += items[i].name + ': ' + (items[i].instock ? '🟩 in stock' : '🟥 unavailable') + '\r\n';
  }
  msg += ('[%s]', new Date().toISOString());
  
  console.log('[%s] Tweeting scheduled update', new Date().toISOString());
  tweetMessage(msg);
}
