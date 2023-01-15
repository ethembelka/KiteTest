/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const RTCStatObject = require('./RTCStatObject');

class RTCIceCandidatePairStats extends RTCStatObject {
  constructor(statObject) {
    super()
    this.setId(this.getStatByName(statObject, "id"));
    this.transportId = this.getStatByName(statObject, "transportId");    
    this.localCandidateId = this.getStatByName(statObject, "localCandidateId");    
    this.remoteCandidateId = this.getStatByName(statObject, "remoteCandidateId");    
    this.state = this.getStatByName(statObject, "state");    
    this.priority = this.getStatByName(statObject, "priority");    
    this.nominated = this.getStatByName(statObject, "nominated");    
    this.bytesSent = this.getStatByName(statObject, "bytesSent");    
    this.bytesReceived = this.getStatByName(statObject, "bytesReceived");    
    this.totalRoundTripTime = this.getStatByName(statObject, "totalRoundTripTime");    
    this.currentRoundTripTime = this.getStatByName(statObject, "currentRoundTripTime");    
    this.timestamp = this.getStatByName(statObject, "timestamp");    
  }

  getJsonBuilder() {
    let builder = {};
    builder["transportId"] = this.transportId;
    builder["localCandidateId"] = this.localCandidateId;
    builder["remoteCandidateId"] = this.remoteCandidateId;
    builder["state"] = this.state;
    builder["priority"] = this.priority;
    builder["nominated"] = this.nominated;
    builder["bytesSent"] = this.bytesSent;
    builder["bytesReceived"] = this.bytesReceived;
    builder["totalRoundTripTime"] = this.totalRoundTripTime;
    builder["currentRoundTripTime"] = this.currentRoundTripTime;
    builder["timestamp"] = this.timestamp;
    return builder;
  }
}

module.exports = RTCIceCandidatePairStats;