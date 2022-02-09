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
  req.get(items[ctr].url, (err, res, body) => {
    if (err) return false;
    var avail = body.search(/data-productsku="1729707-00-A"/) !== -1;
    
    items[ctr].stockUpdate = '';
    items[ctr].prevInstock = items[ctr].instock;
    items[ctr].instock = avail;

    if(items[ctr].instock != items[ctr].prevInstock) {
      var msg = '';
      if(items[ctr].instock)
      {
        //good news
        msg += '#TMYTowingAlert\r\n🥳💰💸 Good news ❗❗❗\r\n Towing package is now available in ' + items[ctr].name + '\r\n' + items[ctr].url;
      } else {
        //bad news
        msg += '#TMYTowingAlert\r\n😭😭😭 Bad news ❗❗❗\r\n Towing package NO longer available in ' + items[ctr].name;
      }
      console.log('[%s] Tweeting immidiate update for %s', new Date().toISOString(), items[ctr].name);
      tweetMessage(msg);
    }
    console.log('[%s] %s %s', new Date().toISOString(), items[ctr].name, avail ? '🟩 in stock' : '🟥 unavailable');
    
    ctr++;
    if (ctr < items.length) {
      getItem();
    } else {
      fs.writeFile('items.json', JSON.stringify(items, null, '  '), (err) => {
        if (err)
          console.log(err);
        else {
          updateTwitterStock();
        }
      });
    }
  });
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
  
  console.log('[%s] Tweeting scheduled update', new Date().toISOString());
  tweetMessage(msg);
}
