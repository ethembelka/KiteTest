/*
 * Copyright (C) CoSMo Software Consulting Pte. Ltd. - All Rights Reserved
*/

const SSH2Promise = require('ssh2-promise');

const filePath = function(path) {
  let home = process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE;
  return path.includes("~") ? home.split('\\').join('/') + path.replace("~","")
    : path;
}

class SSHManager {
  constructor(keyFilePath, username, hostIpOrName, commandLine) {
    this.keyFilePath = filePath(keyFilePath);
    this.username = username;
    this.hostIpOrName = hostIpOrName;
    this.commandLine = commandLine;
  }

  async call() {
    let sshconfig = {};
    // let sshconfig = {
    //   host: "",
    //   port: 22,
    //   username: "",
    //   identity: "path"
    // }
    // config
    sshconfig.username = this.username;
    sshconfig.identity = this.keyFilePath;
    if (this.hostIpOrName.includes(":")) {
      let tokens = this.hostIpOrName.split(":");
      sshconfig.host = tokens[0];
      sshconfig.port = tokens[1];
    } else {
      sshconfig.host = this.hostIpOrName; 
      // Default port 22
    }
    
    let ssh = new SSH2Promise(sshconfig);
    let data = "";
    try {
      await ssh.connect();
      console.log("Connection established");
      data = await ssh.exec(this.commandLine);
      data = "SUCCEEDED";
    } catch (e) {
      // Sometimes it catches "RTNETLINK answers: File exists" even if the command worked
      e = e.toString();
      console.log(e);
      if (e.includes('RTNETLINK answers: File exists')) {
        data = "SUCCEEDED";
      } else {
        data = "FAILED";
      }
    } finally {
      if (typeof ssh !== "undefined") {
        await ssh.close();
      }
    }
    return data;
  }
}

module.exports = SSHManager;