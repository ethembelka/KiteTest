/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const Stage = require('./Stage');
const generateUUID = require('./generate-uuid');

/**
 * @class Entity
 * @description Creates an entity
 * @constructor Entity(name)
 * @param {String} name Entity name
 */
class Entity {
  constructor(name) {
    this.name = name;
    this.stage = Stage.SCHEDULED;
    this.start = Date.now();
    this.uuid = generateUUID();
  }

  /**
   * Sets the name
   * @param {String} name Name of the step 
   */
  setName(name) {
    this.name = name;
  }

  /**
   * Sets the start timestamp and sets "stage" to RUNNING
   */
  setStartTimestamp() {
    this.start = Date.now();
    this.stage = Stage.RUNNING;
  }
  
  /**
   * Sets the start timestamp and sets "stage" to FINISHED
   */
  setStopTimestamp() {
    this.stop = Date.now();
    this.stage = Stage.FINISHED;
  }

  /**
   * Gets the uuid
   * @returns {String}
   */
  getUuid() { 
    return this.uuid;
  }

  /**
   * Gets the name
   * @returns {String}
   */
  getName() {
    return this.name;
  }

  /**
   * Returns the json object corresponding to the entity
   * @returns {JSON}
   */
  getJsonBuilder() {
    var builder = {};
    builder['name'] = this.name;
    builder['start'] = this.start;
    builder['stop'] = this.stop;  
    return builder;
  }
  
  /**
   * Returns a string containing the entire contexte
   * @returns {String}
   */
  toJson() {
    return JSON.stringify(this); 
  }
}

module.exports = Entity;