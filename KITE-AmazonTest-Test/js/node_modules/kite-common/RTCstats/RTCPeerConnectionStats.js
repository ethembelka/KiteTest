/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const RTCStatObject = require('./RTCStatObject');

class RTCPeerConnectionStats extends RTCStatObject {
  constructor(statObject) {
    super();
    this.setId(this.getStatByName(statObject, "id"));
    this.dataChannelsOpenedsrc = this.getStatByName(statObject, "dataChannelsOpened");    
    this.dataChannelsClosed = this.getStatByName(statObject, "dataChannelsClosed");      
  }

  getJsonBuilder() {
    let builder = {};
    builder["dataChannelsOpened"] = this.dataChannelsOpened;
    builder["dataChannelsClosed"] = this.dataChannelsClosed;

    return builder;
  }
}

module.exports = RTCPeerConnectionStats;