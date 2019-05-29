var geolib = require('geolib');
var request = require('request');
const util = require('util')
//location of lightning data from WWLLN
var url = "https://wwlln.net/new/map/data/current.json";
let log = console.log
//Timer
var CronJob = require('cron').CronJob;
//Size of station range ring in meters
var RangeRing = 32187;
//If shit breaks you might want to look at this package as suspect
// console.log(geolib);

function Lightning(){
  var singleStrikeEvent
  var jacksonvilleStrikeCount = 0
  var mayportStrikeCount = 0
  var keywestStrikeCount = 0
  var albanyStrikeCount = 0
  var kingsbayStrikeCount = 0
  var allStationStrikeData = []
  var singleStrikeEvent = {};
  var strikeArrToPush = [];
  var strikeEventObject = [];
  var err
  var response
  var body
  var resolve
  var reject
//define hospitals

var locations = [
    {
      name: "Jacksonville",
      latitude: 30.216884,
      longitude: -81.691279
    },
    {
      name: "Mayport",
      latitude: 30.353528,
      longitude: -81.424789
    },
    {
      name: "Keywest",
      latitude: 24.579138,
      longitude: -81.690508
    },
    {
      name: "Albany",
      latitude: 31.578461,
      longitude: -84.155884
    },
    {
      name: "Kingsbay",
      latitude: 30.799360,
      longitude: -81.531210
    }
];

//setup promise
function initialize() {
  return new Promise(function(resolve, reject) {

    request({
      url: url,
      method: 'GET',
      json:true,
    }, function (err, response, body) {
      if (err) {
				reject(err);
			} else {
				resolve(body);
			}
	});
});
};
//call promise and wait for response
initialize().then(function(data) {

//  JSON Parser
  var arr = [];
  for (var item in data) {
    arr.push(data[item]);
  }
  util.inspect.defaultOptions.maxArrayLength = null;

//Parsing through each item to determine if strike was at any assigned station
  arr.forEach((item) => {
//Strike is plotted with a range ring around the station
      singleStrikeEvent = geolib.isPointWithinRadius(
//location of strike
          {latitude: item.lat, longitude: item.long},
//location of station
          {latitude: locations[0].latitude, longitude: locations[0].longitude},
//Size of range ring in meters
          RangeRing
       )
//The direction of strike from the station is calculated
       if(singleStrikeEvent === true) {
         direction = geolib.getCompassDirection(
           {latitude: item.lat, longitude: item.long},
           {latitude: locations[0].latitude, longitude: locations[0].longitude}
         );
//The distance of strike from the station is calculated
         distance = geolib.getPreciseDistance(
           {latitude: item.lat, longitude: item.long},
           {latitude: locations[0].latitude, longitude: locations[0].longitude}
         );
//The stations name is placed into memory
         loc = locations[0].name
//A sort is performed to format the collected data
         if(loc == "Jacksonville") {
//Total number of strikes with in the range ring is counted
           jacksonvilleStrikeCount = jacksonvilleStrikeCount + 1;
            };
//This object will be included in future upgrades which includes location of station direction and distance of strike
         var objToPush = {};
         objToPush.location = loc;
         objToPush.direction = direction;
         objToPush.distance = distance;
         allStationStrikeData.push(objToPush);
         }
       });
//All calculations are the same as above
    //Mayport
    arr.forEach((item) => {
        singleStrikeEvent = geolib.isPointWithinRadius(
            {latitude: item.lat, longitude: item.long},
            {latitude: locations[1].latitude, longitude: locations[1].longitude},
            RangeRing
         )
         if(singleStrikeEvent === true) {
           direction = geolib.getCompassDirection(
             {latitude: item.lat, longitude: item.long},
             {latitude: locations[1].latitude, longitude: locations[1].longitude}
           );
           distance = geolib.getPreciseDistance(
             {latitude: item.lat, longitude: item.long},
             {latitude: locations[1].latitude, longitude: locations[1].longitude}
           );
           loc = locations[1].name
           if(loc == "Mayport") {
             mayportStrikeCount = mayportStrikeCount + 1;

           };
           var objToPush = {};
           objToPush.location = loc;
           objToPush.direction = direction;
           objToPush.distance = distance;
           allStationStrikeData.push(objToPush);
           }
         }
      );

      //Keywest
      arr.forEach((item) => {
          singleStrikeEvent = geolib.isPointWithinRadius(
              {latitude: item.lat, longitude: item.long},
              {latitude: locations[2].latitude, longitude: locations[2].longitude},
              RangeRing
           )
           if(singleStrikeEvent === true) {
             direction = geolib.getCompassDirection(
               {latitude: item.lat, longitude: item.long},
               {latitude: locations[2].latitude, longitude: locations[2].longitude}
             );
             distance = geolib.getPreciseDistance(
               {latitude: item.lat, longitude: item.long},
               {latitude: locations[2].latitude, longitude: locations[2].longitude}
             );
             loc = locations[2].name
             if(loc == "Keywest") {
               keywestStrikeCount = keywestStrikeCount + 1;

             };
             var objToPush = {};
             objToPush.location = loc;
             objToPush.direction = direction;
             objToPush.distance = distance;
             allStationStrikeData.push(objToPush);
             }
           }
        );

        //Albany
        arr.forEach((item) => {
            singleStrikeEvent = geolib.isPointWithinRadius(
                {latitude: item.lat, longitude: item.long},
                {latitude: locations[3].latitude, longitude: locations[3].longitude},
                RangeRing
             )
             if(singleStrikeEvent === true) {
               direction = geolib.getCompassDirection(
                 {latitude: item.lat, longitude: item.long},
                 {latitude: locations[3].latitude, longitude: locations[3].longitude}
               );
               distance = geolib.getPreciseDistance(
                 {latitude: item.lat, longitude: item.long},
                 {latitude: locations[3].latitude, longitude: locations[3].longitude}
               );
               loc = locations[3].name
               if(loc == "Albany") {
                 albanyStrikeCount = albanyStrikeCount + 1;

               };
               var objToPush = {};
               objToPush.location = loc;
               objToPush.direction = direction;
               objToPush.distance = distance;
               allStationStrikeData.push(objToPush);
               }
             }
          );

          //Kingsbay
          arr.forEach((item) => {
              singleStrikeEvent = geolib.isPointWithinRadius(
                  {latitude: item.lat, longitude: item.long},
                  {latitude: locations[4].latitude, longitude: locations[4].longitude},
                  RangeRing
               )
               if(singleStrikeEvent === true) {
                 direction = geolib.getCompassDirection(
                   {latitude: item.lat, longitude: item.long},
                   {latitude: locations[4].latitude, longitude: locations[4].longitude}
                 );
                 distance = geolib.getPreciseDistance(
                   {latitude: item.lat, longitude: item.long},
                   {latitude: locations[4].latitude, longitude: locations[4].longitude}
                 );
                 loc = locations[4].name
                 if(loc == "Kingsbay") {
                   kingsbayStrikeCount = kingsbayStrikeCount + 1;
                 };
                 var objToPush = {};
                 objToPush.location = loc;
                 objToPush.direction = direction;
                 objToPush.distance = distance;
                 allStationStrikeData.push(objToPush);
                 }
               }
            );
  sd = jacksonvilleStrikeCount + mayportStrikeCount + keywestStrikeCount + albanyStrikeCount + kingsbayStrikeCount;
  if(jacksonvilleStrikeCount > 0){
    var strikeArrToPush = {
      "LightningDetected": "Yes",
      "Location": "Jax",
      "Type": "Lightning"
    }
    strikeEventObject.push(strikeArrToPush)
  }
  if(mayportStrikeCount > 0){
    var strikeArrToPush = {
      "LightningDetected": "Yes",
      "Location": "Mayport",
      "Type": "Lightning"
    }
    strikeEventObject.push(strikeArrToPush)
  }
  if(keywestStrikeCount > 0){
    var strikeArrToPush = {
      "LightningDetected": "Yes",
      "Location": "Keywest",
      "Type": "Lightning"
    }
    strikeEventObject.push(strikeArrToPush)
  }
  if(albanyStrikeCount > 0){
    var strikeArrToPush = {
      "LightningDetected": "Yes",
      "Location": "Albany",
      "Type": "Lightning"
    }
    strikeEventObject.push(strikeArrToPush)
  }
  if(kingsbayStrikeCount > 0){
    var strikeArrToPush = {
      "LightningDetected": "Yes",
      "Location": "Kingsbay",
      "Type": "Lightning"
    }
    strikeEventObject.push(strikeArrToPush)
  }
  if(sd === 0) {
    var strikeArrToPush = {
    "LightningDetected": "No",
    "Location": "None",
    "Type": "Lightning"
  }
  strikeEventObject.push(strikeArrToPush)
}
    log(sd, "strikes detected");
    log(strikeEventObject);
//     log(sd, "strikes detected");
//     log(jacksonvilleStrikeCount, "strikes detected near Jacksonville");
//     log(mayportStrikeCount, "strikes detected near Mayport");
//     log(keywestStrikeCount, "strikes detected near Keywest");
//     log(albanyStrikeCount, "strikes detected near Albany");
//     log(kingsbayStrikeCount, "strikes detected near Kingsbay");
//     var strikeArrToPush = {
//         "strikesDetected": sd,
//         "Jacksonville": jacksonvilleStrikeCount,
//         "Mayport": mayportStrikeCount,
//         "Keywest": keywestStrikeCount,
//         "Albany": albanyStrikeCount,
//         "Kingsbay": kingsbayStrikeCount,
// };
//     log(strikeArrToPush);
  //   log(allStationStrikeData);
  // }
//
});
};
new CronJob('*/1 * * * * ', Lightning, null, true,'America/New_York');
