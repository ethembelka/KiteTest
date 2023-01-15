/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const RTCStatObject = require('./RTCStatObject');

class RTCTransportStats extends RTCStatObject {
  constructor(statObject) {
    super();
    this.setId(this.getStatByName(statObject, "id"));
    this.rtcpTransportStatsId = this.getStatByName(statObject, "rtcpTransportStatsId");
    this.selectedCandidatePairId = this.getStatByName(statObject, "selectedCandidatePairId");
    this.localCertificateId = this.getStatByName(statObject, "localCertificateId");
    this.remoteCertificateId = this.getStatByName(statObject, "remoteCertificateId");
    this.bytesSent = this.getStatByName(statObject, "bytesSent");
    this.bytesReceived = this.getStatByName(statObject, "bytesReceived");
    this.timestamp = this.getStatByName(statObject, "timestamp");
  }

  getJsonBuilder() {
    let builder = {};
    builder["rtcpTransportStatsId"] = this.rtcpTransportStatsId;
    builder["selectedCandidatePairId"] = this.selectedCandidatePairId;
    builder["localCertificateId"] = this.localCertificateId;
    builder["remoteCertificateId"] = this.remoteCertificateId;
    builder["bytesSent"] = this.bytesSent;
    builder["bytesReceived"] = this.bytesReceived;
    builder["timestamp"] = this.timestamp;
    return builder;
  }
}

module.exports = RTCTransportStats;