package org.webrtc.kite.amazontest.steps;

import io.cosmosoftware.kite.exception.KiteTestException;
import io.cosmosoftware.kite.steps.TestStep;
import io.cosmosoftware.kite.interfaces.Runner;
import org.webrtc.kite.amazontest.pages.MainPage;

public class OpenUrlStep extends TestStep {
  
  private final String url;
  private final MainPage mainPage;
  
  
  public OpenUrlStep(Runner runner, String url) {
    super(runner);
    this.url = url;
    this.mainPage = new MainPage(runner);
  }
  
  
  @Override
  public String stepDescription() {
    return "Open " + url;
  }
  
  @Override
  protected void step() throws KiteTestException {
    mainPage.open(url);
  }
}
