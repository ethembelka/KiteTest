/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const KiteTestError = require('../report/KiteTestError');
const Status = require('../report/Status');
const NetworkInstrumentation = require('./NetworkInstrumentation');
const SSHManager = require('../manager/SSHManager');

const request = async function(url, method, timeout) {
  let result;
  const httpConnection = new XMLHttpRequest();
  httpConnection.open(method, url, true);
  httpConnection.timeout(timeout);
  httpConnection.send();
  httpConnection.onreadystatechange = function() {
    if(this.readyState === 4 && this.status == 200) {
      result = httpConnection.responseText;
    }
  }
  httpConnection.ontimeout = function() {
    console.log("Timed out !");
    throw Error("Timed out");
  };
  return result;
}

const getPrivateIp = async function(hupIpOrDns, sessionId) {
  try {
    let url = "http://" + hupIpOrDns + ":4444/grid/api/testsession?session=" + sessionId;
    let result = await request(url, "GET", 10000);
    console.log(result);
  } catch (e) {
    console.log(e);
  }
}

/**
 * @class 
 * @description
 * @constructor 
 * @param {JSON} jsonObject
 * @param {NetworkInstrumentation} networkInstrumentation 
 */
class Scenario {
  constructor(jsonObject, networkInstrumentation) {
    let missingKey;
    this.networkInstrumentation = networkInstrumentation;
    try {
      missingKey = "type";
      this.type = jsonObject.type;
      if (this.type === 'client') {
        missingKey = "clientIds";
        let jsonArray = jsonObject.clientIds;
        for (let i =0; i < jsonArray.length; i++) {
          this.clientIds.push(jsonArray[i]);
        }
        this.gateway = null;
      } else if (this.type === "gateway") {
        missingKey = "gateway";
        this.gateway = jsonObject.gateway;
        this.clientIds = null;
      } else {
        throw new Error("The type specified doesn't exist");
      }
      missingKey = "network";
      let network = jsonObject.network;
      this.command = this.networkInstrumentation.getNetworkProfiles()[network].getCommand().trim();
      this.nit = this.networkInstrumentation.getNetworkProfiles()[network].getInterface();
      missingKey = "name";
      this.name = jsonObject.name;
    } catch (e) {
      console.log(e);
      throw new KiteTestError(Status.BROKEN, "The key " + missingKey + " is missing");
    }
    this.duration = jsonObject.duration ? jsonObject.duration : 10000; // Default value 10000
  }

  /**
   * Gets name 
   * @returns {String} The name
   */
  getName() {
    return this.name;
  }

  /**
   * Gets client ids 
   * @returns {Array} The client ids
   */
  getClientIds() {
    return this.clientIds;
  }

  /**
   * Gets command
   * @returns {String} The command
   */
  getCommand() {
    return this.command;
  }

  /**
   * Gets gateway
   * @returns {String} The gateway
   */
  getGateway() {
    return this.gateway;
  }

  /**
   * Gets type
   * @returns {String} The type
   */
  getType() {
    return this.Type;
  }

  /**
   * Gets duration
   * @returns {Number} The duration
   */
  getDuration() {
    return this.duration;
  }

  /**
   * 
   * @param {Object} driver
   * @returns {String} The result 
   */
  async sendCommand(driver) {
    let result = "Running " + this.command + " on "; 
    let tmp;
    if (this.type === "gateway") {
      result += this.gateway;
      console.log(result);
      tmp = await this.runCommandGateway(this.command, this.networkInstrumentation); 
      result += tmp;
    }
    if (this.type === "client") {
      let session = "" + await driver.getSession();
      let nodeIp = getPrivateIp(this.networkInstrumentation.getRemoteAddress(), session);
      result += "client " + nodeIp;
      let platform = await driver.getCapabilities().getPlatform();
      if (platform.toUpperCase() === "LINUX") {
        result += this.runCommandClient(this.command, this.networkInstrumentation, nodeIp);
      } else {
        result += "Node " + nodeIp + " is not Linux";
      }
    }
    return result;
  }

  async cleanUp(driver) {
    let result = "Doing CleanUp for " + this.command + " on ";
    let tmp;
    let cleanUpCommand = "sudo tc qdisc del dev " +
      this.nit + " root || true && sudo tc qdisc del dev " + 
      this.nit + " ingress || true && sudo tc qdisc del dev ifb0 root ||true ";
    if (this.type === "gateway") {
      result += this.gateway;
      console.log(result);
      tmp = await this.runCommandGateway(cleanUpCommand, this.networkInstrumentation);
      result += tmp;
    }
    if (this.type === "client") {
      let sessionId = await driver.getSession().getId(); 
      let nodeIp = getPrivateIp(this.networkInstrumentation.getRemoteAddress(), sessionId);
      result += "client " + nodeIp;
      let platform = await driver.getCapabilities().getPlatform();
      if (platform.toUpperCase() === "LINUX") {
        tmp = await this.runCommandClient(cleanUpCommand, this.networkInstrumentation, nodeIp);
        result += tmp;
      } else {
        result += " FAILED, check instrumentalUrl !";
      }
    }
    return result;
  }

  async sshCommand(instance, command) {
    let result = "";
    try {
      let sshManager = new SSHManager(instance.getKeyFilePath(),
        instance.getUsername(), instance.getIpAddress(), command);
      let tmp = await sshManager.call();
      result = tmp;

    } catch (e) {
      console.log(e);
      result = "thrown ERROR : " + e.message;
    }
    return result;
  }

  async kiteServerCommand(url) {
    let result;
    try {
      console.log("kiteServerCommand");
      result = await request(url, "POST", 10000);
      result = "SUCCEEDED and got response : " + result;
    } catch (e) {
      result = "thrown Error : " + e.message;
    }
    return result;
  }

  async runCommandGateway(command, networkInstrumentation) {
    let result = "";
    let gridId = networkInstrumentation.getKiteServerGridId();
    let kiteServer = networkInstrumentation.getKiteServer();
    let url;
    let tmp;
    if (kiteServer === null) {
      let instance = networkInstrumentation.getInstances()[this.gateway];
      tmp = await this.sshCommand(instance, command);
      result += " via ssh " + tmp;
    } else {
      url = kiteServer + gridId + "&gw=" + this.gateway + "&command=" + command;
      tmp = await this.kiteServerCommand(url); 
      result += " via KiteServer " + tmp;
    }
    return result;
  }

  async runCommandClient(command, networkInstrumentation, nodeIp) {
    let gridId = networkInstrumentation.getKiteServerGridId();
    let kiteServer = networkInstrumentation.getKiteServer();
    let url =  kiteServer + "/command?id=" + gridId + "&ip=" + nodeIp + "&command=" + command;
    let tmp = await this.kiteServerCommand(url);
    let result = tmp;
    return result;
  }

  /**
   * 
   * @param {Scenario} scenario
   * @param {Number} clientId
   * @returns {Boolean} 
   */
  shouldExecute(clientId) {
    let res = (this.type === "gateway" && clientId == 0) || (this.type === "client" && this.clientIds.includes(clientId));
    return res;
  }
}

module.exports = Scenario;