/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.webrtc.kite.apprtc.checks;

import io.cosmosoftware.kite.exception.KiteTestException;
import io.cosmosoftware.kite.interfaces.Runner;
import io.cosmosoftware.kite.report.Status;
import io.cosmosoftware.kite.steps.TestCheck;
import org.webrtc.kite.apprtc.pages.AppRTCMeetingPage;

public class RemoteVideoDisplayCheck extends TestCheck {
  protected AppRTCMeetingPage appRTCMeetingPage;

  public RemoteVideoDisplayCheck(Runner runner) {
    super(runner);
    appRTCMeetingPage = new AppRTCMeetingPage(runner);
  }
  
  @Override
  public String stepDescription() {
    return "Verify that the remote video is actually playing";
  }
  
  @Override
  protected void step() throws KiteTestException {
    logger.info("Looking for video object");
    String videoCheck = appRTCMeetingPage.remoteVideoCheck();
    if (!"video".equalsIgnoreCase(videoCheck)) {
      reporter.textAttachment(report, "Remote Video", videoCheck, "plain");
      throw new KiteTestException("The first video is " + videoCheck, Status.FAILED);
    }
  }
}
