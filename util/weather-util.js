'use strict';

var request = require('request');
const ADDS = require('adds');
var moment = require('moment');
// var tz = require('moment-timezone');
var HI = require('heat-index');
var Feels = require('feels');

var tobytweeter = require('../util/Toby');
// var sqlDate = "";
var previousFlagColor = "";
var previousAlert = "";
var TwitterWarning ="";
var previousAWOSData = {
          // wind_speed_kt: 10,
          // wind_speed_mph: 14,
          // wind_speed_mps: 22,
          // sea_level_pressure: 1000,
          // windDirection: 30,
          // temperature: 79,
          // tempC: 29
};

const ALERTBASEURL = "https://api.weather.gov/alerts?active=true&zone=";

module.exports = {

  weatherAPIPromiseAll: function(locObj,weatherDataBody) {

    // console.log(weatherDataBody);
    // console.log("location object", locObj);
    // console.log(locObj.awosStationId);

      return Promise.all([
        ADDS('metars', {
          stationString: locObj.awosStationId,
          hoursBeforeNow: 1
        }),
        new Promise((resolve, reject) => {
          let alertHeaders = {
            'User-Agent': 'NMRTC-Jax WEATHER APP',
            'Content-Type' : 'application/ld+json',
            'Accept' : 'application/ld+json'
          };


          request({
            headers: alertHeaders,
            url: ALERTBASEURL+locObj.alertZoneId,
            method: "GET"
          }, function(err, res, body) {
              if (!err && res.statusCode === 200) {
                var alerts = JSON.parse(body);
                var alertArray = [];

                alerts = alerts['@graph'];

                if (alerts.length > 0) {
                  TwitterWarning = "National Weather Service Alert - ";

                  alerts.forEach(function(alert){
                    var alertObj = {
                      link: alert['@id'],
                      type: alert['@type'],
                      alert: alert.headline
                    };
                    alertArray.push(alertObj);
                    TwitterWarning += alert.headline + " \n";
                  });

                } else {
                  TwitterWarning = "All NWS Warnings, Watches and Advisories have cleared.";
                  alertArray = [];
                }

                if (previousAlert === TwitterWarning) {

                } else {
                  tobytweeter.sendTweet(TwitterWarning);
                }
                previousAlert = TwitterWarning;


                resolve(alertArray);
              } else {
                reject(err);
              }
          })
        })
      ])
    .then(([metars, alerts]) => {


      // console.log("then*******************************************");
      // console.log(metars);
      // console.log("then*******************************************");
      weatherDataBody.AWOS = this.getAWOS(metars);
      weatherDataBody.WarnWatchAdvise = alerts;

      var formattedData = this.createWeatherBody(weatherDataBody);
      return formattedData;
    })
    .catch((err) => {
      console.log('weather promise all error ->', err);
    });
  },

  getAWOS: function(metars){


      var awosData = {};
      // console.log("getAWOS*******************************************");
      // console.log(metars);
      // console.log("getAWOS*******************************************");


      if (metars === undefined || metars.length === 0) {
        if (previousAWOSData.wind_speed_kt === undefined){

            previousAWOSData = {
                wind_speed_kt: 0,
                wind_speed_mph: 0,
                wind_speed_mps: 0,
                sea_level_pressure: 0,
                windDirection: 0,
                temperature: 0
              };
        }

        awosData = previousAWOSData;


      } else {
        var metarsArr = metars[0];

        var wsk = parseInt(metarsArr.wind_speed_kt); //Winds in knots parsed into integer
        var a = 1.151; //knots to mph calculation magic number 1 knot = 1.151 MPH
        let wsm = a * wsk; //knots converted to MPH
        var b = 2.237; //MPH to MPS calculation magic number 2.237
        let mps = wsm / b; //MPH converted to MPS
        let slp = metarsArr.sea_level_pressure_mb
        if (typeof slp === "number"){
          slp = parseInt(slp); //Sea level pressure parsed into integer
        } else {
          slp = 0;
        }

        var wdd = parseInt(metarsArr.wind_dir_degrees); //Wind Direction parsed into integer
        var tempC = parseInt(metarsArr.temp_c);
        var tempF = tempC * (9/5) + 32;


        awosData = {
          wind_speed_kt: this.roundNumber(wsk),
          wind_speed_mph: this.roundNumber(wsm),
          wind_speed_mps: this.roundNumber(mps),
          sea_level_pressure: slp,
          windDirection: wdd,
          temperature: this.roundNumber(tempF),
          tempC: this.roundNumber(tempC)
        };

        previousAWOSData = awosData;


      }

      return awosData;
  },

  createWeatherBody: function(data) {

    data.isoDate = Date.now();
    var timestamp = moment();

    data.timestamp = timestamp.tz('America/New_York').format();
    data.sqlDate = timestamp.tz('America/New_York').format("YYYY-MM-DD HH:mm:ss.SSS");

    var awosTemp = data['AWOS']['temperature'];
    var awosTempC = data['AWOS']['tempC'];
    var boxTempC = data['temperature'];
    var boxTempF = data['temperature'] * 9 / 5 +32;
    var tempComparison = (Math.abs(awosTemp - boxTempF)).toFixed(2);
    var heatIndex = HI.heatIndex({temperature: boxTempF, humidity: data.humidity, fahrenheit: true});
    data.tempComparison = tempComparison;
    data.tempsMatch = (tempComparison <=10)?true:false;



    data.temperatureAvg = boxTempC;//this.calcuateAvg(awosTempC, boxTempC);


    data.wbgtData = this.calculateWBGT(data);
    data.flagColor = this.calculateFlagColor(heatIndex);//this.calculateFlagColor(data.wbgtData.wbgtF);
    data.tempF = this.roundNumber(boxTempF);
    data.tempC = this.roundNumber(boxTempC);
    data.winds = this.roundNumber(data['AWOS']['wind_speed_mph']);
    data.pressure = this.roundNumber(data['AWOS']['sea_level_pressure']);
    data.wbgt = this.roundNumber(data.wbgtData.wbgtF);
    data.heatIndex = heatIndex.toFixed(2);
    data.feels = this.calculateFeelsMethods(data);

    var windsFromDegrees = data['AWOS']['windDirection'];

    if (windsFromDegrees) {
        data.windsFromDirection = this.degToDirection(windsFromDegrees);
    }

    //console.log(data);


    if (data.flagColor !== previousFlagColor) {
      tobytweeter.sendTweet("The current heat stress flag is " + data.flagColor + ". This is valid at " + data.sqlDate + " This will remain valid until a new flag is determined. The current Wet Bulb Globe Tempreature is " + data.wbgt + "F.");
    }
    previousFlagColor = data.flagColor;


    console.log(`WBGT ${data.wbgt} @ ${data.sqlDate}`);

    return data;

  },

  calculateFlagColor: function(wbgtf) {
    //Flag Color
    if (wbgtf <= 84.9) {
      return 'green';
    } else if (wbgtf >= 85 && wbgtf <= 87.9) {
      return 'yellow';
    } else if (wbgtf >= 88 && wbgtf <= 89.9){
      return 'red';
    } else {
      return 'black';
    }
  },

  calculateWBGT: function(data) {

        var wbgtData = {};

        var AvgTempCelsius = data.temperatureAvg;
        var HumidityFromSensor = data.humidity;
        var WindsInMPS = data.AWOS.wind_speed_mps;


        var relative = Math.exp(17.27*AvgTempCelsius/(237.7+AvgTempCelsius));
        var vapor = HumidityFromSensor/100*WindsInMPS*relative;
        wbgtData.wbgtC = (0.567*AvgTempCelsius) + (0.393 * vapor) + 3.94;
        wbgtData.wbgtF  = this.convertTempToF(wbgtData.wbgtC);

        return wbgtData;
  },

  calculateFeelsMethods: function(data) {

    //console.log(data);
    const config = {
      temp: data.temperature,
      humidity: data.humidity,
      speed: parseInt(data['AWOS']['wind_speed_mps']),
      units: {
        temp: 'c',
        speed: 'mps'
      }
    };

    //console.log(config);
     
    var feelsObj = {};
    var feelsLike = new Feels(config).toF().like();
    var awbgt = Feels.AWBGT(data.temperature, data.humidity);

    feelsObj.heatIndex = feelsLike.toFixed(2);
    feelsObj.awbgt = convertTempToF(awbgt);

    return feelsObj;
  },

  degToDirection: function(num) {
        var val = Math.floor((num / 22.5) + 0.5);
        var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return arr[(val % 16)];
  },

  convertTempToF: function(temp) {
    var ct = Feels.tempConvert(temp, 'c', 'f');
    return ct.toFixed(2); //Math.round((temp *1.8) +32);

  },

  roundNumber: function(x) {
    return Number.parseFloat(x).toFixed(0);
  },

  calcuateAvg: function(a,b) {
    var avg;
    avg = (Number(a) + Number(b)) / 2;
    return avg;
  }

};
