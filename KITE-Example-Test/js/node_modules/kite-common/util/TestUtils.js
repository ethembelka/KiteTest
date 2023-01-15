/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const fs = require('fs');
const {By} = require('selenium-webdriver');
const statsUtils = require('./statsUtils');
const {KiteTestError, Status} = require('../report');
const fetch = require('node-fetch');
const NetworkInstrumentation = require('../instrumentation/NetworkInstrumentation');

/**
 * Checks if the state the document is "complete"
 * @param {Object} driver 
 * @returns {Boolean} 
 */
const isDocumentReady = async function(driver) {
  const s = await driver.executeScript("return document.readyState");
  return s === "complete";
}

// SDP Message
/**
 * Gets the sdp message
 * @param {Object} driver 
 * @param {String} peerConnection The peer connection 
 * @param {String} type Type of sdp message
 * @returns {Object} The sdp object
 */
const getSDPMessage = async function(driver, peerConnection, type) {
  const sdpObj = await driver.executeScript(sdpMessageScript(peerConnection, type));
  await waitAround(1000);
  return sdpObj;
}

/**
 * Returns the script corresponding to the message type
 * @param {String} peerConnection The peer connection 
 * @param {String} type Type of sdp message
 * @returns {String} The sdp message script
 */
const sdpMessageScript = function(peerConnection, type) {
  switch (type) {
    case 'offer':
      return "var SDP;"
      + "try {SDP = " + peerConnection + ".remoteDescription;} catch (exception) {} "
      + "if (SDP) {return SDP;} else {return 'unknown';}";
    case "answer":
      return "var SDP;"
      + "try {SDP = " + peerConnection + ".localDescription;} catch (exception) {} "
      + "if (SDP) {return SDP;} else {return 'unknown';}";
    default: 
      throw new Error("Not a valid type for sdp message.");
  }
}

// Video
/**
 * Gets the script to get the sum of the pixels of a video with its id
 * @param {String} id Video id
 * @returns {String} The script to get the sum of the pixels of a video
 */
const getPixelSumsByIdScript = function(id) {
  return getSumFunctionScript + 'const canvas = document.createElement(\'canvas\');' 
  + "const id = document.getElementById('" + id + "');"
  + 'const ctx = canvas.getContext(\'2d\');' 
  + 'ctx.drawImage(id, 0, 0, id.videoHeight-1, id.videoWidth-1);' 
  + 'const imageData = ctx.getImageData(0, 0, id.videoHeight-1, id.videoWidth-1).data;' 
  + 'const sum = imageData.reduce(getSum);' 
  + 'if (sum===255*(Math.pow(id.videoHeight-1,(id.videoWidth-1)*(id.videoWidth-1)))) {'
  + '   return 0;' 
  + '}' 
  + 'return sum;';
}

/**
 * Gest the script to get the sum of the pixels of a video with its index
 * @param {Number} index Video index
 * @returns {String} The script to get the sum of the pixels of a video
 */
const getPixelSumByIndexScript = function(index) {
  return "function getSum(total, num) {    return total + num;};"
  + "var canvas = document.createElement('canvas');"
  + "var ctx = canvas.getContext('2d');"
  + "var videos = document.getElementsByTagName('video');"
  + "var video = videos[" + index + "];"
  + "if(video){ctx.drawImage(video,0,0,video.videoHeight-1,video.videoWidth-1);"
  + "var imageData = ctx.getImageData(0,0,video.videoHeight-1,video.videoWidth-1).data;var sum = imageData.reduce(getSum);"
  + "if (sum===255*(Math.pow(video.videoHeight-1,(video.videoWidth-1)*(video.videoWidth-1))))   return 0;"
  + "return sum;} else {return 0 }";
}

const getSumFunctionScript = 'function getSum(total, num) {return total + num;};';

// Stats
/**
 * Gets the script to get the statistics 
 * @param {statsType} statsType Type of statistics
 * @returns {String} The script to get the statistics
 */
const getStashedStat = function(statsType) {
  let jsQuery = "";
  switch (statsType) {
    case "kite":
      jsQuery = "return window.KITEStats;";
      break;
    case "local":
      jsQuery = "return window.LocalStats;";
      break;
    case "remote":
      jsQuery = "return window.RemoteStats;";
      break;
    case "jitsi":
      jsQuery = "return window.JitsiStats;";
      break;
    case 'mediasoup':
      jsQuery = "return window.MediasoupStats";

  }
  return jsQuery;
}

/**
 * Gets the script for getStats() according to the type of statistics
 * @param {String} statsType Type of statistics
 * @param {String} pc The peer connection 
 * @returns {String} The script to get the statistics
 */
const stashStat = function(statsType, pc) {
  let jsQuery = "";
  switch (statsType) {
    case "kite":
      jsQuery = "const getStatsValues = (pc) =>"
        + "    pc.getStats()"
        + "    .then(data => {"
        + "      return [...data.values()];"
        + "    });"
        + "const stashStats = async () => {"
        + "  window.KITEStats = await getStatsValues(" + pc + ");"
        + "  return window.KITEStats;"
        + "};"
        + "stashStats();";
      break;
    case "local":
      jsQuery = "const getLocalStatsValues = (pc) =>"
        + "  pc.getStats(function (res) {"
        + "            var items = [];"
        + "            res.result().forEach(function (result) {"
        + "                var item = {};"
        + "                result.names().forEach(function (name) {"
        + "                    item[name] = result.stat(name);"
        + "                });"
        + "                item.id = result.id;"
        + "                item.type = result.type;"
        + "                item.timestamp = result.timestamp.getTime().toString();"
        + "                items.push(item);"
        + "            });"
        + "            window.LocalStats = items;"
        + "        });"
        + "const stashLocalStats = async () => {"
        + "  await getLocalStatsValues(" + pc + ");"
        + "  return window.LocalStats;"
        + "};"
        + "stashLocalStats();";
      break;
    case "remote":
      jsQuery = "const getRemoteStatsValues = (i) =>"
        + "  remotePc[i].getStats(function (res) {"
        + "            var items = [];"
        + "            res.result().forEach(function (result) {"
        + "                var item = {};"
        + "                result.names().forEach(function (name) {"
        + "                    item[name] = result.stat(name);"
        + "                });"
        + "                item.id = result.id;"
        + "                item.type = result.type;"
        + "                item.timestamp = result.timestamp.getTime().toString();"
        + "                items.push(item);"
        + "            });"
        + "            if (!window.RemoteStats) window.RemoteStats = [items]; "
        + "            else window.RemoteStats.push(items);"
        + "        });"
        + "const stashRemoteStats = async () => {"
        + "  window.RemoteStats = [];"
        + "  for (i in remotePc) await getRemoteStatsValues(i);"
        + "  return window.RemoteStats;"
        + "};"
        + "stashRemoteStats();";
      break;
    case "jitsi":
      jsQuery = "const getJitsiStatsValues = (pc) =>"
        + "  pc.getStats(function (res) {"
        + "            var items = [];"
        + "            res.result().forEach(function (result) {"
        + "                var item = {};"
        + "                result.names().forEach(function (name) {"
        + "                    item[name] = result.stat(name);"
        + "                });"
        + "                item.id = result.id;"
        + "                item.type = result.type;"
        + "                item.timestamp = result.timestamp.getTime().toString();"
        + "                items.push(item);"
        + "            });"
        + "            if (!window.JitsiStats) window.JitsiStats = [items]; "
        + "            else window.JitsiStats.push(items);"
        + "        });"
        + "const stashJitsiStats = async () => {"
        + "  window.JitsiStats = [];"
        + "  await getJitsiStatsValues(" + pc +");"
        + "  return window.JitsiStats;"
        + "};"
        + "stashJitsiStats();";
      break;
      case "mediasoup":
        jsQuery = "const getMediasoupStatsValues = (pc) =>"
        + "  pc.getStats(function (res) {"
        + "            var items = [];"
        + "            res.result().forEach(function (result) {"
        + "                var item = {};"
        + "                result.names().forEach(function (name) {"
        + "                    item[name] = result.stat(name);"
        + "                });"
        + "                item.id = result.id;"
        + "                item.type = result.type;"
        + "                item.timestamp = result.timestamp.getTime().toString();"
        + "                items.push(item);"
        + "            });"
        + "            if (!window.MediasoupStats) window.MediasoupStats = [items]; "
        + "            else window.MediasoupStats.push(items);"
        + "        });"
        + "const stashMediasoupStats = async () => {"
        + "  window.MediasoupStats = [];"
        + "  await getMediasoupStatsValues(" + pc +");"
        + "  return window.MediasoupStats;"
        + "};"
        + "getMediasoupStatsValues();";
      break;
  }
  return jsQuery;
}

/**
 * Waits for elements with a class name
 * @param {Object} driver 
 * @param {String} className Class name of the elements to be waited for
 * @returns {Boolean}  
 */
const waitForElementsWithClassName = async function(driver, className) {
  const videoElements = await driver.findElements(By.className(className));
  return videoElements.length > 0;
};

/**
 * Waits for elements with an id
 * @param {Object} driver 
 * @param {Number} id Id of the elements to be waited for
 */
const waitForElementsWithId = async function(driver, id) {
  const videoElements = await driver.findElements(By.id(id));
  return videoElements.length > 0;
};

/**
 * Waits for elements with a tag name
 * @param {Object} driver 
 * @param {String} tagName Tag name of the elements to be waited for
 */
const waitForElementsWithTagName = async function(driver, tagName) {
  const videoElements = await driver.findElements(By.tagName(tagName));
  return videoElements.length > 0;
};


/* ======================================== EXPORTED ======================================== */

const extractStats = function(senderStats, receiverStats) {
  return statsUtils.extractStats(senderStats, receiverStats);
}

const extractJson = function(senderStats, direction) {
  return statsUtils.extractJson(senderStats, direction);
}

/**
 * Retrieves arguments and information useful for tests
 * @param {String} dirname __dirname | Path to JS folder
 * @returns {Object} A collection of named values containing information for testing
 */
const getGlobalVariables = function(dirname){
  if (dirname.includes("\\")) {
    dirname = dirname.replace(/\\/g, "/");
  }
  const numberOfParticipant = process.argv[2];
  const id = process.argv[3]; // To identify browsers
  const uuid = process.argv[4];
  let reportPath = process.argv[5];
  let reportPathWithoutPt = dirname + reportPath.substr(1, reportPath.length);
  const payloadPath = reportPathWithoutPt + '/payload.json';
  const networkInstrumentationPath = reportPathWithoutPt + '/networkInstrumentation.json'; 
  const capabilitiesPath = reportPathWithoutPt + '/' + id + '/capabilities.json';
  reportPath = reportPath + '/' + id;
  const resultFilePath = reportPath + '/' + uuid + '-result.json';
  let variables = {
    numberOfParticipant: numberOfParticipant,
    id: id,
    uuid: uuid,
    capabilitiesPath: capabilitiesPath,
    payloadPath: payloadPath,
    networkInstrumentationPath: networkInstrumentationPath,
    reportPath: reportPath,	
    resultFilePath: resultFilePath,
  };
  return variables; 
}

/**
 * Gets KITE config
 * @param {String} dirname __dirname | Path to JS folder
 * @returns KITE config
 */
const getKiteConfig = async function(dirname) {
  let variables = getGlobalVariables(dirname);
  const numberOfParticipant = variables.numberOfParticipant;
  const id = variables.id;
  const uuid = variables.uuid;
  const capabilities = require(variables.capabilitiesPath);
  const reportPath = variables.reportPath;
  const remoteUrl = capabilities.remoteUrl;
  const resultFilePath = variables.resultFilePath;

  // Payload
  let payloadPath = variables.payloadPath;
  let payload;
  if (fs.existsSync(payloadPath)) {
    payload = require(payloadPath);
  }
  
  // Network Instrumentation
  let nwInstPath = variables.networkInstrumentationPath 
  let networkInstrumentation;
  if (fs.existsSync(nwInstPath)) {
    let tmpNwInstPath = require(nwInstPath);
    networkInstrumentation = await getNetworkInstrumentationFromFile(tmpNwInstPath, remoteUrl);
  }

  let config = {
    capabilities: capabilities,
    id: id,
    networkInstrumentation: networkInstrumentation,
    numberOfParticipant: numberOfParticipant,
    payload: payload,
    remoteUrl: remoteUrl,
    reportPath: reportPath,
    resultFilePath: resultFilePath,
    uuid, uuid,
  };
  return config;
}

const getNetworkInstrumentationFromFile = async function(nwInstJson, remoteUrl) {
  let networkInstrumentation = {};
  let nwInstArray = Object.keys(nwInstJson);
  for (let i = 0; i < nwInstArray.length; i++) {
    let idx = nwInstJson[nwInstArray[i]];
    let res = "";
    // console.log(typeof idx);
    if (typeof idx === "string" && (nwInstArray[i] === "instances" || nwInstArray[i] === "networkProfiles")) {
      if (idx.includes("file://")) {
        // Local file
        let tmp = idx.replace("file://", "");
        res = require(tmp);
      } 
      if (idx.includes("http") && idx.includes("://")) {
        // Remote file (http | https => URL)
        res = await fetch(idx);
        res = await res.json();
      }
      networkInstrumentation[nwInstArray[i]] = res[nwInstArray[i]];
    } else { // Already a json
      networkInstrumentation[nwInstArray[i]] = idx;
    }
  }
  let nwInstrumentation = new NetworkInstrumentation(networkInstrumentation, networkInstrumentation["remoteAdress"], networkInstrumentation["kiteServerGridId"]);
  return nwInstrumentation;
} 

/**
 * Gets the statistics once
 * @param {Object} driver 
 * @param {String} statsType Type of statistics
 * @param {String} pc The peer connection 
 * @returns An array of statistics
 */
const getStatOnce = async function(driver, statsType, pc) {
  await driver.executeScript(stashStat(statsType, pc));
  await waitAround(100);
  const stat = await driver.executeScript(getStashedStat(statsType));
  return stat;
}

/**
 * Gets the statistics several times
 * @param {Object} stepInfo Reference to the Step object
 * @param {String} statsType Type of statistics
 * @param {String} pc The peer connection
 * @returns A collection of named values 
 */
const getStats = async function(stepInfo, statsType, pc) {
  let stats = {};
  for (let i = 0; i < stepInfo.statsCollectionTime; i += stepInfo.statsCollectionInterval) {
    let stat = await this.getStatOnce(stepInfo.driver, statsType, pc);
    if (i == 0) {
      stats['stats'] = [];
      let offer = await getSDPMessage(stepInfo.driver, pc, "offer");
      let answer = await getSDPMessage(stepInfo.driver, pc, "answer");
      stats['offer'] = offer;
      stats['answer'] = answer;
    }
    stats['stats'].push(stat);
    await waitAround(stepInfo.statsCollectionInterval * 1000);
  }
  return statsUtils.buildClientStatObject(stats, stepInfo.selectedStats);
}

/**
 * Checks the video with an given index
 * @param {Object} driver 
 * @param {Number} index Video index to be checked
 * @returns A collection of named values
 */

/**
 * Navigates to the url and wait for the page to be ready
 * @param {Object} stepInfo Reference to the Step object
 */
const open = async function(stepInfo) {
  await stepInfo.driver.get(stepInfo.url);
  await this.waitForPage(stepInfo.driver, stepInfo.timeout); 
}

/**
 * Takes a screenshot of the current page and returns it
 * @param {WebDriver} driver
 * @returns {Object} A base-64 encoded PNG 
 */
const takeScreenshot = async function(driver) {
  const image = await driver.takeScreenshot();
  return image;
}

const verifyVideoDisplayByIndex = async function(driver, index) {
  const sumArray = [];
  let result = {};
  let videoCheck = 'video';
  const sum1 = await driver.executeScript(getPixelSumByIndexScript(index));
  sumArray.push(sum1);
  await waitAround(1000);
  const sum2 = await driver.executeScript(getPixelSumByIndexScript(index));
  sumArray.push(sum2);

  if (sumArray.length == 0 || sumArray.includes(0)) {
    videoCheck = 'blank';
    //throw new Error('The video was blank at the moment of checking');
  } else {
    if (Math.abs(sumArray[0] - sumArray[1]) == 0) {
        videoCheck = 'still';
        //throw new Error('The video was still at the moment of checking');
    }
    console.log('Verified video display for video[' + index + '] successfully with ' + sumArray[0] + ' and ' + sumArray[1]);
  }
  result['result'] = videoCheck;
  result['details'] = sumArray;
  return result;
}

/**
 * Checks the video with an given id
 * @param {Object} driver 
 * @param {Number} id Video id to be checked
 * @returns A collection of named values
 */
const verifyVideoDisplayById = async function(driver, id) {
  const sumArray = [];
  let result = {};
  let videoCheck = 'video';
  const sum1 = await driver.executeScript(getPixelSumsByIdScript(id));
  sumArray.push(sum1);
  await waitAround(1000);
  const sum2 = await driver.executeScript(getPixelSumsByIdScript(id));
  sumArray.push(sum2);

  if (sumArray.length == 0 || sumArray.includes(0)) {
    videoCheck = 'blank';
    //throw new Error('The video was blank at the moment of checking');
  } else {
    if (Math.abs(sumArray[0] - sumArray[1]) == 0) {
        videoCheck = 'still';
        //throw new Error('The video was still at the moment of checking');
    }
    console.log('Verified video display for [' + id + '] successfully with ' + sumArray[0] + ' and ' + sumArray[1]);
  }
  result['result'] = videoCheck;
  result['details'] = sumArray;
  return result;
}

/**
 * Waits a while
 * @param {Number} ms Time in ms
 * @returns {Promise} Returns a resolved promise after a given time
 */
const	waitAround = function (ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Waits for element in the current page
 * @param {Object} driver 
 * @param {String} type The type of element 
 * @param {String} value The element value
 * @param {Number} timeout Time in s before it timeout  
 */
const waitForElement = async function(driver, type, value, timeout) {
  switch(type) {
    case 'id': {
      return driver.wait(waitForElementsWithId(driver, value), timeout * 1000);
    }
    case 'className': {
      return driver.wait(waitForElementsWithClassName(driver, value), timeout * 1000);
    }
    case 'tagName': {
      return driver.wait(waitForElementsWithTagName(driver, value), timeout * 1000);
    }
    default:
      throw new Error('Unsupported wait type: ' + type);
  }
}

/**
 * Waits for page to be ready 
 * @param {WebDriver} driver 
 * @param {Number} timeout Time in s before it timeout 
 */
const waitForPage = async function(driver, timeout) {
  await driver.wait(isDocumentReady(driver), timeout * 1000);
}

/**
 * Waits for the video elements of the page 
 * @param {Object} stepInfo Reference to the Step object
 * @param {By} videoElements
 */
const waitForVideos = async function(stepInfo, videoElements) {
  let videos = [];
  let i = 0;
  while (videos.length < stepInfo.numberOfParticipant && i < stepInfo.timeout) {
    videos = await stepInfo.driver.findElements(videoElements);
    i++;
    await waitAround(1000); // waiting 1s after each iteration
    }
  // Make sure that it has not timed out
  if (i === stepInfo.timeout) {
    throw new KiteTestError(Status.FAILED, "unable to find " +
      stepInfo.numberOfParticipant + " <video> element on the page. Number of video found = " +
      videos.length);
  }
}

/**
 * Writes the desired content in a file
 * @param {String} fileName The file in which to write
 * @param {String} content The content to write
 */
const writeToFile = function(fileName, content) {
  let writeStream = fs.createWriteStream(fileName);
  writeStream.write(content);
  // the finish event is emitted when all data has been flushed from the stream
  writeStream.on('finish', () => {
      console.log('wrote all data to file');
  });
  // close the stream
  writeStream.end();
}

module.exports = { 
  // todo: appendToFile function
  extractJson,
  extractStats,
  getGlobalVariables,
  getKiteConfig,
  sdpMessageScript,
  getNetworkInstrumentationFromFile,
  getPixelSumByIndexScript,
  getPixelSumsByIdScript,
  getStatOnce,
  getStats,
  open,
  takeScreenshot,
  verifyVideoDisplayByIndex,
  verifyVideoDisplayById,
  waitAround,
  waitForElement,
  waitForPage,
  waitForVideos,
  writeToFile,
}
