package org.webrtc.kite.amazontest.pages;

import io.cosmosoftware.kite.pages.BasePage;
import io.cosmosoftware.kite.interfaces.Runner;

import static io.cosmosoftware.kite.util.WebDriverUtils.loadPage;

public class MainPage extends BasePage {
  
  
  public MainPage(Runner runner) {
    super(runner);
  }
  
  public void open(String url) {
    loadPage(url, 20);
  }
  
}
