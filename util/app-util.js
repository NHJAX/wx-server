'use strict';

var _ = require('underscore');
var moment = require('moment');

var EMAIL_REGEX = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i;

function setResults(res, results) {
    console.log('app -util setResults');
    console.log(results);
    res.locals.results = results;
}

// Takes an error and converts it to an error message string. err can be (in order of preference):
//   1. an Error object
//   2. a string
//   3. an object with either a message or an error property that is a string
//   4. an object that can be stringified
// Returns a string form of the error
function getErrorString(err) {
    if (err instanceof Error) {
        return err.message;
    }
    if (_.isString(err)) {
        return err;
    }
    if (_.isObject(err)) {
        if (_.isString(err.message)) {
            return err.message;
        }
        if (_.isString(err.error)) {
            return err.error;
        }
        try {
            return JSON.stringify(err);
        } catch (err) {
            return '[error could not be stringified: ' + err.toString() + ']';
        }
    }
    return '';
}

function validateEmail(email) {
    return email !== null && email !== undefined && EMAIL_REGEX.test(email);
}

function xmlToJson(xml) {
    // Create the return object
    var obj = {};

    if (xml.nodeType === 1) { // element
        // do attributes
        if (xml.attributes.length > 0) {
            obj["@attributes"] = {};
            for (var j = 0; j < xml.attributes.length; j++) {
                var attribute = xml.attributes.item(j);
                obj["@attributes"][attribute.nodeName] = attribute.nodeValue;
            }
        }
    } else if (xml.nodeType === 3) { // text
        obj = xml.nodeValue;
    }

    // do children
    if (xml.hasChildNodes()) {
        for (var i = 0; i < xml.childNodes.length; i++) {
            var item = xml.childNodes.item(i);
            var nodeName = item.nodeName;
            if (typeof obj[nodeName] === "undefined") {
                obj[nodeName] = xmlToJson(item);
            } else {
                if (typeof obj[nodeName].push === "undefined") {
                    var old = obj[nodeName];
                    obj[nodeName] = [];
                    obj[nodeName].push(old);
                }
                obj[nodeName].push(xmlToJson(item));
            }
        }
    }

    return obj;
}
module.exports.setResults = setResults;
module.exports.getErrorString = getErrorString;
module.exports.validateEmail = validateEmail;
module.exports.xmlToJson = xmlToJson;