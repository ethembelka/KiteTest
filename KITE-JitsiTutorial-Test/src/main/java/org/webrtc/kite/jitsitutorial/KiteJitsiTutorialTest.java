package org.webrtc.kite.jitsitutorial;

import io.cosmosoftware.kite.steps.ScreenshotStep;
import org.webrtc.kite.jitsitutorial.checks.ReceivedVideosCheck;
import org.webrtc.kite.jitsitutorial.checks.SentVideoCheck;
import org.webrtc.kite.jitsitutorial.steps.GetStatsStep;
import org.webrtc.kite.jitsitutorial.steps.OpenUrlStep;
import org.webrtc.kite.tests.KiteBaseTest;
import org.webrtc.kite.tests.TestRunner;

public class KiteJitsiTutorialTest extends KiteBaseTest {

  private String url = "https://google.com";

  @Override
  protected void payloadHandling() {
    super.payloadHandling();
    if (this.payload != null) {
      url = payload.getString("url", url);
    }
  }

  @Override
  public void populateTestSteps(TestRunner runner) {
    try {
      runner.addStep(new OpenUrlStep(runner, getRoomManager().getRoomUrl()));
      runner.addStep(new SentVideoCheck(runner));
      runner.addStep(new ReceivedVideosCheck(runner, getMaxUsersPerRoom()));
      runner.addStep(new ScreenshotStep(runner));
    } catch (Exception e) {
      logger.warn(e);
    }

  }

}
