var mosca = require('mosca'); //MOSCA Imported
var mqtt = require('mqtt'); //MQTT Imported
var firebase = require("firebase"); //Load Firebase Package
var axios = require("axios");
var fs = require('fs');
var path = require('path');

const WORKING_DIR = path.resolve('../secret-config');

const API_CONFIG = JSON.parse(fs.readFileSync(path.join(WORKING_DIR, 'api-config.json')));
const WAIT_TIME_PARAM = "wait/times"

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"; // trust self signed certificate

var client = mqtt.connect('mqtt://localhost'); //IP of the machine which the server is hosted
var SECURE_KEY = path.join(WORKING_DIR, 'certs' + '/wxKey.pem'); //Location of secure key - path to key only, DO NOT READ THE KEY
var SECURE_CERT = path.join(WORKING_DIR, 'certs' + '/wxCert.pem'); //Location of Secure Cert - path to key only, DO NOT READ THE CERT

var settings = { //Server settings
    port: 1883
    // ,
    // secure: {
    //     port: 8883, //Secure MQTT port
    //     keyPath: SECURE_KEY,
    //     certPath: SECURE_CERT,
    //     allowNonSecure: true //Denies Nonsecure Connections
    // }
};
//Server Setup
var server = new mosca.Server(settings);

var readyFunc = function() {
    console.log('inside ready');
    server.on('clientConnected', clientConnectedFunc);
    server.on('published', publishedFunc);

};
var clientConnectedFunc = function(client) {
    console.log('inside client connected');
};
var publishedFunc = function(packet, client) {
    console.log('inside published');

    if (client) {
        let buf = (Buffer.from(packet.payload)); //Buffer is dumped from packet

        let msg = buf.toString(); //Buffer is converted to string
        msg = JSON.parse(msg);

        console.log("Message from MQTT ", msg);
        let headers = {
            'NHJax-API-Key': API_CONFIG["NHJax-API-Key"]
        };
        console.log(msg.location);

        //console.log(msg);
        // console.log(JSON.stringify(msg));
        // console.log(JSON.parse(msg));

        let data = {
            "location": msg.location,
            "temperature": Number(msg.temp),
            "humidity": Number(msg.hum)
        }

        console.log('data', data);

        axios({
                method: "post",
                url: API_CONFIG.BASEURL + msg.location,
                headers,
                data
            })
            .then(res => {
                console.log('res');
            })
            .catch(err => {
                console.log('err', err);
            })
        client.close();
    };



};
server.on('ready', readyFunc);
