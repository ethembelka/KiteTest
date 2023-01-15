package org.webrtc.kite.example.checks;

import io.cosmosoftware.kite.exception.KiteTestException;
import io.cosmosoftware.kite.interfaces.Runner;
import io.cosmosoftware.kite.report.Status;
import io.cosmosoftware.kite.steps.TestCheck;
import org.webrtc.kite.example.pages.GoogleResultPage;

import static io.cosmosoftware.kite.entities.Timeouts.ONE_SECOND_INTERVAL;
import static io.cosmosoftware.kite.util.ReportUtils.saveScreenshotPNG;
import static io.cosmosoftware.kite.util.TestUtils.waitAround;

public class GoogleFirstResultCheck extends TestCheck {
  private final String EXPECTED_RESULT = "CoSMo Software - Cosmo Software";
  private final GoogleResultPage resultPage;
  
  public GoogleFirstResultCheck(Runner runner) {
    super(runner);
    this.resultPage = new GoogleResultPage(runner);
  }
  
  @Override
  protected void step() throws KiteTestException {
    resultPage.openFirstResult();
    String found = resultPage.getTitle().trim();
    if (!found.equalsIgnoreCase(EXPECTED_RESULT)) {
      throw new KiteTestException("The title of the first Google result was not correct: \n" +
        "Expected: " + EXPECTED_RESULT + " but found " + found, Status.FAILED);
    }
    reporter.screenshotAttachment(report, saveScreenshotPNG(webDriver));
    for (int i = 0; i < 10; i++) {
      waitAround(ONE_SECOND_INTERVAL);
      logger.info("Staying in page: " + i + "s");
      webDriver.getTitle();
    }
  }
  
  @Override
  public String stepDescription() {
    return "Open first result on Google result page and verify the page title";
  }
}
