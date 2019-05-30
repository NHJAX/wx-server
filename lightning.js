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
  var strikeEventObj = {};
  var strikeEventArr = [];
  var err
  var response
  var body
  var resolve
  var reject
  var CronTimer
  var jacksonvilleDistance = 0
  var mayportDistance = 0
  var keywestDistance = 0
  var albanyDistance = 0
  var kingsbayDistance = 0
  var jacksonvilleBearing = 0
  var mayportBearing = 0
  var keywestBearing = 0
  var albanyBearing = 0
  var kingsbayBearing = 0
  var stormCenterjacksonville = 0
  var stormCentermayport = 0
  var stormCenteralbany = 0
  var stormCenterkeywest = 0
  var stormCenterkingsbay = 0
  var stormDirectionjacksonville = 0
  var stormDirectionmayport = 0
  var stormDirectionkeywest = 0
  var stormDirectionalbany = 0
  var stormDirectionkingsbay = 0

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

  arr.forEach((item) => {
      singleStrikeEvent = geolib.isPointWithinRadius(
          {latitude: item.lat, longitude: item.long},
          {latitude: locations[0].latitude, longitude: locations[0].longitude},
          RangeRing
       )
       if(singleStrikeEvent === true) {
         direction = geolib.getRhumbLineBearing(
           {latitude: item.lat, longitude: item.long},
           {latitude: locations[0].latitude, longitude: locations[0].longitude}
         );
         distance = geolib.getPreciseDistance(
           {latitude: item.lat, longitude: item.long},
           {latitude: locations[0].latitude, longitude: locations[0].longitude}
         );
         loc = locations[0].name
         if(loc == "Jacksonville") {
           jacksonvilleStrikeCount = jacksonvilleStrikeCount + 1;
            };
         var objToPush = {};
         jacksonvilleDistance = jacksonvilleDistance + distance;
         jacksonvilleBearing = jacksonvilleBearing + direction;
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
           direction = geolib.getRhumbLineBearing(
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
           mayportDistance = mayportDistance + distance;
           mayportBearing = mayportBearing + direction;
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
             direction = geolib.getRhumbLineBearing(
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
             keywestDistance = keywestDistance + distance;
             keywestBearing = keywestBearing + direction;
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
               direction = geolib.getRhumbLineBearing(
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
               albanyDistance = albanyDistance + distance;
               albanyBearing = albanyBearing + direction;
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
                 direction = geolib.getRhumbLineBearing(
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
                 kingsbayDistance = kingsbayDistance + distance;
                 kingsbayBearing = kingsbayBearing + direction;
                 objToPush.location = loc;
                 objToPush.direction = direction;
                 objToPush.distance = distance;
                 allStationStrikeData.push(objToPush);
                 }
               }
            );
  sd = jacksonvilleStrikeCount + mayportStrikeCount + keywestStrikeCount + albanyStrikeCount + kingsbayStrikeCount;
  stormCenterjacksonville = Math.trunc(jacksonvilleDistance / jacksonvilleStrikeCount)
  stormCentermayport = Math.trunc(mayportDistance / mayportStrikeCount)
  stormCenterkeywest = Math.trunc(keywestDistance / keywestStrikeCount)
  stormCenteralbany = Math.trunc(albanyDistance / albanyStrikeCount)
  stormCenterkingsbay = Math.trunc(kingsbayDistance / kingsbayStrikeCount)
  stormDirectionjacksonville = Math.trunc(jacksonvilleBearing / jacksonvilleStrikeCount)
  stormDirectionmayport = Math.trunc(mayportBearing / mayportStrikeCount)
  stormDirectionkeywest = Math.trunc(keywestBearing / keywestStrikeCount)
  stormDirectionalbany = Math.trunc(albanyBearing / albanyStrikeCount)
  stormDirectionkingsbay = Math.trunc(kingsbayBearing / kingsbayStrikeCount)
  if(jacksonvilleStrikeCount > 0){
    strikeEventObj = {
      "LightningDetected": "Yes",
      "Location": "Jax",
      "Type": "Lightning",
      "Bearing": stormDirectionjacksonville,
      "strikesDetected": jacksonvilleStrikeCount,
      "StormCenter": stormCenterjacksonville
    }
    strikeEventArr.push(strikeEventObj)
  }
  if(mayportStrikeCount > 0){
    strikeEventObj = {
      "LightningDetected": "Yes",
      "Location": "Mayport",
      "Type": "Lightning",
      "Bearing": stormDirectionmayport,
      "strikesDetected": mayportStrikeCount,
      "StormCenter": stormCentermayport
    }
    strikeEventArr.push(strikeEventObj)
  }
  if(keywestStrikeCount > 0){
    strikeEventObj = {
      "LightningDetected": "Yes",
      "Location": "Keywest",
      "Type": "Lightning",
      "Bearing": stormDirectionkeywest,
      "strikesDetected": keywestStrikeCount,
      "StormCenter": stormCenterkeywest

    }
    strikeEventArr.push(strikeEventObj)
  }
  if(albanyStrikeCount > 0){
    strikeEventObj = {
      "LightningDetected": "Yes",
      "Location": "Albany",
      "Type": "Lightning",
      "Bearing": stormDirectionalbany,
      "strikesDetected": albanyStrikeCount,
      "StormCenter": stormCenteralbany
    }
    strikeEventArr.push(strikeEventObj)
  }
  if(kingsbayStrikeCount > 0){
    strikeEventObj = {
      "LightningDetected": "Yes",
      "Location": "Kingsbay",
      "Type": "Lightning",
      "Bearing": stormDirectionkingsbay,
      "strikesDetected": kingsbayStrikeCount,
      "StormCenter": stormCenterkingsbay
    }
    strikeEventArr.push(strikeEventObj)
  }
  if(sd === 0) {
    strikeEventObj = {
    "LightningDetected": "No",
    "Location": "None",
    "Type": "Lightning",
    "Bearing": "0",
    "strikesDetected": "0",
    "StormCenter": "0"
  }
  strikeEventArr.push(strikeEventObj)
}
log('strikeEventArr',strikeEventArr);
    // log(sd, "strikes detected");
    // log(strikeEventObject);
    // log(sd, "strikes detected");
    // log(jacksonvilleStrikeCount, "strikes detected near Jacksonville");
    // log(mayportStrikeCount, "strikes detected near Mayport");
    // log(keywestStrikeCount, "strikes detected near Keywest");
    // log(albanyStrikeCount, "strikes detected near Albany");
    // log(kingsbayStrikeCount, "strikes detected near Kingsbay");
    // log(allStationStrikeData);

});
};
new CronJob('*/1 * * * * ', Lightning, null, true,'America/New_York');
// Lightning()
