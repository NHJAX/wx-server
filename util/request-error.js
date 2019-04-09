'use strict';

function RequestError(message, status) {
    this.message = message;
    this.status = status;
}
RequestError.prototype = Object.create(Error.prototype);
RequestError.prototype.constructor = RequestError;

module.exports = RequestError;