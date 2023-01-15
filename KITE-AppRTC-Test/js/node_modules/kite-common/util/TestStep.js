/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const {AllureStepReport, KiteTestError, Status, StatusDetails} = require('../report');

/**
 * @class TestStep
 * @description Allows to manage the different steps and reports
 * @constructor TestStep()
 */
class TestStep {
  constructor() { 
    this.init();
  }

  /**
   * Returns the step description
   * @abstract function that must be implemented
   * @returns {String} The description
   */
  stepDescription() {
    throw new Error('You must implement this function');
  }

  /**
   * Executes the step and manages the report
   * @param {*} KiteBaseTest 
   */
  async execute(KiteBaseTest) {
    try {
      if(KiteBaseTest.report.status == Status.PASSED) {
        console.log('Executing step: ' + this.stepDescription());
        await this.step(KiteBaseTest);

      } else {
        this.skip();
      }
    } catch (error) {
      let statusDetails = new StatusDetails();
      if(error instanceof KiteTestError) {
        statusDetails.setKnown(true);
        console.log(error.message);
        KiteBaseTest.report.status = error.status;
      } else {
        statusDetails.setFlaky(true);
        console.log(error);
        KiteBaseTest.report.status = Status.BROKEN;
      }
      statusDetails.setMessage(error.message);
      this.report.setStatus(KiteBaseTest.report.status);
      this.report.details = statusDetails;
    } finally {
      await this.finish();
      await KiteBaseTest.report.addStepReport(this.report.getJsonBuilder()); 
    }
  }

  /**
   * Indicates that the step has been skipped and set the report status at SKIPPED
   */
  skip() {
    console.log('Skipping step: ' + this.stepDescription());
    this.report.setStatus(Status.SKIPPED);
  }

  /**
   * Initializes the description and the step report
   */
  init() {
    this.report = new AllureStepReport("place holder");
  }

  /**
   * Updates the end date and the description of the report 
   */
  async finish() {
    let capabilities = await this.driver.getCapabilities();
    let browserName = "[" + capabilities.getBrowserName() + "] ";
    let description = browserName + this.stepDescription();
    this.report.setName(description);
    this.report.setDescription(description);
    this.report.setStopTimestamp();
  }
  
  /**
   * Contains all the actions of a step
   * @abstract function that must be implemented
   */
  async step() {
    throw new Error('You must implement this function');
  }
}

module.exports = TestStep;
