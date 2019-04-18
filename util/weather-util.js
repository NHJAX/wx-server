'use strict';

var request = require('request');
const ADDS = require('adds');
var moment = require('moment');
var tz = require('moment-timezone');

const ALERTBASEURL = "https://api.weather.gov/alerts?active=true&zone=";

module.exports = {

  weatherAPIPromiseAll: function(locObj,weatherDataBody) {
    console.log(locObj, weatherDataBody); 

      return Promise.all([
        ADDS('metars', {
          stationString: locObj.awosStationId, //NAS JAX ICAO
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
                  
                  alerts.forEach(function(alert){
                    //console.log(alert);
                    var alertObj = {
                      link: alert['@id'],
                      type: alert['@type'],
                      alert: alert.headline
                    };
                    alertArray.push(alertObj);
                  });

                } else {
                  alertArray = [];
                  // alertArray.push({id:'no active alerts'})
                }

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

      // body.AWOS = awosData;
      // body.WarnWatchAdvise = alerts;
      var formattedData = this.createWeatherBody('jax',weatherDataBody);

      return formattedData;
    })
    .catch((error) => {
      // console.log(error);
    });
  },

  // getAlerts: function(locationObj){
  //   let alertHeaders = {
  //     'User-Agent': 'NMRTC-Jax WEATHER APP',
  //     'Content-Type' : 'application/ld+json',
  //     'Accept' : 'application/ld+json'
  //   };
  //   let baseUrl = "https://api.weather.gov/alerts?active=true&zone=";

  //   request({
  //     headers: alertHeaders,
  //     url: baseUrl+locationObj.alertZoneId,
  //     method: "GET"
  //   }, function(err, res, body) {
  //       if (!err && res.statusCode === 200) {
  //         var alerts = JSON.parse(body);
  //         return alerts;
  //       } else {
  //         console.log(err)
  //         return;
  //       }
  //   })

  // }, 

  getAWOS: function(metars){
    
    var metarsArr = metars[0];
      // console.log(metars[0]); //METAR for NAS JAX
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
      //console.log(wsm, slp, wdd, mps);
      //wsm = Wind speed mph
      //slp = Sea Level pressure
      //wdd = Wind direction in degrees
      //mps = Wind meters per second
      var tempC = parseInt(metarsArr.temp_c);
      var tempF = tempC * (9/5) + 32;
      

      var awosData = {
        wind_speed_kt: wsk,
        wind_speed_mph: wsm,
        wind_speed_mps: mps,
        sea_level_pressure: slp,
        windDirection: wdd, 
        temperature: tempF,
        tempC: tempC
      };
      return awosData;
  },

  degToDirection: function(num) {
        var val = Math.floor((num / 22.5) + 0.5);
        var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
        return arr[(val % 16)];
  },

  convertTempToF: function(temp) {

    return Math.round((temp *1.8) +32);

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

        var TempFromSensorCelsius = data.temperature;
        var HumidityFromSensor = data.humidity;
        var WindsInMPS = data.AWOS.wind_speed_mps;


        var relative = Math.exp(17.27*TempFromSensorCelsius/(237.7+TempFromSensorCelsius));
        var vapor = HumidityFromSensor/100*WindsInMPS*relative;
        wbgtData.wbgtC = (0.567*TempFromSensorCelsius) + (0.393 * vapor) + 3.94;
        wbgtData.wbgtF  = this.convertTempToF(wbgtData.wbgtC);

        return wbgtData;
  },

  createWeatherBody: function(location, data) {

    console.log("data", data);

    var timestamp = moment();

    data.timestamp = timestamp.tz('America/New_York').format("MMM Do YY, HH:MM");

    var awosTemp = data['AWOS']['temperature'];
    var boxTempC = data['temperature'];
    var boxTempF = data['temperature'] * 9 / 5 +32;
    var tempComparison = (Math.abs(awosTemp - boxTempF)).toFixed(2);
    data.tempComparison = tempComparison;
    data.tempsMatch = (tempComparison <=10)?true:false;


    data.wbgtData = this.calculateWBGT(data);
    data.flagColor = this.calculateFlagColor(data.wbgtData.wbgtF);
    data.tempF = boxTempF;
    data.tempC = boxTempC;
    data.winds = Math.round(data['AWOS']['wind_speed_mph']);
    data.pressure = data['AWOS']['sea_level_pressure'];
    data.wbgt = data.wbgtData.wbgtF;

    var windsFromDegrees = data['AWOS']['windDirection'];

    if (windsFromDegrees) {
        data.windsFromDirection = this.degToDirection(windsFromDegrees);
    }

    console.log('createWeatherBody', data)
    return data;

  }

};

