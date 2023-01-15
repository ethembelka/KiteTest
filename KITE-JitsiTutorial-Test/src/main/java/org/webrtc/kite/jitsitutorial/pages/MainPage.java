package org.webrtc.kite.jitsitutorial.pages;

import io.cosmosoftware.kite.pages.BasePage;
import io.cosmosoftware.kite.interfaces.Runner;
import org.openqa.selenium.TimeoutException;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.support.FindBy;
import org.openqa.selenium.support.ui.ExpectedCondition;
import org.openqa.selenium.support.ui.ExpectedConditions;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.util.List;

import static io.cosmosoftware.kite.util.WebDriverUtils.loadPage;

public class MainPage extends BasePage {

  @FindBy(xpath = "//*[@id=\"new-toolbox\"]/div/div/div/div[7]/div/div")
  private WebElement manyTilesVideoToggle;

  @FindBy(xpath = "//*[@id=\"videoconference_page\"]/div[3]/div[1]/div/div/div[1]/div/div")
  private WebElement joinPage;

  @FindBy(xpath = "//*[@id=\"videoconference_page\"]/div[3]/div[1]/div/div/div[1]/input")
  private WebElement inputName;

  @FindBy(xpath = "//*[@id=\"enter_room_button\"]")
  private WebElement startMeeting;

  @FindBy(tagName = "video")
  private List<WebElement> videos;
  
  public MainPage(Runner runner) {
    super(runner);
  }

  public void open(String url) {
    loadPage(url, 20);
    joinRoom();
  }

  public void joinRoom() {
    //startMeeting.click();
    inputName.sendKeys("Ethem");
    joinPage.click();
  }

  public void clickVideoToggle() {
    manyTilesVideoToggle.click();
  }

  public void vidoIsPublishing(int timeout) throws TimeoutException {
    WebDriverWait wait = new WebDriverWait(webDriver, timeout);
    wait.until(ExpectedConditions.visibilityOf(videos.get(0)));
  }

  public int numberOfVideos() {
    return videos.size();
  }

  public List<WebElement> getVideoElements() {
    return videos;
  }

  public String getPeerConnectionScript() {
    return "window.pc = [];"
            + "map = APP.conference._room.rtc.peerConnections;"
            + "for(var key of map.keys()){"
            + "  window.pc.push(map.get(key).peerconnection);"
            + "}";
  }
  
}
