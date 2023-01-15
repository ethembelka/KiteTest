/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const RTCStatObject = require('./RTCStatObject');

class RTCMediaStreamTracksStats extends RTCStatObject {
  constructor(statObject) {
    super();
    this.setId(this.getStatByName(statObject, "id"));
    this.trackIdentifier = this.getStatByName(statObject, "trackIdentifier");
    this.remoteSource = this.getStatByName(statObject, "remoteSource");
    this.ended = this.getStatByName(statObject, "ended");
    this.detached = this.getStatByName(statObject, "detached");
    this.frameWidth = this.getStatByName(statObject, "frameWidth");
    this.frameHeight = this.getStatByName(statObject, "frameHeight");
    this.framesPerSecond = this.getStatByName(statObject, "framesPerSecond");
    this.framesSent = this.getStatByName(statObject, "framesSent");
    this.framesReceived = this.getStatByName(statObject, "framesReceived");
    this.framesDecoded = this.getStatByName(statObject, "framesDecoded");
    this.framesDropped = this.getStatByName(statObject, "framesDropped");
    this.framesCorrupted = this.getStatByName(statObject, "framesCorrupted");
    this.audioLevel = this.getStatByName(statObject, "audioLevel");
    this.timestamp = this.getStatByName(statObject, "timestamp");
  }

  getJsonBuilder() {
    let builder = {};
    builder["trackIdentifier"] = this.trackIdentifier;
    builder["remoteSource"] = this.remoteSource;
    builder["ended"] = this.ended;
    builder["detached"] = this.detached;
    builder["frameWidth"] = this.frameWidth;
    builder["frameHeight"] = this.frameHeight;
    builder["framesPerSecond"] = this.framesPerSecond;
    builder["framesSent"] = this.framesSent;
    builder["framesReceived"] = this.framesReceived;
    builder["framesDecoded"] = this.framesDecoded;
    builder["framesDropped"] = this.framesDropped;
    builder["framesCorrupted"] = this.framesCorrupted;
    builder["audioLevel"] = this.audioLevel;
    builder["timestamp"] = this.timestamp;
    return builder;
  }
}

module.exports = RTCMediaStreamTracksStats;