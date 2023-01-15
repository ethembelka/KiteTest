/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const CustomAttachment = require('./CustomAttachment');
const {TestUtils} = require('kite-common');

/**
 * @class Reporter
 * @description Adds attachments to reports
 * @constructor Reporter(reportPath)
 * @param {String} reportPath Path of the report
 */
class Reporter {
  constructor(reportPath) {
    this.reportPath = reportPath; 
    this.containers = []; 
    this.tests = []; 
    this.attachments = [];
  }

  /**
   * Adds a JSON attachment
   * @param {Object} stepReport Report in which we want to add an attachment
   * @param {String} name Attachment name
   * @param {JSON} jsonObject JSON object to be added
   */
  jsonAttachment(stepReport, name, jsonObject) {
    let value = JSON.stringify(jsonObject);
    let attachment = new CustomAttachment(name, "text/json", "json");
    attachment.setText(value);
    this.addAttachment(stepReport, attachment);
  }

  /**
   * Adds a text attachment
   * @param {Object} stepReport Report in which we want to add an attachment
   * @param {String} name Attachment name
   * @param {String} value Attachment value
   * @param {String} type Attachment type
   */
  textAttachment(stepReport, name, value, type) {
    let attachment = new CustomAttachment(name, "text/" + type, type);
    attachment.setText(value);
    this.addAttachment(stepReport, attachment);
  }

  // TODO
  // saveAttachmentToSubFolder() {}

  /**
   * Adds a screenshot attachment
   * @param {Object} stepReport Report in which we want to add an attachment
   * @param {String} name Attachment name
   * @param {Object} screenshot Screenshot to be added
   */
  screenshotAttachment(stepReport, name, screenshot) {
    let attachment = new CustomAttachment(name, "image/png", "png");
    attachment.setScreenshot(screenshot);
    this.addAttachment(stepReport, attachment);
  }

  /**
   * Adds an attachment
   * @param {*} stepReport Report in which we want to add an attachment
   * @param {*} attachment Attachment to be added
   */
  addAttachment(stepReport, attachment) {
    this.attachments.push(attachment);
    stepReport.addAttachment(attachment);
  }

  /**
   * Adds a container
   * @param {Object} container Container to be added
   */
  addContainer(container) {
    this.containers.push(container);
  }

  /**
   * Adds a test
   * @param {Object} test Test to be added 
   */
  addTest(test) {
    this.tests.push(test);
  }

  /**
   * Updates containers and write them in a file located in the path
   */
  updateContainers() {
    for(let i = 0; i < this.containers.length; i++) {

      let fileName = this.reportPath + '/' + this.containers[i].getUuid() + "-container.json";
      TestUtils.writeToFile(fileName, this.containers[i].text);
    }
  }

  /**
   * Generate all files corresponding to the attachments of the report
   */
  generateReportFiles() {
    this.updateContainers(this.reportPath);

    
    for(let i = 0; i < this.tests.length; i++) {
      let fileName = this.reportPath + '/' + this.tests[i].getUuid() + "-result.json";
      TestUtils.writeToFile(fileName, this.tests[i].text);
    }

    for(let i = 0; i < this.attachments.length; i++) {
      this.attachments[i].saveToFile(this.reportPath);
    }
  }
}

module.exports = Reporter;