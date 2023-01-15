/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const KiteTestError = require('../report/KiteTestError');
const Status = require('../report/Status');
const INTERFACE_0_NAME = "eth9";
const INTERFACE_1_NAME = "eth10";

/**
 * @class NetworkProfile
 * @description 
 * @constructor NetworkProfile(jsonObject)
 * @param {JSON} jsonObject
 */
class NetworkProfile {
  constructor(jsonObject) {
    this.name = jsonObject.name;
    this.delay = jsonObject.delay ? jsonObject.delay : 0 ;
    this.packetloss = jsonObject.packetloss ? jsonObject.packetloss : 0;
    this.corrupt = jsonObject.corrupt ? jsonObject.corrupt : 0;
    this.duplicate = jsonObject.duplicate ? jsonObject.duplicate : 0;
    this.bandwidth = jsonObject.bandwidth ? jsonObject.bandwidth : 0;
    this.command = (Object.keys(jsonObject).includes("command")) ? "" + jsonObject.command : this.setCommand();
    this.nit = (this.command.indexOf(INTERFACE_0_NAME) > -1) ? INTERFACE_0_NAME : INTERFACE_1_NAME;
  }

  /**
   * Sets and returns the command
   * @returns {String} The command
   */
  setCommand() {
    let egress_command = "";
    let ingress_command = "";
    let command = "sudo ip link add ifb0 type ifb || true && sudo ip link set up dev ifb0 || true && sudo tc qdisc add dev " + INTERFACE_0_NAME + " ingress || true && sudo tc filter add dev " + INTERFACE_0_NAME + " parent ffff: protocol ip u32 match u32 0 0 action mirred egress redirect dev ifb0 || true && ";
    if (this.delay != 0) {
      egress_command = this.createCommand(egress_command, "delay " + this.delay + "ms ", INTERFACE_0_NAME);
      ingress_command = this.createCommand(ingress_command, "delay " + this.delay + "ms ", "ifb0");
    }

    if (this.packetloss != 0) {
      egress_command = this.createCommand(egress_command, "loss " + this.packetloss + "% ", INTERFACE_0_NAME);
      ingress_command = this.createCommand(ingress_command, "loss " + this.packetloss + "% ", "ifb0");
    }

    if (this.corrupt != 0) {
      egress_command = this.createCommand(egress_command, "corrupt " + this.corrupt + "% ", INTERFACE_0_NAME);
      ingress_command = this.createCommand(ingress_command, "corrupt " + this.corrupt + "% ", "ifb0");
    }

    if (this.duplicate != 0) {
      egress_command = this.createCommand(egress_command, "duplicate " + this.duplicate + "% ", INTERFACE_0_NAME);
      ingress_command = this.createCommand(ingress_command, "duplicate " + this.duplicate + "% ", "ifb0");
    }

    if (this.bandwidth != 0) {
      egress_command = this.createCommand(egress_command, "rate " + this.bandwidth + "kbit ", INTERFACE_0_NAME);
      ingress_command = this.createCommand(ingress_command, "rate " + this.bandwidth + "kbit ", "ifb0");
    }

    command = command + egress_command + "|| true && " + ingress_command;
    if (egress_command === "" && ingress_command === "") {
      throw new KiteTestError(Status.BROKEN, "No command to run");
    } else {
      return command;
    }
  }

  /**
   * Creates a command
   * @param {String} command 
   * @param {String} info 
   * @param {String} nit
   * @returns {String} The command 
   */
  createCommand(command, info, nit) {
    if (command === "") {
      command = "sudo tc qdisc replace dev " + nit + " root netem " + info;
    } else {
      command = command + info;
    }
    return command;
  }

  /**
   * Gets name
   * @returns {String} The name
   */
  getName() {
    return this.name;
  }

  /**
   * Sets name
   * @param {String} name The name
   */
  setName(name) {
    this.name = name;
  }

  /**
   * Gets delay
   * @returns {Number} The delay
   */
  getDelay() {
    return this.delay;
  }

  /**
   * Sets delay
   * @param {Number} delay The delay
   */
  setDelay(delay) {
    this.delay = delay;
  }

  /**
   * Gets packetloss
   * @returns {Number} 
   */
  getPacketloss() {
    return packetloss;
  }

  /**
   * Sets packetloss
   * @param {Number} packetloss 
   */
  setPacketloss(packetloss) {
    this.packetloss = packetloss;
  }

  /**
   * Gets corrupt
   * @returns {Number} The corrupt
   */
  getCorrupt() {
    return this.corrupt;
  }

  /**
   * Sets corrupt
   * @param {Number} corrupt The corrupt
   */
  setCorrupt(corrupt) {
    this.corrupt = corrupt;
  }

  /**
   * Gets duplicate
   * @returns {Number} Duplicate
   */
  getDuplicate() {
    return this.duplicate;
  }

  /**
   * Sets duplicate
   * @param {Number} duplicate
   */
  setDuplicate(duplicate) {
    this.duplicate = duplicate;
  }

  /**
   * Gets bandwidth
   * @returns {String} The bandwidth
   */
  getBandwidth() {
    return this.bandwidth;
  }

  /**
   * Sets bandwidth
   * @param {Number} bandwidth 
   */
  setBandwidth(bandwidth) {
    this.bandwidth = bandwidth;
  }

  /**
   * Gets command
   * @returns {String} The command
   */
  getCommand() {
    return this.command;
  }

  /**
   * Gets interface 
   * @returns {String} The interface
   */
  getInterface() {
    return this.nit;
  }

  /**
   * Sets interface
   * @param {String} nit The interface
   */
  setInterface(nit) {
    this.nit = nit;
  }
}

module.exports = NetworkProfile;