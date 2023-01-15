/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const RTCStatObject = require('./RTCStatObject');

class RTCRTPStreamStats extends RTCStatObject {
  constructor(statObject, inbound) {
    super();
    this.setId(this.getStatByName(statObject, "id"));
    this.ssrc = this.getStatByName(statObject, "ssrc");    
    this.mediaType = this.getStatByName(statObject, "mediaType");    
    this.trackId = this.getStatByName(statObject, "trackId");    
    this.transportId = this.getStatByName(statObject, "transportId");    
    this.nackCount = this.getStatByName(statObject, "nackCount");    
    this.codecId = this.getStatByName(statObject, "codecId");    
    this.timestamp = this.getStatByName(statObject, "timestamp");    
    this.inbound = inbound;
    this.statObject = statObject;    
  }

  getJsonBuilder() {
    let builder = {};
    builder["ssrc"] = this.ssrc;
    builder["mediaType"] = this.mediaType;
    builder["trackId"] = this.trackId;
    builder["transportId"] = this.transportId;
    builder["nackCount"] = this.nackCount;
    builder["codecId"] = this.codecId;
    builder["timestamp"] = this.timestamp;
    if(this.inbound) {
      builder["packetsReceived"] = this.getStatByName(this.statObject, "packetsReceived");
      builder["bytesReceived"] = this.getStatByName(this.statObject, "bytesReceived");
      builder["packetsLost"] = this.getStatByName(this.statObject, "packetsLost");
      builder["packetsDiscarded"] = this.getStatByName(this.statObject, "packetsDiscarded");
      builder["jitter"] = this.getStatByName(this.statObject, "jitter");
      builder["remoteId"] = this.getStatByName(this.statObject, "remoteId");
      builder["framesDecoded"] = this.getStatByName(this.statObject, "framesDecoded");
    } else {
      builder["packetsSent"] = this.getStatByName(this.statObject, "packetsSent"); 
      builder["bytesSent"] = this.getStatByName(this.statObject, "bytesSent"); 
      builder["remoteId"] = this.getStatByName(this.statObject, "remoteId"); 
      builder["framesDecoded"] = this.getStatByName(this.statObject, "framesDecoded"); 
    } 
    return builder;
  }
}

module.exports = RTCRTPStreamStats;