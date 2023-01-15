/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

// ATM: Useless

const Entity = require('./Entity');

/**
 * @class Container
 * @extends Entity
 * @description  Create a container
 * @constructor Container(name)
 * @param {String} name Container name
 */
class Container extends Entity {
  constructor(name) {
    super(name);
    this.childrenId = [];
    this.befores = [];
    this.afters = []; 
    this.setStartTimestamp();
  }

  /**
   * Adds a child
   * @param {Number} childId Child id
   */
  addChild(childId) {
    this.childrenId.push(childId);
  }

  /**
   * Adds a step before
   * @param {Object} stepReport Report to add before
   */
  addBeforeStep(stepReport) {
    this.befores.push(stepReport);
  }

  /**
   * Adds a step after
   * @param {Object} stepReport Report to add after
   */
  addAfterStep(stepReport) {
    this.afters.push(stepReport);
  }

  /**
   * Returns the json object corresponding to the container
   * @returns {JSON}
   */
  getJsonBuilder() {
    let builder = super.getJsonBuilder();
    builder['start'] = this.start;
    builder['stop'] = this.stop;
    builder['uuid'] = this.uuid;
    builder['children'] = this.childrenId;
    builder['befores'] = this.befores;
    builder['afters'] = this.afters;
    return builder;
  }
}


module.exports = Container;
