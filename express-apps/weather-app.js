'use strict';
//TODO: PLACE FILES ON SERVER AND UPDATE THE CONFIG POINTER

var _ = require('underscore');
var fs = require('fs');
var express = require('express');
var appUtil = require('../util/app-util');
var moment = require('moment');
var RequestError = require('../util/request-error');
var request = require('request');
var firebaseWeather = require("firebase");
var firebaseWeatherConfig = JSON.parse(fs.readFileSync('/Users/alexrangeo/Development/nmrtcjax-firebase-config.json','utf8'));
var locationArray = require('../config/location-config').data;

/* 
Require util files
*/
var weatherUtils = require('../util/weather-util');

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
                console.log(err);
            }
        };

        postData()
            .then((weatherData) => {

                var currentRef = db.collection('jaxWeather');
                currentRef.add(weatherData)
                    .then(ref => {
                        console.log("this is the ref", ref);
                        if (ref) {
                            return res.sendStatus(200);
                        } else {
                            return res.sendStatus(500);
                        }
                    })
                    .catch((error) => {
                        return res.sendStatus(500);
                    });
            })
            .catch((error) => {
                return res.sendStatus(500);
            });
    }
]);

/*
 *  CREATE
 */
weatherApp.post('/wait/times', [

    function(req, res, next) {


        var body = req.body;
        console.log('body');

        var currentRef = db.collection('waittimes');

        currentRef.add(body)
            .then(ref => {
                if (!res.error) {
                    return res.sendStatus(200);
                } else {
                    return res.send(500);
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

    if (location === 'pharmacyWaitTimes') {
        var currentRef = db.collection(location);
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
                return res.send(500);
                console.log('Error getting documents', err);
            });

    }


    var currentRef = db.collection(location + 'Weather');
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
            return res.send(500);
            console.log('Error getting documents', err);
        });


});

function CreateChartData(data) {

    var arrayToReturn = [];

    data.forEach(doc => {
        var item = doc.data();

        item['timestamp'] = moment(item.timestamp).format('MM/DD/YY, HH:mm');
        item['y-axis'] = 120;
        arrayToReturn.push(item);
    });


    return arrayToReturn.reverse();
}

/*
 * Get ALL for specific location
 */
weatherApp.get('/:location/getAll', function(req, res, next) {


    var location = req.params.location;

    var arrayToReturn = [];

    var currentRef = db.collection(location + 'Weather');
    var query = currentRef.orderBy('timestamp', 'desc').limit(20).get()
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