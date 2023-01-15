package org.webrtc.kite.denemetest;

import org.webrtc.kite.denemetest.checks.MyFirstCheck;
import org.webrtc.kite.denemetest.steps.OpenUrlStep;
import org.webrtc.kite.tests.KiteBaseTest;
import org.webrtc.kite.tests.TestRunner;

public class KiteDenemeTestTest extends KiteBaseTest {

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
