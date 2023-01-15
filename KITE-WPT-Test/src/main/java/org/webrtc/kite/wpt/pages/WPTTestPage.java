package org.webrtc.kite.wpt.pages;

import static io.cosmosoftware.kite.entities.Timeouts.EXTENDED_TIMEOUT;
import static io.cosmosoftware.kite.entities.Timeouts.HALF_SECOND_INTERVAL;
import static io.cosmosoftware.kite.util.TestUtils.waitAround;
import static io.cosmosoftware.kite.util.WebDriverUtils.setImplicitWait;

import io.cosmosoftware.kite.exception.KiteTestException;
import io.cosmosoftware.kite.interfaces.Runner;
import io.cosmosoftware.kite.pages.BasePage;
import io.cosmosoftware.kite.report.Status;
import java.util.List;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriverException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.webrtc.kite.tests.InitClientWebDriverStep;
import org.webrtc.kite.tests.TestRunner;
import org.webrtc.kite.wpt.Result;
import org.webrtc.kite.wpt.SubTest;

public class WPTTestPage extends BasePage {

  private Result resultReport;
  @FindBy(className = "instructions")
  WebElement description;

  @FindBy(id = "results")
  WebElement result;

  @FindBy(tagName = "tr")
  List<WebElement> resultLines;

  @FindBy(id = "summary")
  WebElement summary;
  // private final WebDriverWait driverWait;
  private String pageUrl;
  private int retry = 0;
  private long start;

  public WPTTestPage(Runner runner) {
    super(runner);
    setImplicitWait(webDriver, EXTENDED_TIMEOUT);
  }

  public void setPageUrl(String pageUrl) {
    this.pageUrl = pageUrl;
    this.resultReport = new Result(pageUrl);
  }

  public void fillResultReport() {
      String status = getStatus();
      resultReport.setStatus(status.replace("Harness status: ", ""));
      for (int indexResult = 1; indexResult < resultLines.size(); indexResult++) {
        WebElement resultLine = resultLines.get(indexResult);
        logger.info("Going through result: " + indexResult + "/" + (resultLines.size() - 1));
        resultReport.add(getSubTestResult(resultLine));
      }
      long end = System.currentTimeMillis();
      resultReport.setDuration(end - start);
  }

  public Result getResultReport() {
    return resultReport;
  }

  public String getStatus() {
    return summary.findElement(By.tagName("p")).getText();
  }

  /**
   * Get the sub test result from the web element
   *
   * @param resultLine the web element containing the result
   * @return the SubTest object.
   */
  private SubTest getSubTestResult(WebElement resultLine) {
    SubTest subTest = new SubTest();
    List<WebElement> cells = resultLine.findElements(By.tagName("td"));
    for (int indexCell = 0; indexCell < cells.size(); indexCell++) {
      String value = cells.get(indexCell).getText();
      switch (indexCell) {
        case 0:
          { // contains the result value
            subTest.setActualResult(value.toUpperCase());
            break;
          }
        case 1:
          { // contains the name of the sub test
            subTest.setName(value);
            break;
          }
        case 2:
          { // contains the error message (if exists)
            value = value.split("\n")[0];
            subTest.setMessage(value);
            break;
          }
      }
    }
    return subTest;
  }

  public void runTest() throws KiteTestException {
    this.start = System.currentTimeMillis();
    try {
      this.loadPage(this.pageUrl, EXTENDED_TIMEOUT);
    } catch (Exception e) {
      if (retry < 4) {
        retry++;
        logger.warn("Failed to load page, trying again at: " + pageUrl);
        waitAround(HALF_SECOND_INTERVAL);
        runTest();
      } else {
        logger.error("Could not load the page after " + retry + " tries");
        throw new KiteTestException("Could not load the page properly", Status.BROKEN, e);
      }
    }
  }

}
