'use strict';

var _ = require('underscore');
var fs = require('fs');
var path = require('path');
var express = require('express');
var appUtil = require('../util/app-util');
var moment = require('moment');
var tz = require('moment-timezone');
var RequestError = require('../util/request-error');
var request = require('request');
var firebaseWeather = require("firebase");
const WORKING_DIR = path.resolve('../secret-config');

const log = console.log;

const firebaseWeatherConfig = JSON.parse(fs.readFileSync(path.join(WORKING_DIR, 'nmrtcjax-firebase-config.json')));
var locationArray = require('../config/location-config').data;

/*
Require util files
*/
var weatherUtils = require('../util/weather-util');
var tobytweeter = require('../util/Toby');
var weatherApp = express();
var dbInstance = firebaseWeather.initializeApp(firebaseWeatherConfig);
var db = dbInstance.firestore();

/*
 *  CREATE
 */
weatherApp.post('/:location', [

    function(req, res, next) {

        var location = req.params.location;
        var body = req.body;

        let locationObj = locationArray.find(o => o.location === location);

        const postData = async () => {

            try {

                var a = await weatherUtils.weatherAPIPromiseAll(locationObj, body);
                return a;

            } catch (err) {
                console.log('err in post',err);
            }
        };

        postData()
            .then((weatherData) => {



                var currentRef = db.collection(weatherData.location+'Weather');
                currentRef.add(weatherData)
                    .then(ref => {
                        if (ref) {
                            // console.log('ref good');
                            return res.sendStatus(200);
                        } else {
                            // console.log('ref error');
                            return res.sendStatus(500);
                        }
                    })
                    .catch((err) => {
                        console.log('currentRefPostData', err);
                        return res.sendStatus(500);
                    });
            })
            .catch((err) => {
                console.log('postDataCatch', err);
                return res.sendStatus(500);
            });
    }
]);

weatherApp.post('/lightning/:location', [
    function(req,res,next) {
        var body = req.body;
        var location = req.params.location;
        // console.log(body);

        tobytweeter.sendTweet(body);

        var currentRef = db.collection(location+"lightning");

        currentRef.add(body)
            .then(ref => {
                if (!res.error) {
                    return res.sendStatus(200);
                } else {
                    return res.sendStatus(500);
                }
            });

    }
]);

/*
 *  CREATE
 */
weatherApp.post('/wait/times', [

    function(req, res, next) {


        var body = req.body;

        var currentRef = db.collection('pharmacyWaitTimes');

        currentRef.add(body)
            .then(ref => {
                if (!res.error) {
                    return res.sendStatus(200);
                } else {
                    return res.sendStatus(500);
                }
            });

    }
]);

/*
 * Get last specified count for specific location - pass 1 to get the latest
 */
weatherApp.get('/:location', function(req, res, next) {

    var location = req.params.location;

    var arrayToReturn = [];

    var currentRefRef;
    if (location === 'pharmacyWaitTimes') {
        currentRefRef = location;
        console.log(currentRefRef);
    } else {
        currentRefRef = location + 'Weather';
    }

    var currentRef = db.collection(currentRefRef);
    var query = currentRef.orderBy('timestamp', 'desc').limit(1).get()
            .then(snapshot => {
                snapshot.forEach(doc => {
                    var data = doc.data();
                    data.timestamp = moment(data.timestamp).format('MMMM Do YYYY, HH:mm');
                    arrayToReturn.push(data);
                });
                return res.send(arrayToReturn);
            })
            .catch(err => {
                console.log('Error getting documents', err);
                return res.sendStatus(500);
            });





});


// "pharmacyData": [
//             {
//                 "avgVisitTime": "Unable to Calculate",
//                 "intakeWaitTime": 18,
//                 "numIntakePatients": 0,
//                 "numProcessingPatients": 0,
//                 "processingWaitTime": 0,
//                 "site": "NBHC Albany Pharmacy",
//                 "timeStamp": "Closed"
//             },
//             {
//                 "avgVisitTime": "5 mins",
//                 "intakeWaitTime": 0,
//                 "numIntakePatients": 0,
//                 "numProcessingPatients": 0,
//                 "processingWaitTime": 0,
//                 "site": "NH Jacksonville Satellite Pharmacy",
//                 "timeStamp": "Closed"
//             },




function CreateChartData(type,data) {

    var arrayToReturn = [];

    if (type === "weather"){
        data.forEach(doc => {
            var item = doc.data();
            var obj = {};

            obj['wbgt'] = item.wbgt;
            obj['tempF'] = item.tempF;
            obj['humidity'] = item.humidity;
            obj['winds'] = item.winds;
            obj['timestamp'] = moment(item.timestamp).format('M/D/YY, HH:mm');
            obj['y-axis'] = 120;
            arrayToReturn.push(obj);
        });
    } else if (type === "pharmacy")  {
        console.log('inside else if')
        var pharmData = data.pharmacyData;
        log(pharmacyData)

        pharmData.forEach(doc => {
            var item = doc.data();
            console.log(item);

            var obj = {};

            obj.nhjax = _.findWhere(item, {'site': 'NH Jacksonville Pharmacy'}).avgVisitTime;
            obj.albany = _.findWhere(item, {'site': 'NBHC Albany Pharmacy'}).avgVisitTime;
            obj.mayport = _.findWhere(item, {'site': 'NBHC Mayport Pharmacy'}).avgVisitTime;
            obj.kings_bay = _.findWhere(item, {'site': 'NBHC Kings Bay Pharmacy'}).avgVisitTime;
            obj.nhjax_sat = _.findWhere(item, {'site': 'NH Jacksonville Satellite Pharmacy'}).avgVisitTime;
            

            
            obj['timestamp'] = moment(item.timestamp).format('M/D/YY, HH:mm');
            obj['y-axis'] = 120;
            arrayToReturn.push(obj);
        });
    }
    //log(type)
    //log(data)

    // data.forEach(doc => {
    //     var item = doc.data();

    //     item['timestamp'] = moment(item.timestamp).format('M/D/YY, HH:mm');
    //     item['y-axis'] = 120;
    //     arrayToReturn.push(item);
    // });


    return arrayToReturn.reverse();
}

/*
 * Get ALL for specific location
 */
weatherApp.get('/:location/getAll', function(req, res, next) {
    var location = req.params.location;
    var arrayToReturn = [];
    
    //Added for getting pharm wait times data
    var currentRefRef;
    var chartType = "";
    if (location === 'pharmacyWaitTimes') {
        currentRefRef = location;
        chartType = "pharmacy";
    } else {
        currentRefRef = location + 'Weather';
        chartType = "weather";
    }
    var currentRef = db.collection(currentRefRef);


   //var currentRef = db.collection(location + 'Weather');
    var query = currentRef.orderBy('timestamp', 'desc').limit(20).get()
        .then(snapshot => {
            arrayToReturn = CreateChartData(chartType, snapshot);
            return res.send(arrayToReturn);
        })
        .catch(err => {
            return res.send(500);
            console.log('Error getting documents', err);
        });


});

/*
 * Get last specified count for specific location - pass 1 to get the latest
 */
weatherApp.get('/:location/getLast/:count', function(req, res, next) {


    var location = req.params.location;
    var numberToGet = Number(req.params.count);

    var arrayToReturn = [];

    var currentRef = db.collection(location + 'Weather');
    var query = currentRef.orderBy('timestamp', 'desc').limit(numberToGet).get()
        .then(snapshot => {
            arrayToReturn = CreateChartData(snapshot);
            return res.send(arrayToReturn);
        })
        .catch(err => {
            return res.send(500);
            console.log('Error getting documents', err);
        });


});

/*
 * Get a date range readings for specific location
 */
weatherApp.get('/:location/getSpecifiedRange', function(req, res, next) {


    var location = req.params.location;
    var fromDate = req.body.fromDate;
    var toDate = req.body.toDate;

    var arrayToReturn = [];

    var currentRef = db.collection(location + 'Weather');
    var query = currentRef.where("timestamp", ">=", fromDate).where("timestamp", "<=", toDate).orderBy("timestamp", "desc").get()
        .then(snapshot => {
            arrayToReturn = CreateChartData(snapshot);
            return res.send(arrayToReturn);
        })
        .catch(err => {
            return res.send(500);
            console.log('Error getting documents', err);
        });

});

/*
 * Get a date range readings for specific location
 */
weatherApp.get('/:location/getRangeFromNow', function(req, res, next) {

    var location = req.params.location;

    var m = moment().format();
    var range = moment().subtract(req.body.amount, req.body.timePeriod).format();

    var arrayToReturn = [];

    var currentRef = db.collection(location + 'Weather');
    var query = currentRef.where("timestamp", ">=", range).where("timestamp", "<=", m).orderBy("timestamp", "desc").get()
        .then(snapshot => {
            arrayToReturn = CreateChartData(snapshot);
            return res.send(arrayToReturn);
        })
        .catch(err => {
            return res.send(500);
            console.log('Error getting documents', err);
        });


});



/*
 * Get a date range readings for specific location
 */
weatherApp.delete('/:location', function(req, res, next) {

    var location = req.params.location;

    var m = moment().format();
    var range = moment().subtract(req.body.amount, req.body.timePeriod).format();

    var arrayToReturn = [];

    var currentRef = db.collection(location + 'Weather');
    var query = currentRef.where("timestamp", "<=", range).get()
        .then(snapshot => {
            snapshot.forEach(doc => {
                var data = doc.ref.delete();
            });
            return res.send(200);
        })
        .catch(err => {
            return res.send(500);
            console.log('Error getting documents', err);
        });


});

module.exports = weatherApp;
