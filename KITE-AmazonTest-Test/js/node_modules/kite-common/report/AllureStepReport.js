/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const Entity = require('./Entity');
const Status = require('./Status'); 
const Parameter = require('./Parameter');

/**
 * @class AllureStepReport
 * @extends Entity
 * @description Create a step report to generate the allure report
 * @constructor AllureStepReport(name)
 * @param {String} name Name / Description of the step
 */
class AllureStepReport extends Entity {
  constructor(name) {
    super(name);
    this.parameters = [];
    this.attachments = [];
    this.steps = [];
    this.status = Status.PASSED;
    this.ignore = false;
  }

  /**
   * Sets the description
   * @param {String} description Description of the step
   */
  setDescription(description) {
    this.description = description;
  }

  /**
   * Sets the status
   * @param {Status} status 
   */
  setStatus(status) {
    this.ignore = (status === Status.SKIPPED);
    this.status = status;
    this.setStopTimestamp();
  }

  /**
   * Adds a step report
   * @param {Object} stepReport The report to be added
   */
  addStepReport(stepReport) {
    this.steps.push(stepReport);
    this.ignore = stepReport.ignore;
    if (this.status === Status.PASSED && !(stepReport.status === Status.SKIPPED)) {
      this.status = stepReport.status;
    } else {
      if (stepReport.status === Status.PASSED) {
        this.status = stepReport.status;
      }
    }
  }

  /**
   * Adds an attachment
   * @param {*} attachment Attachment to be added
   */
  addAttachment(attachment) {
    this.attachments.push(attachment);
  }

  /**
   * Adds a parameter
   * @param {String} name Parameter name
   * @param value Parameter value
   */
  addParameter(name, value) { 
    this.parameters.push(new Parameter(name, value));
  }

  /**
   * Sets the ignore variable / Default: false
   * @param {Boolean} ignore 
   */
  setIgnore(ignore) {
    this.ignore = ignore;
  }

  /**
   * Returns the value of the ignore variable
   * @returns {Boolean} 
   */
  canBeIgnore() {
    return this.ignore;
  }

  /**
   * Sets the details
   * @param {Object} details
   */
  setDetail(details) {
    this.details = details;
  }

  /**
   * Gets the actual status
   * @returns The actual status
   */
  getActualStatus() {
    for(let i = 0; i < this.steps.length; i++){
      let temp = this.steps[i].status;
      if (temp === Status.FAILED || temp === Status.BROKEN) {
        return temp;
      }
    }
    return this.status;
  }

  /**
   * Returns the json object corresponding to the report
   * @returns {JSON} 
   */
  getJsonBuilder() {
    this.status = this.getActualStatus();
    var builder = super.getJsonBuilder();
    builder['description'] = this.description;
    builder['stage'] = this.stage;
    builder['status'] = this.status;
    builder['parameters'] = this.parameters;
    builder['steps'] = this.steps;

    let attArray = [];
    for(let i = 0; i < this.attachments.length; i++) {
      attArray.push(this.attachments[i].getJsonBuilder());
    }
    builder['attachments'] = attArray;

    if (typeof this.details === "undefined") {
      builder['statusDetails'] = this.details;
    }

    return builder;
  }
}

module.exports = AllureStepReport;