/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const {RTCCodecStats, RTCMediaStreamStats, RTCRTPStreamStats,
      RTCPeerConnectionStats, RTCTransportStats, RTCIceCandidatePairStats,
      RTCIceCandidateStats} = require('../RTCstats');

const candidatePairStats = ["bytesSent", "bytesReceived", "currentRoundTripTime", "totalRoundTripTime", "timestamp"];
const inboundStats = ["bytesReceived", "packetsReceived", "packetsLost", "jitter", "timestamp"];
const outboundStats = ["bytesSent", "timestamp"];

/**
 * Creates an object containing all the selected data
 * @param {JSON} clientStats 
 * @param {Array} selectedStats Statistics to be kept
 * @returns {JSON} 
 */
function buildClientStatObject(clientStats, selectedStats) {
  let builder = {};
  try {
    let clientStatArray = clientStats['stats'];
    let jsonClientStatArray = [];
    for(let i = 0; i < clientStatArray.length; i++) {
      let jsonStatObjectBuilder = buildSingleStatObject(clientStatArray[i], selectedStats);
      jsonClientStatArray.push(jsonStatObjectBuilder);
    }
    if(typeof selectedStats === "undefined") {
      // add SDP offer stuff
      let sdpBuilder = {};
      let tmpsdpOffer = clientStats["offer"];
      let tmpsdpAnswer = clientStats["answer"];
      let sdpOffer = {};
      let sdpAnswer = {};
      sdpOffer["type"] = tmpsdpOffer["type"];
      sdpOffer["sdp"] = tmpsdpOffer["sdp"];
      sdpAnswer["type"] = tmpsdpAnswer["type"];
      sdpAnswer["sdp"] = tmpsdpAnswer["sdp"];
      sdpBuilder["offer"] = sdpOffer;
      sdpBuilder["answer"] = sdpAnswer;
      builder["sdp"] = sdpBuilder;
    }
    builder['statsArray'] = jsonClientStatArray; 
    return builder;
  } catch (e) {
    console.log(e);
    return {};
  }  
}

/**
 * Creates a statistic object ~~
 * @param {Array} statArray 
 * @param {Array} selectedStats 
 */
function buildSingleStatObject(statArray, selectedStats) {
  let builder = {};
  let stat = {};
  let selectedStatsString = JSON.stringify(selectedStats);
  if (statArray != undefined) {
    for(var i = 0; i < statArray.length; i++) {
      if (typeof statArray[i] !== "undefined") {
        var type = statArray[i].type;
        if(selectedStatsString == "null" || selectedStatsString.length == 0 || selectedStatsString.indexOf(type) != -1) {
          var statObject = null;
          switch(type) {
            case "codec": 
              statObject = new RTCCodecStats(statArray[i]);
              break;
            case "track": 
              statObject = new RTCCodecStats(statArray[i]);
              break;
            case "stream": 
              statObject = new RTCMediaStreamStats(statArray[i]);
              break;
            case "inbound-rtp": 
              statObject = new RTCRTPStreamStats(statArray[i], true);
              break;
            case "remote-inbound-rtp": 
              statObject = new RTCRTPStreamStats(statArray[i], true);
              break;
            case "outbound-rtp": 
              statObject = new RTCRTPStreamStats(statArray[i], false);
              break;
            case "peer-connection": 
              statObject = new RTCPeerConnectionStats(statArray[i]);
              break;
            case "transport": 
              statObject = new RTCTransportStats(statArray[i]);
              break;
            case "candidate-pair": 
              statObject = new RTCIceCandidatePairStats(statArray[i]);
              break;
            case "remote-candidate":
              statObject = new RTCIceCandidateStats(statArray[i]);
              break;
            case "local-candidate":
              statObject = new RTCIceCandidateStats(statArray[i]);
              break;
            default:
              break;
          }
          if(statObject != null) {
            if(typeof stat[type] === "undefined") {
              stat[type] = [];
            }
            stat[type].push(statObject);
          }
        }
      }
    } 
  }
  if(typeof stat !== "undefined") {
    for(let i = 0; i < Object.keys(stat).length; i++) {
      let idx = Object.keys(stat)[i];
      let tmp = {};
      for(let j = 0; j < stat[idx].length; j++) {
        let jdx = stat[idx][j];
        tmp[jdx.id] = jdx.getJsonBuilder();
      }
      builder[idx] = tmp;
    }
  }
  return builder;
}

/**
 * Gets ~~
 * @param {JSON} jsonObject 
 */
function getSuccessfulCandidate(jsonObject) {
  let candObj = jsonObject['candidate-pair'];
  if(typeof candObj !== "undefined") {
    for(let i = 0; i < Object.keys(candObj).length; i++) {
      let idx = Object.keys(candObj)[i];
      if("succeeded" === candObj[idx].state) {
        return candObj[idx];
      }
    }
    for(let i = 0; i < Object.keys(candObj).length; i++) {
      let idx = Object.keys(candObj)[i];
      if("in-progress" === candObj[idx].state && !("NA" === candObj[idx].currentRoundTripTime)) {
        return candObj[idx];
      }
    }
  }
  return undefined;
}

/**
 * Gets RTC statistics
 * @param {JSON} jsonObject 
 * @param {Object} stats 
 * @param {String} mediaType 
 */
function getRTCStats(jsonObject, stats, mediaType) {
  let obj = jsonObject[stats];
  if(typeof obj !== "undefined") {
    for(let i = 0; i < Object.keys(obj).length; i++) {
      let idx = Object.keys(obj)[i];
      if(mediaType === obj[idx]['mediaType']) {
        return obj[idx];
      }
    }
  }
  return undefined;
}

/**
 * Extract data ~~
 * @param {*} senderStats Sender statistics
 * @param {*} receiverStats Receiver statistics
 */
function extractStats(senderStats, receiverStats) {
  let builder = {};
  if(typeof senderStats !== "undefined") {
    builder['localPC'] = extractJson(senderStats, "out");
  }
  if(typeof receiverStats !== "undefined") {
    let i = 0;
    for(let j = 0; j < receiverStats.length; j++){
      builder["remotePC[" + i++ + "]"] = extractJson(receiverStats[j], "in", j);
    }
  }
  return builder;
}

/**
 * Extracts data by direction
 * @param {JSON} jsonObj 
 * @param {String} direction "in" | "out" | "both"
 * @returns {JSON}
 */
function extractJson(jsonObj, direction) {
  let builder = {};
  let jsonArray = jsonObj['statsArray'];
  let noStats = 0;
  if(typeof jsonObj !== "undefined") {
    if(typeof jsonArray !== "undefined") {
      noStats = jsonArray.length;
    }
    for(let i = 0; i < noStats; i++) {
      builder['candidate-pair_' + i] = getStatsJsonBuilder(jsonArray[i], candidatePairStats, "candidate-pair", "");
      if("both" === direction.toLowerCase() || "in" === direction.toLowerCase()) {
        builder['inbound-audio_' + i] = getStatsJsonBuilder(jsonArray[i], inboundStats, "inbound-rtp", "audio");
        builder['inbound-video_' + i] = getStatsJsonBuilder(jsonArray[i], inboundStats, "inbound-rtp", "video");
      }
      if("both" === direction.toLowerCase() || "out" === direction.toLowerCase()) {
        builder['outbound-audio_' + i] = getStatsJsonBuilder(jsonArray[i], outboundStats, "outbound-rtp", "audio");
        builder['outbound-video_' + i] = getStatsJsonBuilder(jsonArray[i], outboundStats, "outbound-rtp", "video");
      }
    }
  } else {
    console.log("statsArray is null");
  }
  let csvBuilder = {};
  csvBuilder['currentRoundTripTime (ms)'] = computeRoundTripTime(builder, noStats, "current");
  csvBuilder['totalRoundTripTime (ms)'] = computeRoundTripTime(builder, noStats, "total")
  csvBuilder['totalBytesReceived (Bytes)'] = totalBytes(builder, noStats, "Received");
  csvBuilder['totalBytesSent (Bytes)'] = totalBytes(builder, noStats, "Sent");
  csvBuilder['avgSentBitrate (bps)'] = computeBitrate(builder, noStats, "Sent", "candidate-pair");
  csvBuilder['avgReceivedBitrate (bps)'] = computeBitrate(builder, noStats, "Received", "candidate-pair");
  if("both" === direction || "in" === direction) {  
    csvBuilder['inboundAudioBitrate (bps)'] = computeBitrate(builder, noStats, "in", "audio");
    csvBuilder['inboundVideoBitrate (bps)'] = computeBitrate(builder, noStats, "in", "video");
  }
  if("both" === direction || "out" === direction) {
    csvBuilder['outboundAudioBitrate (bps)'] = computeBitrate(builder, noStats, "out", "audio");
    csvBuilder['outboundVideoBitrate (bps)'] = computeBitrate(builder, noStats, "out", "video");
  }
  if("both" === direction || "in" === direction) {
    csvBuilder['audioJitter (ms)'] = computeAudioJitter(builder, noStats);
    csvBuilder['audioPacketsLoss (%)'] = computePacketsLoss(builder, noStats, "audio");
    csvBuilder['videoPacketsLoss (%)'] = computePacketsLoss(builder, noStats, "video");
  }
  return csvBuilder;
}

/**
 * Gets the name of the JSON object
 * @param {String} direction 
 * @param {String} mediaType audio | video
 * @returns {String} 
 */
function getJsonObjectName(direction, mediaType) {
  if("candidate-pair" === mediaType) {
    return "candidate-pair_";
  }
  return direction + "bound-" + mediaType + "_";
}

/**
 * Gets the key of the JSON object
 * @param {String} direction 
 */
function getJsonKey(direction) {
  if("Sent" === direction || "out" === direction) {
    return "bytesSent";
  }
  if("Received" === direction || "in" === direction) {
    return "bytesReceived";
  }
  return null;
}

/**
 * Computes the round trip time
 * @param {JSON} jsonObject 
 * @param {Number} noStats number of stats
 * @param {String} prefix current | total
 */
function computeRoundTripTime(jsonObject, noStats, prefix) {
  let rtt = 0;
  let ct = 0;
  try {
    for(let i = 0; i < noStats; i++) {
      let s = jsonObject["candidate-pair_" + i][prefix + "RoundTripTime"];
      if(typeof s !== "undefined" && s !== "NA" && s !== "0") {
        rtt += 1000 * parseFloat(s);
        ct++;
      }
    }
  } catch (e) {
    console.log(e);
  }
  if (ct > 0) {
    return "" + Math.round(rtt/ct);
  }
  return "";
}

/**
 * Gets the total number of bytes in a direction 
 * @param {JSON} jsonObject 
 * @param {Number} noStats 
 * @param {String} direction 
 * @returns {String}
 */
function totalBytes(jsonObject, noStats, direction) {
  let bytes = 0;
  try {
    for(let i = 0; i < noStats; i++) {
      let s = jsonObject['candidate-pair_' + i]['bytes' + direction];
      if (typeof s !== "undefined" && s !== "NA") {
        let b = parseFloat(s);
        bytes = Math.max(b, bytes);
      } 
    }
  } catch (e) {
    console.log(e);
  }
  return "" + bytes;
}

/**
 * Computes the bit rate
 * @param {JSON} jsonObject 
 * @param {Number} noStats 
 * @param {String} direction 
 * @param {String} mediaType 
 * @returns {String}
 */
function computeBitrate(jsonObject, noStats, direction, mediaType) {
  let bytesStart = 0;
  let bytesEnd = 0;
  let tsStart = 0;
  let tsEnd = 0;
  let avgBitrate = 0;
  let b;
  if (noStats > 1) {
    try {
      let jsonObjName = getJsonObjectName(direction, mediaType);
      let jsonKey = getJsonKey(direction);
      for(let i = 0; i < noStats; i++) {
        let s;
        if(typeof jsonObject[jsonObjName + i] !== "undefined") {
          s = jsonObject[jsonObjName + i][jsonKey];
        }
        if(typeof s !== "undefined" && s !== "NA") {
          b = parseFloat(s);
          bytesStart = (bytesStart == 0 || b < bytesStart) ? b : bytesStart;
          bytesEnd = (bytesEnd == 0 || b > bytesEnd) ? b : bytesEnd;
        }
        let ts;
        if(typeof jsonObject[jsonObjName + i] !== "undefined") {
          ts = jsonObject[jsonObjName + i]["timestamp"];
        } 
        if (typeof ts !== "undefined" && s !== "NA") {
          b = parseFloat(ts);
          if (i === 0) {
            tsStart = b;
            if(direction === "in") {
            }
          }
          if (i === (noStats-1)) {
            tsEnd = b;
            if(direction === "in") {
            }
          }
        }
      }
      if (tsEnd != tsStart) {
        let timediff = (tsEnd - tsStart);
        avgBitrate = Math.abs((8000 * (bytesEnd - bytesStart)) / timediff);
        avgBitrate = avgBitrate.toFixed(2);
      }
      return "" + avgBitrate;
    } catch (e) {
      console.log(e);
    }
  }
  return "";
}

/**
 * Computes the audio jitter
 * @param {JSON} jsonObject 
 * @param {Number} noStats 
 * @returns {String}
 */
function computeAudioJitter(jsonObject, noStats) {
  let jitter = 0;
  let ct = 0;
  if (noStats > 1) {
    try {
      for(let i = 0; i < noStats; i++) {
        let obj = jsonObject["inbound-audio_" + i];
        if (typeof obj !== "undefined") {
          let s = obj["jitter"];
          if(typeof s !== "undefined" && s !== "NA") {
            jitter += (1000 * parseFloat(s));
            ct++;
          }
        }
      }
      if (ct > 0) { 
        return "" + (jitter/ct).toFixed(3);
  
      }
    } catch (e) {
      console.log(e);
    }
  }
  return "";
}

/**
 * Computes the packet losses as a % packetLost/total packets
 * @param {JSON} jsonObject Object containing the list getStats result
 * @param {Number} noStats Number of stats in jsonObject
 * @param {String} mediaType "audio" | "video"
 * @returns {String} Packet losses (% packetLost/total packets)
 */
function computePacketsLoss(jsonObject, noStats, mediaType) {
  if (noStats >= 1) {
    try {
      obj = jsonObject["inbound-" + mediaType + "_" + (noStats - 1)];
      if(typeof obj !== "undefined") {
        let s = obj["packetsReceived"];
        let l = obj["packetsLost"];
        if(typeof s !== "undefined" && s !== "NA" && typeof l !== "undefined" && l !== "NA") {
          let packetsLost = parseFloat(l);
          let totalPackets = parseFloat(s) + packetsLost;
          if(totalPackets > 0) {
            let packetLoss = packetsLost / totalPackets * 100;
            return packetLoss.toFixed(2);
          }
        } else {
          console.log('computePacketsLoss');
          console.log(obj);
        }  
      } else {
        console.log("computePacketLoss obj is null" + (" inbound-" + mediaType + "_" + (noStats - 1)));
      }
    } catch (e) {
      console.log(e);
      // throw new KitetestError(Status.BROKEN, "Error while computing packet loss");
    }
  }
  return "";
}

/**
 * Gets statistics in json format
 * @param {JSON} jsonObject 
 * @param {Array} stringArray 
 * @param {Object} stats 
 * @param {String} mediaType
 * @returns {JSON} 
 */
function getStatsJsonBuilder(jsonObject, stringArray, stats, mediaType) {
  let subBuilder = {};
  if("candidate-pair" === stats) {
    let successfulCandidate = getSuccessfulCandidate(jsonObject);
    if(typeof successfulCandidate !== "undefined") {
      for(let i = 0; i < stringArray.length; i++) {
        if(successfulCandidate.hasOwnProperty(stringArray[i])) {
          subBuilder[stringArray[i]] = successfulCandidate[stringArray[i]];
        }
      }
    }
  } else {
    let obj = getRTCStats(jsonObject, stats, mediaType);
    if(typeof obj !== "undefined") {
      for(let i = 0; i < stringArray.length; i++) {
        if(obj.hasOwnProperty(stringArray[i])) {
          subBuilder[stringArray[i]] = obj[stringArray[i]];
        }
      }
    }
  }
  return subBuilder;
}


module.exports = {
  extractStats,
  extractJson,
  buildClientStatObject,
}