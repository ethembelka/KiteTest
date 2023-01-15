/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const RTCStatObject = require('./RTCStatObject.js');

class RTCCodecStats extends RTCStatObject {
  constructor(statObject) {
    super();
    this.setId(this.getStatByName(statObject, "id"));
    this.payloadType = this.getStatByName(statObject, "payloadType");
    this.clockRate = this.getStatByName(statObject, "clockRate");
    this.channels = this.getStatByName(statObject, "channels");
    this.codec = this.getStatByName(statObject, "codec");
    this.sdpFmtpLine = this.getStatByName(statObject, "sdpFmtpLine");
  }

  getJsonBuilder() {
    let builder = {};
    builder["payloadType"] = this.payloadType;
    builder["clockRate"] = this.clockRate;
    builder["channels"] = this.channels;
    builder["codec"] = this.codec;
    builder["sdpFmtpLine"] = this.sdpFmtpLine;
    return builder;
  }
}

module.exports = RTCCodecStats;