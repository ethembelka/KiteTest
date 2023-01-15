/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const RTCStatObject = require('./RTCStatObject');

class RTCMediaStreamStats extends RTCStatObject {
  constructor(statObject) {
    super();
    this.setId(this.getStatByName(statObject, "id"));
    this.streamIdentifier = this.getStatByName(statObject, "streamIdentifer");
    this.trackIds = this.getStatByName(statObject, "trackIds");
  }

  getJsonBuilder() {
    let builder = {};
    builder["streamIdentifier"] = this.streamIdentifier;
    builder["trackIds"] = this.trackIds;
    return builder;
  }
}

module.exports = RTCMediaStreamStats;