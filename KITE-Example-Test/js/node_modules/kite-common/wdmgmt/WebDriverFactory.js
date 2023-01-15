/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const WebDriverUtils = require('./WebDriverUtility.js');
const {Builder} = require('selenium-webdriver');

/**
 * Gets the system platform
 * @return {String} The system platform
 */
const getSystemPlatform = function() {
  let platform = process.platform.toLocaleUpperCase();
  if (platform.includes('WIN')) {
    return 'WINDOWS';
  }
  if (platform.includes('MAC') || platform.includes('DARWIN')) {
    return 'MAC';
  }
  if (platform.includes('NUX')) {
    return 'LINUX';
  }
  return platform;
}

/**
 * Creates the driver with the right options
 * @param {JSON} capabilities Desired capabilities
 * @param {String} remoteAddress The remote address
 * @return {Object} The driver
 */
const createWebDriver = async function(capabilities) {
  //to make sure the cap doesn't has anything weird:
  const cap = {};
  const browserSpecs =  capabilities.browserSpecs;
  cap.browserName = browserSpecs.browserName;
  cap.version = browserSpecs.version;
  cap.gateway = (capabilities.gateway && capabilities.gateway !== 'none') ? capabilities.gateway : null;
  if (browserSpecs.platform.toLocaleUpperCase() === 'LOCALHOST') {
    let systemName = getSystemPlatform();
    cap.platformName = systemName;
    cap.platform = systemName;
  } else {
    cap.platformName = browserSpecs.platformName;
    cap.platform = browserSpecs.platform;
  }

  const options = WebDriverUtils.getOptions(capabilities);
  switch (cap.browserName) {
    case 'chrome': {
      cap['goog:chromeOptions'] =  options;
      return new Builder()
        .forBrowser('chrome')
        .usingServer(capabilities.paas.url)
        .withCapabilities(cap)
        .build();
    }
    case 'firefox': {
      cap.acceptInsecureCerts = true;
      return new Builder()
        .forBrowser('firefox')
        .usingServer(capabilities.paas.url)
        .withCapabilities(cap)
        .setFirefoxOptions(options)
        .build();
    }
    default:
      throw new Error('Unsupported browser type: ' + browserName);
  }
}

const writeCommand = function(capabilities) {
  let command = "play%20";
  if (capabilities.video && capabilities.audio) {
    command += WebDriverUtils.fetchMediaPath(capabilities.video, capabilities.browserName)
      + "%20" + WebDriverUtils.fetchMediaPath(capabilities.audio, capabilities.browserName);
  } else if (capabilities.video && !capabilities.audio) {
    command += WebDriverUtils.fetchMediaPath(capabilities.video, capabilities.browserName);
  } else if (!capabilities.video && capabilities.audio) {
    command += WebDriverUtils.fetchMediaPath(capabilities.audio, capabilities.browserName);
  } else {
    console.log("No file provided");
  } 
  return command + "%20&";
} 

module.exports = {
  /**
   * Gets the driver with the right options
   * @param {JSON} capabilities Desired capabilities
   * @param {String} remoteAddress The remote address
   * @return {Object} The driver
   */
  getDriver: async function(capabilities, remoteAddress) {
    this.driver = await createWebDriver(capabilities, remoteAddress);
    if (capabilities.browserName === 'firefox') {
      if (capabilities.useFakeMedia) {
        if (capabilities.video || capabilities.audio) {
          let gridId = capabilities.gridId ? capabilities.gridId : 'null';
          let nodePublicIp = await WebDriverUtils.getPublicIp(this);
          let command = writeCommand(capabilities);
          await WebDriverUtils.makeCommand(gridId, nodePublicIp, command);
        }
      }
    }
    return this.driver;   
  }
}
