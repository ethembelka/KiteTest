/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const KiteTestError = require('../report/KiteTestError');
const Status = require('../report/Status');

/**
 * @class Instance
 * @description Instantiates a new Instance
 * @constructor Instance(jsonObject)
 * @param {JSON} jsonObject The json object
 */
class Instance {
  constructor(jsonObject) {
    let missingKey;
    try {
      missingKey = '_id';
      this.id = jsonObject['_id'];
      missingKey = 'ipAddress';
      this.ipAddress = jsonObject.ipAddress;
      missingKey = 'username';
      this.username = jsonObject.username;
      missingKey = 'keyFilePath';
      this.keyFilePath = jsonObject.keyFilePath;
      missingKey = 'type';
      this.type = jsonObject.type;
      missingKey = 'nit0';
      this.nit0 = jsonObject.nit0;
      missingKey = 'nit1';
      this.nit1 = jsonObject.nit1;
      missingKey = 'nit2';
      this.nit2 = jsonObject.nit2;
    } catch (e) {
      throw new KiteTestError(Status.BROKEN, "Error in json config instrumentation, the key " + missingKey + " is missing.");
    }
    this.name = jsonObject.name ? jsonObject.name : this.id;
    this.password = jsonObject.password ? jsonObject.password : null;
  }

  /**
   * Gets id
   * @returns {String} The id
   */
  getId() {
    return this.id;
  }

  /**
   * Gets name
   * @returns {String} The name
   */
  getName() {
    return this.name;
  }

  /**
   * Gets username
   * @returns {String} The username
   */
  getUsername() {
    return this.username;
  }

  /**
   * Gets ip address
   * @returns {String} The ip address
   */
  getIpAddress() {
    return this.ipAddress;
  }

  /**
   * Gets key file path
   * @returns {String} The key file path
   */
  getKeyFilePath() {
    return this.keyFilePath;
  }

  /**
   * Gets type
   * @returns {String} The type
   */
  getType() {
    return this.type;
  }

  /**
   * Gets password
   * @returns {String} The password
   */
  getPassword() {
    return this.password;
  }

  /**
   * Gets nit0
   * @returns {String} The nit0
   */
  getNit0() {
    return this.nit0;
  }

  /**
   * Gets nit1
   * @returns {String} The nit1
   */
  getNit1() {
    return this.nit1;
  }

  /**
   * Gets nit2
   * @returns {String} The nit2
   */
  getNit2() {
    return this.nit2;
  }
}

module.exports = Instance;
