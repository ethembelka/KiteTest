/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

class RTCStatObject {
  constructor() {
    this.id;
  }

  getStatByName(statObject, statName) {
    let str = (statObject[statName] != undefined) ? statObject[statName] : "NA";
    return str;
  }

  setId(id) {
    this.id = id;
  }
}

module.exports = RTCStatObject;