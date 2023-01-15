/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const {TestUtils, TestStep} = require('kite-common');

/**
 * @class ScreenshotStep
 * @extends TestStep
 * @description 
 * @constructor ScreenshotStep(kiteBaseTest)
 * @param {Objet} kiteBaseTest
 */
class ScreenshotStep extends TestStep {
  constructor(kiteBaseTest) {
    super();
    this.driver = kiteBaseTest.driver;

    // Test reporter if you want to add attachment(s)
    this.testReporter = kiteBaseTest.reporter;
  }

  /**
   * Returns the step description
   * @returns {String} The description
   */
  stepDescription() {
    return 'Get a screenshot';
  }

  /**
   * Contains all the actions to take a screenshot
   */
  async step() {
    let screenshot = await TestUtils.takeScreenshot(this.driver);
    this.testReporter.screenshotAttachment(this.report, "Screenshot step", screenshot); 
  }
}

module.exports = ScreenshotStep;