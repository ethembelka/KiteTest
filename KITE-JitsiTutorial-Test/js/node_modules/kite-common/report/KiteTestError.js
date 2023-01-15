/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

/**
 * @class KiteTestError
 * @extends Error
 * @description Create an error with a status: failed | broken
 * @constructor KiteTestError(status, ...params)
 * @param {String} status Test status at the time of the error: failed | broken
 */
class KiteTestError extends Error{
  constructor(status, ...params) {
    super(...params);

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, KiteTestError);
    }
    this.name = 'KiteTestError';
    this.status = status;
  }
}

module.exports = KiteTestError;