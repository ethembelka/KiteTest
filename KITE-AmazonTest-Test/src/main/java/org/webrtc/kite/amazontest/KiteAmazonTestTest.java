package org.webrtc.kite.amazontest;

import org.webrtc.kite.amazontest.checks.MyFirstCheck;
import org.webrtc.kite.amazontest.steps.OpenUrlStep;
import org.webrtc.kite.tests.KiteBaseTest;
import org.webrtc.kite.tests.TestRunner;

public class KiteAmazonTestTest extends KiteBaseTest {

  @Override
  protected void payloadHandling() {
    super.payloadHandling();
    if (this.payload != null) {
      //process payload here
    }
  }

  @Override
  public void populateTestSteps(TestRunner runner) {
    runner.addStep(new OpenUrlStep(runner, url));
    runner.addStep(new MyFirstCheck(runner));
  }

}
