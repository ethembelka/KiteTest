package org.webrtc.kite.jitsitutorial.checks;

import io.cosmosoftware.kite.exception.KiteTestException;
import io.cosmosoftware.kite.interfaces.Runner;
import io.cosmosoftware.kite.report.Status;
import io.cosmosoftware.kite.steps.TestStep;
import org.webrtc.kite.jitsitutorial.pages.MainPage;

import static io.cosmosoftware.kite.entities.Timeouts.ONE_SECOND_INTERVAL;
import static io.cosmosoftware.kite.util.TestUtils.videoCheck;
import static io.cosmosoftware.kite.util.TestUtils.waitAround;

public class ReceivedVideosCheck extends TestStep {

    private final int numberOfParticipants;
    private final MainPage meetingPage;

    public ReceivedVideosCheck(Runner runner ,int numberOfParticipants) {
        super(runner);
        this.numberOfParticipants = numberOfParticipants;
        this.meetingPage = new MainPage(runner);
    }

    @Override
    public String stepDescription() {
        return "Check the other videos are being received OK";
    }

    @Override
    protected void step() throws KiteTestException {
        try {
            waitAround(numberOfParticipants * 3 * ONE_SECOND_INTERVAL);
            meetingPage.clickVideoToggle();
            logger.info("Looking for video elements");
            if(meetingPage.numberOfVideos() < numberOfParticipants) {
                throw new KiteTestException("Unable to find "
                        + numberOfParticipants
                        + " <video> element on the page. No video found = "
                        + meetingPage.numberOfVideos(), Status.FAILED);
            }
            String videoCheck = "";
            boolean error = false;
            for (int i = 1; i < numberOfParticipants; i++) {
                String v = videoCheck(webDriver, i);
                videoCheck += v;
                if(i < numberOfParticipants - 1) {
                    videoCheck += "|";
                }
                if(!"video".equalsIgnoreCase(v)) {
                    error = true;
                }
            }
            if(error) {
                reporter.textAttachment(report, "Received Videos", videoCheck, "plain");
                throw new KiteTestException("Some videos are still or blank: " + videoCheck, Status.FAILED);
            }
        } catch (KiteTestException e) {
            throw e;
        } catch (Exception e) {
            throw new KiteTestException("Error looking for the video", Status.BROKEN, e);
        }
    }

}
