/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

/**
 * @class Parameter
 * @description Creates a parameter with a name and a value
 * @constructor Parameter(name, value)
 * @param {String} name Parameter name
 * @param {Object} value Parameter value
 */
class Parameter {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  /**
   * Returns a string containing the entire contexte
   * @returns {String}
   */
  toJson() {
    return JSON.stringify(this);
  }
}

module.exports = Parameter;