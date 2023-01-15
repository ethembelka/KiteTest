/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const RTCStatObject = require('./RTCStatObject');

class RTCIceCandidateStats extends RTCStatObject {
  constructor(statObject) {
    super();
    this.setId(this.getStatByName(statObject, "id"));
    this.ip = this.getStatByName(statObject, "ip");    
    this.port = this.getStatByName(statObject, "port");    
    this.protocol = this.getStatByName(statObject, "protocol");    
    this.candidateType = this.getStatByName(statObject, "candidateType");    
    this.priority = this.getStatByName(statObject, "priority");    
    this.url = this.getStatByName(statObject, "url");     
  }

  getJsonBuilder() {
    let builder = {};
    builder["ip"] = this.ip;
    builder["port"] = this.port;
    builder["protocol"] = this.protocol;
    builder["candidateType"] = this.candidateType;
    builder["priority"] = this.priority;
    builder["url"] = this.url;
    return builder;
  }
}

module.exports = RTCIceCandidateStats;