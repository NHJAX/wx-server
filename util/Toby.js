'use strict';

var Twitter = require('twitter');
var path = require('path');
var fs = require('fs');
var FB = require('fb');

const WORKING_DIR = path.resolve('../secret-config');
const API_CONFIG = JSON.parse(fs.readFileSync(path.join(WORKING_DIR, 'api-config.json')));

var twitter_application_consumer_key = API_CONFIG["consumer_key"];
var twitter_application_secret = API_CONFIG["consumer_secret"];
var twitter_user_access_token = API_CONFIG["access_token_key"];
var twitter_user_secret = API_CONFIG["access_token_secret"];
var Facebook_token = API_CONFIG["Facebook_token"];

module.exports = {
  sendTweet: function(status){

    var postBody = {
        'status': status
    };


    var OAuth = require('oauth');

    var oauth = new OAuth.OAuth(
        'https://api.twitter.com/oauth/request_token',
        'https://api.twitter.com/oauth/access_token',
        twitter_application_consumer_key,
        twitter_application_secret,
        '1.0A',
        null,
        'HMAC-SHA1'
    );

    console.log('Ready to Tweet article:\n\t', postBody.status);
    oauth.post('https://api.twitter.com/1.1/statuses/update.json',
        twitter_user_access_token,  // oauth_token (user access token)
        twitter_user_secret,  // oauth_secret (user secret)
        postBody,  // post
        '',  // post content type ?
        function(err, data, res) {
            if (err) {
                console.log("inside oauth post err ");

            } else {
                console.log(data);
            }
        }
      );
  }
}
