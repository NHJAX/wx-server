'use strict';

var Twitter = require('twitter');
var path = require('path');
var fs = require('fs');

// var config = require('./config.json');
// var T = new Twitter(config);

// Set up your search parameters
// var params = {
//   q: '#nodejs',
//   count: 10,
//   result_type: 'recent',
//   lang: 'en'
// }

// Initiate your search using the above paramaters
// T.get('search/tweets', params, function(err, data, response) {
//   // If there is no error, proceed
//   if(!err){
//     // Loop through the returned tweets
//     for(let i = 0; i < data.statuses.length; i++){
//       // Get the tweet Id from the returned data
//       let id = { id: data.statuses[i].id_str }
//       // Try to Favorite the selected Tweet
//       T.post('favorites/create', id, function(err, response){
//         // If the favorite fails, log the error message
//         if(err){
//           console.log(err[0].message);
//         }
//         // If the favorite is successful, log the url of the tweet
//         else{
//           let username = response.user.screen_name;
//           let tweetId = response.id_str;
//           console.log('Favorited: ', `https://twitter.com/${username}/status/${tweetId}`)
//         }
//       });
//     }
//   } else {
//     console.log(err);
//   }
// })

const WORKING_DIR = path.resolve('../secret-config');
const API_CONFIG = JSON.parse(fs.readFileSync(path.join(WORKING_DIR, 'api-config.json')));
console.log(API_CONFIG);

var twitter_application_consumer_key = API_CONFIG["consumer_key"];
var twitter_application_secret = API_CONFIG["consumer_secret"];
var twitter_user_access_token = API_CONFIG["access_token_key"];
var twitter_user_secret = API_CONFIG["access_token_secret"];

console.log(twitter_user_access_token);

module.exports = {
  sendTweet: function(body){
    var status = 'Lightning detected within ' + body.DistanceKM + ' @ ' + body.Time;  // This is the tweet (ie status)

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
        postBody,  // post body
        '',  // post content type ?
    	function(err, data, res) {
    		if (err) {
    			console.log(err);
    		} else {
    			console.log(data);
    		}
    	});

  }
}
