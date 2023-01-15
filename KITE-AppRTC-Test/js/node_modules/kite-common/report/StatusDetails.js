/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

// ATM: Useless
/**
 * @class StatusDetail
 * @description
 * @constructor StatusDetails()
 */
class StatusDetails {
  constructor() {
    this.known = false;
    this.muted = false;
    this.flaky = false;
  }

  setKnown(known) {
    this.known = known;
  }

  setMuted(muted) {
    this.muted = muted;
  }

  setFlaky(flaky) {
    this.flaky = flaky;
  }

  setMessage(message) {
    this.message = message;
  }

  setTrace(trace) {
    this.trace = trace;
  }

  getJsonBuilder() {
    let builder = {};
    builder['known'] = this.known;
    builder['muted'] = this.muted;
    builder['flaky'] = this.flaky;

    if (typeof this.message !== "undefined") {
      builder['message'] = this.message;
    }

    if (typeof this.trace !== "undefined") {
      builder['trace'] = this.trace;
    }

    return builder;
  }
  

  toJson() {
    return JSON.stringify(this);
  }
}

module.exports = StatusDetails;