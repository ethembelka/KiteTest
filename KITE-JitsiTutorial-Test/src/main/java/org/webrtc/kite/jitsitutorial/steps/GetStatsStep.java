package org.webrtc.kite.jitsitutorial.steps;

import io.cosmosoftware.kite.exception.KiteTestException;
import io.cosmosoftware.kite.interfaces.Runner;
import io.cosmosoftware.kite.steps.TestStep;
import org.openqa.selenium.JavascriptExecutor;
import org.webrtc.kite.jitsitutorial.pages.MainPage;
import org.webrtc.kite.stats.rtc.RTCStatMap;

import javax.json.JsonObject;
import javax.json.JsonValue;

import static org.webrtc.kite.stats.StatsUtils.getPCStatOvertime;

public class GetStatsStep extends TestStep {

    private final JsonObject getStatsConfig;
    private final MainPage mainPage;

    public GetStatsStep(Runner runner, JsonObject getStatsConfig) {
        super(runner);
        this.getStatsConfig = getStatsConfig;
        this.mainPage = new MainPage(runner);
    }
    @Override
    public String stepDescription() {
        return "Getting Jitsi conference statistics";
    }
    @Override
    protected void step() throws KiteTestException {
        ((JavascriptExecutor) webDriver).executeScript(mainPage.getPeerConnectionScript());
        RTCStatMap rawStats = getPCStatOvertime(webDriver, getStatsConfig, runner.getPlatform());
        reporter.jsonAttachment(report, "getStatsRaw", (JsonValue) rawStats.getLocalPcStats());
    }

}
