/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const firefox = require('selenium-webdriver/firefox');
const {KiteTestError, Status} = require("../report");
const XMLHttpRequest = require('xmlhttprequest').XMLHttpRequest;
/**
 * Gets firefox options to perform tests
 * @param {Object} capabilities 
 * @returns {Object} Firefox options
 */
const getFirefoxOptions = function(capabilities) {
  let firefoxOptions;
  let kiteHome = process.env.KITE_HOME;
  let profile = "";
  if(typeof kiteHome !== "undefined") {
    let path = kiteHome.split("\\").join('/');
    profile = path + "/third_party/";
    switch(capabilities.platform.toUpperCase()) {
      case "WINDOWS": {
        profile += "firefox-h264-profiles/windows";
        break;
      }
      case "MAC": {
        profile += "firefox-h264-profiles/mac";
        break;
      }
      case "LINUX": {
        profile += "firefox-h264-profiles/linux";
        break;
      }
    }
    firefoxOptions = new firefox.Options().setProfile(profile);
  } else {
    console.log("FIREFOX: Some tests require specific profile for firefox to work properly.");
    firefoxOptions = new firefox.Options();
  }
  firefoxOptions.setPreference("media.navigator.permission.disabled", true);
  if (capabilities.useFakeMedia) {
    if (typeof capabilities.audio === "undefined" && typeof capabilities.video === "undefined") {
      firefoxOptions.setPreference("media.navigator.streams.fake", true);
    }
  }
  if (capabilities.headless) {
    firefoxOptions.addArguments("-headless");
  }
  // Todo : windowSize : firefoxOptions.windowSize is only working with headless mode
  if (capabilities.windowSize) {
    // firefoxOptions.
  } 
  if (capabilities.flags) {
    for (let flag in capabilities.flags) {
      firefoxOptions.addArguments(capabilities.flags[flag]);
    }
  }
  return firefoxOptions;
}

/**
 * Gets chrome options to perform tests
 * @param {Object} capabilities 
 * @returns {Object} Chrome options
 */
const getChromeOptions = function(capabilities) {
  let chromeOptions = {};
  if (capabilities.useFakeMedia) {
    chromeOptions['args'] = ['--use-fake-device-for-media-stream', '--use-fake-ui-for-media-stream'];
    if (capabilities.video && capabilities.audio) {
      if (capabilities.video) {
        chromeOptions['args'].push('use-file-for-fake-video-capture=' + fetchMediaPath(capabilities.video, capabilities.browserName));
      }
      if (capabilities.audio) {
        chromeOptions['args'].push('use-file-for-fake-audio-capture=' + fetchMediaPath(capabilities.audio, capabilities.browserName));
      }
    }
  }

  if (capabilities.headless) {
    chromeOptions['args'].push('--headless');
  }
  if (capabilities.windowSize) {
    chromeOptions['args'].push("window-size=" + capabilities.windowSize);
  }
  if (capabilities.flags) {
    for(let flag in capabilities.flags) {
      chromeOptions['args'].push(capabilities.flags[flag]);
    }
  }
  return chromeOptions;
}

const fetchMediaPath = function(media, browserName) {
  let extension;
  if (media.type === 'Video') {
    if (browserName === 'chrome') {
      extension = '.y4m';
    } else {
      extension = '.mp4';
    }
  } else {
    extension = '.wav';
  }
  return media.directory + media.filename + extension;
}

const makeRequest = async function(method, url) {
  return new Promise(function (resolve, reject) {
    let request = new XMLHttpRequest();
    request.open(method, url, true);
    request.onload = function() {
      if (request.status >= 200 && request.status < 400) {
        console.log("SUCCEEDED");
        console.log(this.response);
        resolve(request.response);
      } else {
        reject({
          status: this.status
        });
      }
    }
    request.send();
  });
}



module.exports = {
  /**
   * Gets options according to the capabilities
   * @param {Object} capabilities 
   * @returns {Object} Browser options
   */
  getOptions: function(capabilities) {
    switch(capabilities.browserName) {
      case 'chrome': {
        return getChromeOptions(capabilities);
      }
      case 'firefox': {
        return getFirefoxOptions(capabilities);
      }
      default:
        //todo
        return null;
    }
  },

  makeCommand: async function(gridId, nodeIp, command) {
    console.log(gridId + " GRID ID");
    console.log(nodeIp + " Node IP");
    console.log(command + " command");
    let url = "http://localhost:8080/KITEServer" + "/command?id=" + gridId + "&ip=" + nodeIp + "&cmd=" + command;
    try {
      await makeRequest("GET", url);
    } catch (e) {
      console.log(e);
    }
  },

  getPublicIp: async function(driverContext) {
    let driver = driverContext.driver;
    let publicIpURL = "http://bot.whatismyipaddress.com";
    await driver.get(publicIpURL);
    let pageSource = await driver.getPageSource();
    driverContext.driver = driver;
    try {
      return pageSource.split("<body>")[1].split("</body>")[0];
    } catch (e) {
      throw new KiteTestError(Status.BROKEN, "Could not get public IP for webdriver session: " + driver.getSession());
    }
  },

  fetchMediaPath,
}