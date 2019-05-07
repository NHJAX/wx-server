var express = require('express');
var expressTimeout = require('connect-timeout');
var bodyParser = require('body-parser');
var _ = require('underscore');
var moment = require('moment');
var fs = require('fs');
var path = require('path');
var config = require('./config/config.json');
var appUtil = require('./util/app-util.js');
var logging = require('./util/logging.js');
var RequestError = require('./util/request-error');

//var KEY = fs.readFileSync(path.join(__dirname, '/tls-key.pem'))
//var CERT = fs.readFileSync(path.join(__dirname, '/tls-cert.pem'));
const WORKING_DIR = path.resolve('../secret-config');

const API_CONFIG = JSON.parse(fs.readFileSync(path.join(WORKING_DIR, 'api-config.json')));


var weatherApp = require('./express-apps/weather-app');

var GENERIC_ERROR = 'An unexpected error occurred';
var REQUEST_TIMEOUT = 30000; // 30 seconds
var SECRET_KEY = API_CONFIG["NHJax-API-Key"];

config.nhjax.app = _.defaults(config.nhjax.app || {}, {
    port: 3000,
    ssl: false
});
config.nhjax.app.logging = _.defaults(config.nhjax.app.logging || {}, {
    level: 'info',
    file: false,
    console: true
});





var app = express();
var port = 3000;
app.set('x-powered-by', false);
app.set('Content-Type', 'application/json');

app.use(express.static(path.join(__dirname, 'public')));


//Set up routing
var router = express.Router();
router.use('/weather', weatherApp);




// Init logging
logging.initialize(config.nhjax.app.logging);
var appLogger = logging.getAppLogger();

appLogger.info('--------------------------------');
appLogger.info('Starting up...');


//High-level functions
app.use('/NHJax-api', [

    function init(req, res, next) {
        //console.log("init");
        res.header('Access-Control-Allow-Origin', '*');
        res.header('Access-Control-Allow-Credentials', true);
        res.header('Access-Control-Allow-Methods', 'GET, POST, PUT', 'DELETE');
        res.header('Access-Control-Expose-Headers', 'Content-Length');
        res.header('Access-Control-Allow-Headers', 'Accept, Authorization, Content-Type, X-Requested-With, Range, NHJax-API-Key');
        req.parsedParams = {};
        req.logger = logging.getRequestLogger();
        req.logger.info(req.method + ' request received to ' + req.path);

        if (req.method === 'OPTIONS') {
            return res.status(200).send();
        }
        return next();
    },

    function validateApiKey(req, res, next) {
        //console.log('validate api key');

        if (req.method === 'OPTIONS') {
            return next();
        }

        var apiKey = req.header('NHJax-API-Key');

        if (apiKey !== SECRET_KEY) {
            return next(new RequestError('Missing or Invalid API Key'));

        }
        return next();
    },

    //3. Parse Request Body
    bodyParser.urlencoded({
        extended: true
    }),
    bodyParser.json(),


    //4. Handle Timeouts
    expressTimeout(REQUEST_TIMEOUT, {
        respond: true
    }),

    //5. Handle Requests
    router,

    //6. Send Response
    function sendResponse(req, res, next) {
        console.log('send response');
        if (req.timeout) {
            req.logger.info('request completed successfully after timeout - swalling response');
        } else {
            req.logger.info('building success response');
            var responseBody = buildResponse(null, res);
            req.logger.info('request completed');
            res.status(responseBody.status).send(responseBody);
        }
    }

]);

//{"__name__":"/databases/(default)/documents/locations/hospital","data":{"asdfas":"asdfsa"}}


app.use('/NHJax-api', function errorHandler(err, req, res, next) {
    //console.log(req.body);
    if (req.headersSent) {
        // The response was already sent
        // Probably the request timed out, and processing continued and resulted in an error
        req.logger.error('an error occurred after the response was sent. This is most likely due to a timeout: ' + JSON.stringify(err));
    } else {
        //req.logger.error('building error response - ' + JSON.stringify(err));
        if (req.timedout) {
            req.logger.warn('request timed out');
        } else if (!(err instanceof RequestError) && err.stack) {
            req.logger.error(GENERIC_ERROR + ': ' + err.stack);
            err = GENERIC_ERROR + ': ' + err.stack;
        }
        var responseBody = buildResponse(err, res);
        req.logger.info('error');
        res.status(responseBody.status).send(responseBody);
    }
});

app.listen(port, function() {
    appLogger.info('Listening on port ' + port);
});

function buildResponse(err, res) {
    console.log('build Response Function ', err);
    var error = appUtil.getErrorString(err);
    var result = res.locals.results;
    var status;
    var responseBody = {};

    // if there's no result set (not even an empty one) and no error, assume the URL was invalid
    if (!err && result === undefined) {
        status = 404;
        error = "Not Found";
    }

    if (error) {
        status = status || (err ? err.status : null) || 500;
        responseBody.error = { message: error };
    } else {
        status = 200;
        if (result.length !== undefined && !_.isString(result)) {
            responseBody.count = result.length;
        }
        responseBody.response = result;
    }
    responseBody.timestamp = moment().format('YYYYMMDDHHmmss');
    responseBody.status = status;

    return responseBody;
}