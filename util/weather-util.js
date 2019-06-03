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
var TwitterWarning = "";
var awosDown = false;
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

  weatherAPIPromiseAll: function (locObj, weatherDataBody) {
    //console.log(locObj);
    //console.log(weatherDataBody);

    return Promise.all([
      ADDS('metars', {
        stationString: locObj.awosStationId,
        hoursBeforeNow: 1
      }),
      new Promise((resolve, reject) => {
        let alertHeaders = {
          'User-Agent': 'NMRTC-Jax WEATHER APP',
          'Content-Type': 'application/ld+json',
          'Accept': 'application/ld+json'
        };


        request({
          headers: alertHeaders,
          url: ALERTBASEURL + locObj.alertZoneId,
          method: "GET"
        }, function (err, res, body) {
          if (!err && res.statusCode === 200) {
            var alerts = JSON.parse(body);
            var alertArray = [];

            alerts = alerts['@graph'];

            if (alerts.length > 0) {
              TwitterWarning = "National Weather Service Alert - ";

              alerts.forEach(function (alert) {
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
              //tobytweeter.sendTweet(TwitterWarning);
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
        weatherDataBody.AWOS = this.getAWOS(metars);
        weatherDataBody.WarnWatchAdvise = alerts;

        var formattedData = this.createWeatherBody(weatherDataBody);
        return formattedData;
      })
      .catch((err) => {
        console.log('weather promise all error ->', err);
      });
  },

  getAWOS: function (metars) {


    var awosData = {};
    //console.log("getAWOS*******************************************");
    //console.log(metars);
    //console.log("getAWOS*******************************************");


    if (metars === undefined || metars.length === 0) {
      if (previousAWOSData.wind_speed_kt === undefined) {

        previousAWOSData = {
          wind_speed_kt: 0,
          wind_speed_mph: 0,
          wind_speed_mps: 0,
          sea_level_pressure: 0,
          windDirection: 0,
          temperature: 0,
          humidity: 0
        };
      }

      awosData = previousAWOSData;
      awosDown = true;


    } else {
      awosDown = false;
      var metarsArr = metars[0];

      var wsk = this.convertToNumber(metarsArr.wind_speed_kt); //Winds in knots parsed into integer
      var a = 1.151; //knots to mph calculation magic number 1 knot = 1.151 MPH
      let wsm = a * wsk; //knots converted to MPH
      var b = 2.237; //MPH to MPS calculation magic number 2.237
      let mps = wsm / b; //MPH converted to MPS
      let slp = metarsArr.sea_level_pressure_mb
      if (typeof slp === "number") {
        slp = this.convertToNumber(slp); //Sea level pressure parsed into integer
      } else {
        slp = 0;
      }

      var wdd = this.convertToNumber(metarsArr.wind_dir_degrees); //Wind Direction parsed into integer
      var tempC = this.convertToNumber(metarsArr.temp_c);
      var dewPoint = this.convertToNumber(metarsArr.dewpoint_c);

      awosData = {
        wind_speed_kt: this.roundNumber(wsk),
        wind_speed_mph: this.roundNumber(wsm),
        wind_speed_mps: this.roundNumber(mps),
        sea_level_pressure: this.convertToNumber(slp),
        windDirection: wdd,
        tempF: this.convertTempToF(tempC),
        tempC: this.roundNumber(tempC),
        humidity: this.roundNumber(Feels.getRH(tempC, dewPoint, { dewPoint: true }))
      };

      previousAWOSData = awosData;

    }
    return awosData;
  },

  createWeatherBody: function (data) {
    /* 
    console.log("createWeatherBody*******************************************");
    console.log(data);
    console.log("createWeatherBody*******************************************");
    */

    data.isoDate = Date.now();
    var timestamp = moment();

    data.timestamp = timestamp.tz('America/New_York').format();
    data.sqlDate = timestamp.tz('America/New_York').format("YYYY-MM-DD HH:mm:ss.SSS");

    var atc, btc, averageTempC, ah, bh, avgHum;

    btc = data['temperature'];   // box temp in Cel
    bh = data['humidity'];       // box humidity

    if (awosDown === false) {

      atc = data['AWOS']['tempC']; //awosTemp in Cel
      averageTempC = this.calcuateAvg(atc, btc);

      ah = data['AWOS']['humidity'];  //awos Humidity
      avgHum = this.calcuateAvg(ah, bh);

    } else {
      //set average temp and hum to the sensor because the feed is down
      averageTempC = btc;
      avgHum = bh;

    }
    //Set the object values here - conditionally based on if/else above
    data.tempC = averageTempC;
    data.tempF = this.convertTempToF(averageTempC);
    data.humidity = avgHum;


    var heatIndex = HI.heatIndex({ temperature: averageTempC, humidity: avgHum, fahrenheit: false });
    data.heatIndex = this.convertTempToF(heatIndex);

    
    data.pressure = this.roundNumber(data['AWOS']['sea_level_pressure']);
    //data.wbgt = this.roundNumber(data.wbgtData.wbgtF);
    
    data.winds = this.roundNumber(data['AWOS']['wind_speed_mph']);
    var windsFromDegrees = data['AWOS']['windDirection'];
    if (windsFromDegrees) {
      data.windsFromDirection = this.degToDirection(windsFromDegrees);
    }

    data.feels = this.calculateFeelsMethods(data);
    data.flagColor = this.calculateFlagColor(data.feels.awbgt);
    if (data.flagColor === previousFlagColor) {
      console.log('Flag colors match. No new update to database');
      console.log("The current heat stress flag is " + data.flagColor + ". This is valid at " + data.sqlDate + " This will remain valid until a new flag is determined. The current Wet Bulb Globe Tempreature is " + data.feels.awbgt + "F.");
      return 'no update';
    } else {
      tobytweeter.sendTweet("The current heat stress flag is " + data.flagColor + ". This is valid at " + data.sqlDate + " This will remain valid until a new flag is determined. The current Wet Bulb Globe Tempreature is " + data.feels.awbgt + "F.");
      previousFlagColor = data.flagColor;
      return data;
    }
  },

  calculateFlagColor: function (wbgtf) {
    //Flag Color
    if (wbgtf <= 84.99) {
      return 'green';
    } else if (wbgtf >= 85 && wbgtf <= 87.99) {
      return 'yellow';
    } else if (wbgtf >= 88 && wbgtf <= 89.99) {
      return 'red';
    } else {
      return 'black';
    }
  },

  calculateWBGT: function (data) {

    var wbgtData = {};

    var AvgTempCelsius = data.averageTempC;
    var HumidityFromSensor = data.humidity;
    var WindsInMPS = data.AWOS.wind_speed_mps;


    var relative = Math.exp(17.27 * AvgTempCelsius / (237.7 + AvgTempCelsius));
    var vapor = HumidityFromSensor / 100 * WindsInMPS * relative;
    wbgtData.wbgtC = (0.567 * AvgTempCelsius) + (0.393 * vapor) + 3.94;
    wbgtData.wbgtF = this.convertTempToF(wbgtData.wbgtC);

    return wbgtData;
  },

  calculateFeelsMethods: function (data) {

    const config = {
      temp: data.tempC,
      humidity: data.humidity,
      speed: this.convertToNumber(data['AWOS']['wind_speed_mps']),
      units: {
        temp: 'c',
        speed: 'mps'
      }
    };


    var feelsObj = {};
    var feelsLike = new Feels(config).toF().like();
    var awbgt = Feels.AWBGT(data.temperature, data.humidity);

    feelsObj.heatIndex = this.roundNumber(feelsLike);//.toFixed(1);
    feelsObj.awbgt = this.convertTempToF(awbgt);

    return feelsObj;
  },

  degToDirection: function (num) {
    var val = Math.floor((num / 22.5) + 0.5);
    var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
  },

  convertTempToF: function (temp) {
    var ct = Feels.tempConvert(temp, 'c', 'f');
    
    return parseInt(ct.toFixed(1));

  },

  roundNumber: function (num,dec) {
    if (!dec) {
      return parseInt(num)
    } else {
      return Number.parseFloat(num).toFixed(1);
    }
    
  },

  calcuateAvg: function (a, b) {
    var avg;
    avg = (Number(a) + Number(b)) / 2;
    return parseInt(avg);
  },
  
  convertToNumber: function (e) {
    return Number(e);
  }

};
