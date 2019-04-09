'use strict';

var path = require('path');
var fs = require('fs');
var winston = require('winston');
var moment = require('moment');
var _ = require('underscore');


var logId = 0;
var appLogger;
var loggingConfig = {};

// Module initialization method
function initialize(config) {
    loggingConfig = config;

    // if file logging and console logging are both turned off, turn on console logging
    if (loggingConfig.file === false && loggingConfig.console === false) {
        loggingConfig.console = true;
    }

    var logPathError = false;
    var logDir = path.dirname(loggingConfig.file);

    if (loggingConfig.file && !fs.existsSync(logDir)) {
        logPathError = true;
        loggingConfig.file = false;
        loggingConfig.console = true;
    }
    appLogger = new CustomLogger(loggingConfig, appLogFormatter);

    if (logPathError) {
        appLogger.error('LOG DIRECTORY ' + logDir + ' DOES NOT EXIST - LOGGING TO CONSOLE ONLY!');
    }
}

// CustomLogger type that can log to console and/or a file, with configurable log level
// and a custom log formatter.
function CustomLogger(options, formatter) {
    this.getLogger = function () {
        return this.logger;
    };
    this.wrapFormatter = function (formatter) {
        var self = this;
        return function (options) {
            options.logId = self.logId;
            options.startTime = self.startTime;
            options.formattedLevel = '[' + options.level.toUpperCase() + '] ' + '     '.substring(options.level.length);
            return formatter(options);
        };
    };
    this.logId = logId++;
    this.startTime = moment();

    var logTransports = [];
    if (_.isString(options.file)) {
        logTransports.push(new winston.transports.File({
            filename: options.file,
            level: options.level,
            json: false,
            formatter: this.wrapFormatter(formatter)
        }));
    }
    if (options.console) {
        logTransports.push(new winston.transports.Console({
            level: options.level,
            json: false,
            formatter: this.wrapFormatter(formatter)
        }));
    }
    this.logger = new winston.createLogger({
        transports: logTransports
    });
    return this.logger;
}

// Log formatter for the main app logger
function appLogFormatter(options) {
    // Return string will be passed to logger.
    return options.formattedLevel + ' [' + moment().format('YYYY-MM-DD HH:mm:ss.SSS') + '] -- ' + options.message;
}

// Log formatter for the request loggers
function requestLogFormatter(options) {
    // Return string will be passed to logger.
    var now = moment();
    var elapsed = moment(now.diff(options.startTime));
    return options.formattedLevel + ' - ' + options.logId + ' - [' + now.format('YYYY-MM-DD HH:mm:ss.SSS') + ' -- elapsed: ' + elapsed.format('mm:ss.SSS') + ']: ' + options.message;
}

// Creates and returns a request logger
function createRequestLogger() {
    return new CustomLogger(loggingConfig, requestLogFormatter);
}

// Returns the main app logger
function getAppLogger() {
    return appLogger;
}

module.exports.initialize = initialize;
module.exports.getRequestLogger = createRequestLogger;
module.exports.getAppLogger = getAppLogger;