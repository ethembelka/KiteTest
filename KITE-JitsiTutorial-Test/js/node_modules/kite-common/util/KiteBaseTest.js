/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const {AllureTestReport, Reporter} = require('../report');
const Scenario = require('../instrumentation/Scenario');
const TestUtils = require('./TestUtils');
const io = require('socket.io-client');

/**
 * @class KitBaseTest
 * @description Creating the basis for a KITE test
 * @constructor KiteBaseTest(name, globalVariables, capabilities, payload)
 * @param {String} name
 * @param {JSON} globalVariables
 * @param {JSON} capabilities
 * @param {JSON} payload
 * @param {JSON} networkInstrumentation (Optional) 
 */
class KiteBaseTest {
  constructor(name, kiteConfig) {
    // Allure test report
    this.name = name;
    this.numberOfParticipant = kiteConfig.numberOfParticipant;
    this.id = kiteConfig.id;
    this.uuid = kiteConfig.uuid.split('-').join('');
    this.reportPath = kiteConfig.reportPath;
    this.capabilities = kiteConfig.capabilities;
    this.remoteUrl = kiteConfig.remoteUrl;
    // default timeout
    this.timeout = 60;
    this.report = new AllureTestReport(this.name);
    this.reporter = new Reporter(this.reportPath);

    // Optional
    this.networkInstrumentation = kiteConfig.networkInstrumentation;
    let payload = kiteConfig.payload;
    if(payload) {
      this.payload = payload;
      this.payloadHandling(this.payload);
    }
  }

  /**
   * Sets the test report
   * @param {AllureTestReport} report 
   */
  setTestReport(report) {
    this.report = report;
  }
  
  /**
   * Runs the test steps
   * @abstract function that must be implemented
   */
  async testScript() {
    throw new Error('You must implement this function');
  }

  /**
   * Gets the information from the payload
   * @param {JSON} payload 
   */
  payloadHandling(payload) {
    // Todo: Add some info
    this.url = payload.url;
    // Socket server & port
    if (this.numberOfParticipant > 1) {
      this.port = payload.port ? payload.port : 30000;
      let server = 'http://localhost:' + this.port + '/';
      this.io = io(server);
    }
    this.timeout = payload.testTimeout;
    this.takeScreenshot = payload.takeScreenshotForEachTest;
    // getStats info
    let getStats = payload.getStats;
    if (getStats) {
      this.getStats = getStats.enabled;
      this.statsCollectionTime = getStats.statsCollectionTime;
      this.statsCollectionInterval = getStats.statsCollectionInterval;
      this.peerConnections = getStats.peerConnections;
      this.selectedStats = getStats.selectedStats;
    }
    let scenarios = payload.scenarios;
    if (scenarios && scenarios.length > 0 && this.networkInstrumentation) {
      this.scenarios = [];
      for(let i = 0; i < scenarios.length; i++) {
        this.scenarios.push(new Scenario(scenarios[i], this.networkInstrumentation));
      }
    }
  }

  /**
   * Sets the description of the test report
   * @param {String} description 
   */
  setDescription(description) {
    this.report.setDescription(description);
  }

  /**
   * Runs the entire test
   */
  async run() {
    try {
      await this.testScript();
    } catch (e) {
      console.log(e);
    } finally {
      this.report.setStopTimestamp();
      this.reporter.generateReportFiles();
      let value = this.report.getJsonBuilder();
      TestUtils.writeToFile(this.reportPath + '/result.json', JSON.stringify(value));
      if (this.io) {
        this.io.close();
      }
    }
  }

  /**
   * Synchronizes browsers of the same test
   */
  async waitAllSteps() {
    if (this.numberOfParticipant > 1 && this.port) {
      try {
        let waiting = true;
        let i = 0;
        while(waiting && i < this.timeout) {
          if(i==0) {
            this.io.emit("test finished", this.id);
          }
          this.io.on("finished", function() {
            waiting = false;
          });
          i++;
          await TestUtils.waitAround(1000); // waiting 1 sec
        }
        this.io.emit("done", this.id);
        await TestUtils.waitAround(2000);
      } catch (e) {
        console.log(e);
      }
    }
  }

  /**
   * Gets the room
   * @returns {String} The Url with the room
   */
  getRoomUrl(info) {
    if (info.payload && info.payload.rooms && info.payload.usersPerRoom > 0) {
      if (info.numberOfParticipant % info.payload.usersPerRoom !== 0) {
        console.log("/!\\ Total number of participants % userPerRoom must be egal to 0 !");
        console.log("/!\\ That can lead to errors in your tests !");
      }
      info.numberOfParticipant = info.payload.usersPerRoom;
      const roomid = Math.floor(info.id / info.payload.usersPerRoom);
      if (roomid > info.payload.rooms.length) {
        console.error('Not enough rooms');
        return;
      }
      return info.url + info.payload.rooms[roomid];
    }
    return "";
  }
}

module.exports = KiteBaseTest;