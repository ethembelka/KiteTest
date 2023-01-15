/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const AllureStepReport = require('./AllureStepReport');
const Parameter = require('./Parameter');
const generateUUID = require('./generate-uuid');

/**
 * @class AllureTestReport
 * @extends AllureStepReport
 * @description Create a step report to generate the allure report
 * @constructor AllureTestReport(name, uuid)   
 * @param {String} name Name / Description of the test
 * @param {String} uuid UUID of the test report
 */
class AllureTestReport extends AllureStepReport {
  constructor(name, uuid) {
    super(name);
    this.labels = [];
    this.links = [];
    this.uuid = uuid;
    this.historyId = generateUUID();
  }

  /**
   * Extracts a report
   * @param {Object} otherReport 
   */
  extract(otherReport) {
    this.labels = otherReport.labels;
    this.links = [];
    this.uuid = otherReport.uuid;
    this.historyId = generateUUID();
  }

  /**
   * Sets the full name
   * @param {String} fullName 
   */
  setFullName(fullName) {
    this.fullName = fullName;
  }

  /**
   * Adds a label
   * @param {String} name Label name
   * @param {Object} value Label value
   */
  addLabel(name, value) {
    this.labels.push(new Parameter(name, value));
  }

  /**
   * Adds a link
   * @param {Object} link Link to be added
   */
  addLink(link) {
    this.links.push(link);
  }

  /**
   * Returns the json object corresponding to the report
   * @returns {JSON}
   */
  getJsonBuilder() {
    let temp = super.getJsonBuilder();
    let builder = {};
    builder['status'] = temp['status'];
    builder['steps'] = temp['steps'];
    return builder;
  }
}

module.exports = AllureTestReport;