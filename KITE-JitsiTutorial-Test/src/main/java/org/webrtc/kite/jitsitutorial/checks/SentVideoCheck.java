package org.webrtc.kite.jitsitutorial.checks;

import io.cosmosoftware.kite.exception.KiteTestException;
import io.cosmosoftware.kite.interfaces.Runner;
import io.cosmosoftware.kite.report.Status;
import io.cosmosoftware.kite.steps.TestStep;
import org.openqa.selenium.WebElement;
import org.webrtc.kite.jitsitutorial.pages.MainPage;

import java.util.List;

import static io.cosmosoftware.kite.util.TestUtils.videoCheck;

public class SentVideoCheck extends TestStep {

    private final MainPage meetingPage;

    public SentVideoCheck(Runner runner) {
        super(runner);
        meetingPage = new MainPage(runner);
    }

    @Override
    public String stepDescription() {
        return "Checking if Sent Video is playing properly";
    }

    @Override
    protected void step() throws KiteTestException {
        try {
            meetingPage.vidoIsPublishing(20);
            logger.info("Looking for video object.");
            List<WebElement> videos = meetingPage.getVideoElements();
            if(videos.isEmpty()) {
                throw new KiteTestException(
                        "Unable to find any <video> element on the page", Status.FAILED
                );
            }
            String videoCheck = videoCheck(webDriver, 0);
            if(!"video".equalsIgnoreCase(videoCheck)) {
                reporter.textAttachment(report, "Sent Video", videoCheck, "plain");
                throw new KiteTestException("The first video is " + videoCheck, Status.FAILED);
            }
        } catch (KiteTestException e) {
            throw e;
        } catch (Exception e) {
            throw new KiteTestException("Error looking for the video", Status.BROKEN, e);
        }
    }

}
