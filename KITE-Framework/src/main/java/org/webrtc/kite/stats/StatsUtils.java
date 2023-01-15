/*
 * Copyright 2017 Google Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package org.webrtc.kite.stats;

import com.google.common.reflect.TypeToken;
import com.google.gson.Gson;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.AndroidElement;
import io.appium.java_client.ios.IOSDriver;
import io.appium.java_client.ios.IOSElement;
import io.cosmosoftware.kite.entities.Timeouts;
import io.cosmosoftware.kite.exception.KiteTestException;
import io.cosmosoftware.kite.report.KiteLogger;
import io.cosmosoftware.kite.report.Status;
import io.cosmosoftware.kite.util.WebDriverUtils;
import org.openqa.selenium.JavascriptExecutor;
import org.openqa.selenium.WebDriver;

import javax.json.*;
import java.util.*;
import org.webrtc.kite.stats.rtc.RTCIceCandidatePairStats;
import org.webrtc.kite.stats.rtc.RTCStatList;
import org.webrtc.kite.stats.rtc.RTCStatMap;
import org.webrtc.kite.stats.rtc.RTCStats;
import org.webrtc.kite.stats.rtc.rtpstream.RTCInboundRtpStreamStats;
import org.webrtc.kite.stats.rtc.rtpstream.RTCOutboundRtpStreamStats;
import org.webrtc.kite.stats.rtc.rtpstream.RTCReceivedRtpStreamStats;
import org.webrtc.kite.stats.rtc.rtpstream.RTCRemoteInboundRtpStreamStats;
import org.webrtc.kite.stats.rtc.rtpstream.RTCRtpStreamStats;
import org.webrtc.kite.stats.rtc.rtpstream.RTCSentRtpStreamStats;

import static io.cosmosoftware.kite.entities.Timeouts.ONE_SECOND_INTERVAL;
import static io.cosmosoftware.kite.util.ReportUtils.timestamp;
import static io.cosmosoftware.kite.util.TestUtils.executeJsScript;
import static io.cosmosoftware.kite.util.TestUtils.waitAround;


/**
 * StatsUtils is a Singleton class that collects and save KITE load testing stats into a CSV file.
 */
public class StatsUtils {
  private static final KiteLogger logger = KiteLogger.getLogger(StatsUtils.class.getName());
  

  /**
   * Stashes stats into a global variable and collects them 1s after
   *
   * @param webDriver      used to execute command.
   * @param peerConnection the peer connection
   *
   * @return String. pc stat once
   * @throws KiteTestException the KITE test exception
   */
  public static RTCStats getPCStatOnce(WebDriver webDriver, String peerConnection, int batchId, String platform) throws KiteTestException {
    return getPCStatOnce(webDriver, peerConnection, null, batchId, platform);
  }
  
  /**
   * Stashes stats into a global variable and collects them 1s after
   *
   * @param webDriver      used to execute command.
   * @param peerConnection the peer connection
   * @param selectedStats  array of chosen stats
   *
   * @return String. pc stat once
   * @throws KiteTestException the KITE test exception
   */
  public static RTCStats getPCStatOnce(WebDriver webDriver, String peerConnection, JsonArray selectedStats, int batchId, String platform) throws KiteTestException {
    try {
      RTCStats rtn;
      switch(platform.toLowerCase()) {
        case "android":
          waitAround(300);
          ((AndroidElement) ((AndroidDriver) webDriver).findElementsByClassName("android.widget.EditText").get(0)).click();
          ((AndroidElement) ((AndroidDriver) webDriver).findElementsByClassName("android.widget.EditText").get(0)).sendKeys("JSON.stringify(window.KITEStats)");
          ((AndroidElement) ((AndroidDriver) webDriver).findElementsByClassName("android.view.View").get(10)).findElementsByClassName("android.widget.TextView").get(2).click();

          Gson gson = new Gson();
          List<Map> list = gson.fromJson(((AndroidElement) ((AndroidDriver) webDriver).findElementsByClassName("android.widget.TextView").get(17)).getText(), new TypeToken<ArrayList<Map>>() {}.getType());
          ((AndroidElement) ((AndroidDriver) webDriver).findElementsByClassName("android.widget.EditText").get(0)).click();
          ((AndroidElement) ((AndroidDriver) webDriver).findElementsByClassName("android.widget.EditText").get(0)).sendKeys("const getStatsValues = () => peer.getStats().then(data => {  return [...data.values()];}); const stashStats = async () => {  window.KITEStats = await getStatsValues();  return 0;};stashStats(); clear();");
          ((AndroidElement) ((AndroidDriver) webDriver).findElementsByClassName("android.view.View").get(12)).findElementsByClassName("android.widget.TextView").get(1).click(); // execute
          rtn = new RTCStats(peerConnection,
                  list, selectedStats);
          rtn.setRoomUrl("N/A");

          break;
        case "ios":
          int tries = 0;
          waitAround(300);
          ((IOSDriver) webDriver).findElementByClassName("XCUIElementTypeTextView").click();
          ((IOSDriver) webDriver).findElementByClassName("XCUIElementTypeTextView").sendKeys("JSON.stringify(window.KITEStats)");
          do {
            ((IOSElement) ((IOSDriver) webDriver).findElementsById("Live Viewer").get(0)).click();
            waitAround(200);
            tries++;
          } while (tries<5 && ((IOSDriver) webDriver).isKeyboardShown());

          WebDriverUtils.scroll_ios((IOSDriver) webDriver,0.5, 0.8, 0.5, 0.2);
          waitAround(300);
          ((IOSDriver) webDriver).findElementById("Execute").click();
          waitAround(300);


          gson = new Gson();
           try {
            list = gson.fromJson(((IOSElement) ((IOSDriver) webDriver).findElementsByClassName("XCUIElementTypeStaticText").get(14)).getText(), new TypeToken<ArrayList<Map>>() {
            }.getType());
          } catch(Exception e) {
            list = gson.fromJson(((IOSElement) ((IOSDriver) webDriver).findElementsByClassName("XCUIElementTypeStaticText").get(6)).getText(), new TypeToken<ArrayList<Map>>() {
            }.getType());
          }
          ((IOSDriver) webDriver).findElementByClassName("XCUIElementTypeTextView").click();
          ((IOSDriver) webDriver).findElementByClassName("XCUIElementTypeTextView").sendKeys("const getStatsValues = () => peer.getStats().then(data => {  return [...data.values()];}); const stashStats = async () => {  window.KITEStats = await getStatsValues();  return 0;};stashStats(); clear();"); // write command
          tries = 0;
          do {
            ((IOSElement) ((IOSDriver) webDriver).findElementsById("Live Viewer").get(0)).click();
            waitAround(200);
            tries++;
          } while (tries<5 && ((IOSDriver) webDriver).isKeyboardShown());

          WebDriverUtils.scroll_ios((IOSDriver) webDriver,0.5, 0.8, 0.5, 0.2);
          waitAround(300);
          ((IOSDriver) webDriver).findElementById("Execute").click(); // execute

          try {
            rtn = new RTCStats(peerConnection,
                    list, selectedStats);
            rtn.setRoomUrl("N/A");
          } catch(Exception e) {
            logger.info(e);
            logger.info("Couldn't do stats");
            throw e;
          }
          break;
        default:
          String stashStatsScript = "const getStatsValues = () =>" +
                  peerConnection + "  .getStats()" +
                  "    .then(data => {" +
                  "      return [...data.values()];" +
                  "    });" +
                  "const stashStats = async () => {" +
                  "  window.KITEStats = await getStatsValues();" +
                  "  return 0;" +
                  "};" +
                  "stashStats();";
          String getStashedStatsScript = "return window.KITEStats;";
          executeJsScript(webDriver, stashStatsScript);
          waitAround(Timeouts.ONE_SECOND_INTERVAL);
          rtn = new RTCStats(peerConnection,
                  (List<Map>) executeJsScript(webDriver, getStashedStatsScript), selectedStats);
          rtn.setRoomUrl(webDriver.getCurrentUrl());
          break;
      }

      rtn.setBatch(batchId);
      return rtn;

    } catch (Exception e) {
//      throw new KiteTestException("Could not get stats from peer connection", Status.BROKEN, e);
      // todo: put the e back
      throw new KiteTestException("Could not get stats from peer connection: " + e.getLocalizedMessage(), Status.BROKEN);
    }
  }
  
  /**
   * stat JsonObjectBuilder to add to callback result.
   *
   * @param webDriver              used to execute command.
   * @param getStatsConfig         the getStatsConfig
   *
   * @return JsonObjectBuilder of the stat object
   * @throws KiteTestException the kite test exception
   */
  public static RTCStatMap getPCStatOvertime(WebDriver webDriver, JsonObject getStatsConfig, String platform)
          throws KiteTestException {
    RTCStatMap result = new RTCStatMap();
    for (JsonString pc : getStatsConfig.getJsonArray("peerConnections").getValuesAs(JsonString.class)) {
      result.put(pc.toString(), getPCStatOvertime(
              webDriver,
              pc.getString(),
              getStatsConfig.getInt("statsCollectionTime"),
              getStatsConfig.getInt("statsCollectionInterval"),
              getStatsConfig.getJsonArray("selectedStats"), 0, platform));
    }
    return result;
  }

  public static RTCStatMap getPCStatOvertime(WebDriver webDriver, JsonObject getStatsConfig, int batchId, String platform)
    throws KiteTestException {
    RTCStatMap result = new RTCStatMap();
    for (JsonString pc : getStatsConfig.getJsonArray("peerConnections").getValuesAs(JsonString.class)) {
      result.put(pc.toString(), getPCStatOvertime(
        webDriver,
        pc.getString(),
        getStatsConfig.getInt("statsCollectionTime"),
        getStatsConfig.getInt("statsCollectionInterval"),
        getStatsConfig.getJsonArray("selectedStats"), batchId, platform));
    }
    return result;
  }

  /**
   * Transform list of RTCStats to list of Json Object
   *
   * @param stats list of RTCStats object.
   *
   * @return list of Json Object
   */
  public static JsonObject transformToJson(RTCStatList stats) {
    JsonArrayBuilder arrayBuilder = Json.createArrayBuilder();
    for (RTCStats stat: stats) {
      JsonObject temp = stat.toJson();
      if (!temp.isEmpty()) {
        arrayBuilder.add(stat.toJson());
      }
    }
    JsonObjectBuilder rtn =  Json.createObjectBuilder()
        .add("Connected", !stats.hasNoData())
        .add("Room", stats.getRoomUrl())
        .add("StatsArray", arrayBuilder);

    for (String key : stats.getAdditionalData().keySet()) {
      rtn.add(key, stats.getAdditionalData().get(key));
    }
    return rtn.build();
  }

  /**
   * stat JsonObjectBuilder to add to callback result.
   *
   * @param webDriver              used to execute command.
   * @param peerConnection         the peer connection
   * @param durationInMilliSeconds during which the stats will be collected.
   * @param intervalInMilliSeconds between each time getStats gets called.
   *
   * @return JsonObjectBuilder of the stat object
   * @throws KiteTestException the kite test exception
   */
  public static RTCStatList getPCStatOvertime(WebDriver webDriver, String peerConnection, int durationInMilliSeconds, int intervalInMilliSeconds, String platform)
      throws KiteTestException {
    return getPCStatOvertime(webDriver, peerConnection, durationInMilliSeconds, intervalInMilliSeconds, null, 0, platform);
  }

  /**
   * stat JsonObjectBuilder to add to callback result.
   *
   * @param webDriver              used to execute command.
   * @param peerConnection         the peer connection
   * @param durationInMilliSeconds during which the stats will be collected.
   * @param intervalInMilliSeconds between each time getStats gets called.
   * @param selectedStats          list of selected stats.
   *
   * @return JsonObjectBuilder of the stat object
   * @throws KiteTestException the kite test exception
   */
  public static RTCStatList getPCStatOvertime(WebDriver webDriver, String peerConnection, int durationInMilliSeconds, int intervalInMilliSeconds, JsonArray selectedStats, int batchId, String platform)
    throws KiteTestException {
    RTCStatList statsOverTime = new RTCStatList();
    switch(platform.toLowerCase()){
      case "android":
      case "ios":
        int threadTime;
        for (int timer = 0; timer <= durationInMilliSeconds; timer += threadTime) {
          long start = System.currentTimeMillis();
          statsOverTime.add(getPCStatOnce(webDriver, peerConnection, selectedStats, batchId, platform));
          threadTime = (int) (System.currentTimeMillis() - start);
          if (threadTime < intervalInMilliSeconds) {
            waitAround(Math.abs((intervalInMilliSeconds - threadTime) - ONE_SECOND_INTERVAL));
            threadTime = intervalInMilliSeconds;
          }
        }
        break;
      default:
        for (int timer = 0; timer <= durationInMilliSeconds; timer += intervalInMilliSeconds) {
          statsOverTime.add(getPCStatOnce(webDriver, peerConnection, selectedStats, batchId, platform));
          if (timer <= durationInMilliSeconds - intervalInMilliSeconds) {
            waitAround(Math.abs(intervalInMilliSeconds - ONE_SECOND_INTERVAL));
          }
        }
        break;
    }

    return statsOverTime;
  }
  
  /**
   * Execute and return the requested SDP message
   *
   * @param webDriver      used to execute command.
   * @param peerConnection the peer connection
   * @param type           offer or answer.
   *
   * @return SDP object.
   * @throws KiteTestException the kite test exception
   */
  public static Object getSDPMessage(WebDriver webDriver, String peerConnection, String type) throws KiteTestException {
    return ((JavascriptExecutor) webDriver).executeScript(getSDPMessageScript(peerConnection, type));
  }
  
  /**
   * Returns the test's getSDPMessageScript to retrieve the sdp message for either the offer or answer.
   * If it doesn't exist then the method returns 'unknown'.
   *
   * @return the getSDPMessageScript as string.
   */
  private static String getSDPMessageScript(String peerConnection, String type) throws KiteTestException {
    switch (type) {
      case "offer":
        return "var SDP;"
          + "try {SDP = " + peerConnection + ".remoteDescription;} catch (exception) {} "
          + "if (SDP) {return SDP;} else {return 'unknown';}";
      case "answer":
        return "var SDP;"
          + "try {SDP = " + peerConnection + ".localDescription;} catch (exception) {} "
          + "if (SDP) {return SDP;} else {return 'unknown';}";
      default:
        throw new KiteTestException("Not a valid type for sdp message.", Status.BROKEN);
    }
  }
  
  public static JsonObject buildStatSummary(RTCStatMap statMap) {
    return buildStatSummary(statMap, false);
  }
  
  public static JsonObject buildStatSummary(RTCStatMap statMap, boolean fullyDetailed) {
    JsonObjectBuilder builder = Json.createObjectBuilder();
    for (String pcName: statMap.keySet()) {
      String key = pcName.toLowerCase().startsWith("windows.") ? pcName.substring(8) : pcName;
      builder.add(key, buildStatSummary(statMap.get(pcName), fullyDetailed));
    }
    return builder.build();
  }
  
  /**
   *
   * @param statArray     array of stats provided from getStats()
   * @return  the stat summary : (see below)
   */
  public static JsonObject buildStatSummary(RTCStatList statArray) {
    return buildStatSummary(statArray, false);
  }

  /**
   * @param statArray     array of stats provided from getStats()
   * @param fullyDetailed true if the detailed arrays of specific stat values are to be added to the summary
   *
   * @return  the stat summary : (Sample stats on Chrome 74)
   *     "Starting Timestamp": "2019-06-28 162729",
   *     "Ending Timestamp": "2019-06-28 162740",
   *     "Total Inbound Bytes Received (Bytes)": 642114,
   *     "Total Inbound Audio Bytes Received (Bytes)": 114190,
   *     "Total Inbound Video Bytes Received (Bytes)": 527924,
   *     "Total Outbound Bytes Sent (Bytes)": 644136,
   *     "Total Outbound Audio Bytes Sent (Bytes)": 114371,
   *     "Total Outbound Video Bytes Sent (Bytes)": 529765,
   *     "Total Round Trip Time (ms)": 0.0,
   *     "Average Current Round Trip Time (ms)": 0.0,
   *     "inbound": {
   *             "audio": [
   *             {
   *                 "streamId": "RTCInboundRTPAudioStream_3333556480",
   *                 "Total Bytes Received (Bytes)": "34997",
   *                 "Average Received Bitrate (kbps)": "3071",
   *                 "Total Packets Received": "585",
   *                 "Average Audio Level (dB)": "0",
   *                 "Total Packets Lost": 0,
   *                 "Packets Lost (%)": "0",
   *                 "Packets Discarded (%)": "0",
   *                 "Average Audio Jitter (ms)": "0"
   *             }
   *         ],
   *         "video": [
   *             {
   *                 "streamId": "RTCInboundRTPVideoStream_3131213379",
   *                 "Total Bytes Received (Bytes)": "1031833",
   *                 "Average Received Bitrate (kbps)": "95078",
   *                 "Total Packets Received": "1006",
   *                 "Frames Received": "234",
   *                 "Average Frame Rate (fps)": "0",
   *                 "Total Packets Lost": 0,
   *                 "Packets Lost (%)": "0",
   *                 "Packets Discarded (%)": "0"
   *             }
   *         ]
   *     },
   *     "outbound": {
   *         "audio": [ same as inbound stats ],
   *         "video": [ same as inbound stats ]
   *     }
   */
  public static JsonObject buildStatSummary(RTCStatList statArray, boolean fullyDetailed) {
  
    JsonObjectBuilder builder = Json.createObjectBuilder();
    double totalRTT = 0;
    double agvRTT = 0;
    List<List<RTCRtpStreamStats>> inboundStreamStatsList = new ArrayList<>();
    List<List<RTCRtpStreamStats>> outboundStreamStatsList = new ArrayList<>();
    builder.add("Starting Timestamp", timestamp(statArray.get(0).getTimestamp()));
    builder.add("Ending Timestamp", timestamp(statArray.get(statArray.size() - 1).getTimestamp()));
    builder.add("Connected", !statArray.hasNoData());
    builder.add("Room", statArray.getRoomUrl());
    builder.add("Batch", statArray.getBatchId());

    for (String key : statArray.getAdditionalData().keySet()) {
      builder.add(key, statArray.getAdditionalData().get(key));
    }

    RTCStats lastRtcStats = statArray.get(statArray.size() -1);
    if (lastRtcStats.get("remote-candidate") != null) {
      builder.add(StatEnum.REMOTE_IP.toString(), lastRtcStats.getRemoteIP());
    }
    if (lastRtcStats.get("inbound-rtp") != null) {
//      builder
//        .add(StatEnum.TOTAL_INBOUND_BYTES_RECEIVED.toString(), lastRtcStats.getTotalBytesByMedia("inbound"))
//        .add(StatEnum.TOTAL_INBOUND_AUDIO_BYTES_RECEIVED.toString(), lastRtcStats.getTotalBytesByMedia("inbound", "audio"))
//        .add(StatEnum.TOTAL_INBOUND_VIDEO_BYTES_RECEIVED.toString(), lastRtcStats.getTotalBytesByMedia("inbound", "video"));
    }
    if (lastRtcStats.get("outbound-rtp") != null) {
//      builder
//        .add(StatEnum.TOTAL_OUTBOUND_BYTES_SENT.toString(), lastRtcStats.getTotalBytesByMedia("outbound"))
//        .add(StatEnum.TOTAL_OUTBOUND_AUDIO_BYTES_SENT.toString(), lastRtcStats.getTotalBytesByMedia("outbound", "audio"))
//        .add(StatEnum.TOTAL_OUTBOUND_VIDEO_BYTES_SENT.toString(), lastRtcStats.getTotalBytesByMedia("outbound", "video"));
    }
    
    for (int index = 0; index < statArray.size(); index++) {
      RTCStats rtcStats = statArray.get(index);
      if (!rtcStats.getSuccessfulCandidate().isEmpty()) {
        RTCIceCandidatePairStats candidatePairStats = (RTCIceCandidatePairStats) rtcStats.getSuccessfulCandidate();
        totalRTT += candidatePairStats.getTotalRoundTripTime();
        agvRTT = (agvRTT + candidatePairStats.getCurrentRoundTripTime()) / (index + 1);
      }
      
      inboundStreamStatsList.add(rtcStats.getStreamsStats("inbound"));
      outboundStreamStatsList.add(rtcStats.getStreamsStats("outbound"));
    }
    
    builder
//      .add(StatEnum.TOTAL_RTT.toString(), totalRTT)
      .add(StatEnum.AVG_CURRENT_RTT.toString(), agvRTT);
    if (lastRtcStats.get("inbound-rtp") != null) {
      builder.add("inbound", processStreamStats(inboundStreamStatsList, fullyDetailed));
    }
    if (lastRtcStats.get("outbound-rtp") != null) {
      builder
        .add("outbound", processStreamStats(outboundStreamStatsList, fullyDetailed));
    }
    
    return builder.build();
  }
  
  
  private static JsonObject processStreamStats(List<List<RTCRtpStreamStats>> streamStatsList, boolean fullyDetailed) {
    JsonObjectBuilder builder = Json.createObjectBuilder();
    Map<String, List<RTCRtpStreamStats>> audioStreamMap = new HashMap<>();
    Map<String, List<RTCRtpStreamStats>> videoStreamMap = new HashMap<>();
    
    for (List<RTCRtpStreamStats> streamStatsArray : streamStatsList) {
      for (RTCRtpStreamStats streamStats : streamStatsArray) {
        String streamId = streamStats.getId();
        if (streamStats.getKind().equals("audio")) {
          if (!audioStreamMap.keySet().contains(streamId)) {
            audioStreamMap.put(streamId, new ArrayList<>());
          }
          audioStreamMap.get(streamId).add(streamStats);
        } else {
          if (!videoStreamMap.keySet().contains(streamId)) {
            videoStreamMap.put(streamId, new ArrayList<>());
          }
          videoStreamMap.get(streamId).add(streamStats);
        }
      }
    }
    
    builder.add("audio", transformStreamStatToJson(audioStreamMap, fullyDetailed));
    builder.add("video", transformStreamStatToJson(videoStreamMap, fullyDetailed));
    return builder.build();
  }
  
  private static JsonArray transformStreamStatToJson(Map<String, List<RTCRtpStreamStats>> streamStatMap, boolean fullyDetailed) {
    JsonArrayBuilder arrayBuilder = Json.createArrayBuilder();
    
    for (String streamId : streamStatMap.keySet()) {
      List<RTCRtpStreamStats> streamStatsList = streamStatMap.get(streamId);
      
      boolean inbound = streamStatsList.get(0) instanceof RTCReceivedRtpStreamStats;
      boolean audio = streamStatsList.get(0).getKind().equals("audio");
      boolean video = !audio;
      int size = streamStatsList.size();
      int last = size -1;
      long duration = streamStatsList.get(last).getTimestamp() - streamStatsList.get(0).getTimestamp();
     
      JsonObjectBuilder objectBuilder = Json.createObjectBuilder();
      objectBuilder.add("streamId", streamId);
      
      List<Double> bytes = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.BYTES, fullyDetailed);
//      objectBuilder.add(inbound
//          ? StatEnum.TOTAL_BYTES_RECEIVED.toString()
//          : StatEnum.TOTAL_BYTES_SENT.toString()
//        , checkNegativeValue(bytes.get(last)));

      objectBuilder.add(inbound
          ? StatEnum.RECEIVED_BITRATE.toString()
          : StatEnum.SENT_BITRATE.toString()
        , checkNegativeValue(8 * getDiffEndToStart(bytes)/duration));
  
      List<Double> packets = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.PACKETS, fullyDetailed);
      
      Double packetsReceivedDiff = getDiffEndToStart(packets);
      

      if (video) {
        List<Double> frames = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.FRAME, fullyDetailed);
        objectBuilder.add(inbound
          ? StatEnum.TOTAL_FRAME_RECEIVED.toString()
          : StatEnum.TOTAL_FRAME_SENT.toString(), checkNegativeValue(frames.get(last)));
//        System.out.println((inbound ? "inbound" : "outbound") + "\n" + frames );
        List<Double> framerate = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.FRAME_RATE, fullyDetailed);

        objectBuilder.add(StatEnum.AVG_FRAME_RATE.toString(),  checkNegativeValue(1000 * getDiffEndToStart(frames)/duration));
      }
      
      if (inbound) {
        if (audio) {
          List<Double> audioLvl = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.AUDIO_LEVEL, fullyDetailed);
          objectBuilder.add(StatEnum.AVG_AUDIO_LEVEL.toString(), checkNegativeValue(getAverage(audioLvl)));
        }
        List<Double> packetsLost = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.PACKETS_LOST, fullyDetailed);
        objectBuilder.add(StatEnum.TOTAL_PACKETS_LOST.toString(), "" + packetsLost.get(last).intValue());
        Double packetsLostDiff = getDiffEndToStart(packetsLost);
        objectBuilder.add(StatEnum.PACKETS_LOST_PERCENTAGE.toString(), 
          checkNegativeValue((100 * packetsLostDiff/ (packetsLostDiff + packetsReceivedDiff))) + "%");
//        objectBuilder.add(StatEnum.PACKETS_LOST_CUMULATIVE_PERCENTAGE.toString(),
//          checkNegativeValue(100 * packetsLost.get(last)/ (packetsLost.get(last) + packets.get(last))));
        
        
        
//        List<Double> packetsDiscarded = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.PACKETS_DISCARDED, fullyDetailed);
//        Double packetsDiscardedDiff = getDiffEndToStart(packets);
//        objectBuilder.add(StatEnum.TOTAL_PACKETS_DISCARDED.toString(), packetsDiscarded.get(last).intValue());
//        objectBuilder.add(StatEnum.PACKETS_DISCARDED_PERCENTAGE.toString(),
//          checkNegativeValue(100 * packetsDiscardedDiff/ (packetsDiscardedDiff + packetsReceivedDiff)));
  
  
        if (audio) {
          List<Double> jitter = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.JITTER, fullyDetailed);
          objectBuilder.add(StatEnum.AVG_JITTER.toString(), checkNegativeValue(getAverage(jitter)/1000));
//          objectBuilder.add(StatEnum.AVG_JITTER.toString(), checkNegativeValue(jitter.get(last)));

        } else {
          List<Double> framerate = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.FRAME_RATE, fullyDetailed);
//          objectBuilder.add(StatEnum.AVG_FRAME_RATE.toString(),  checkNegativeValue(1000 * getDiffEndToStart(framerate)/duration));
//          objectBuilder.add(StatEnum.AVG_FRAME_RATE_DECODED.toString(),  checkNegativeValue(1000 * getDiffEndToStart(framerate)/duration));

          // could be useful someday
          List<Double> framedropped = addStatToJsonBuilder(objectBuilder, streamStatsList, StatEnum.FRAME_DROPPED, fullyDetailed);
          
        }
      }
      arrayBuilder.add(objectBuilder);
    }
    return arrayBuilder.build();
  }
  
  private static List<Double> addStatToJsonBuilder(JsonObjectBuilder objectBuilder, List<RTCRtpStreamStats> streams, StatEnum stat, boolean fullyDetailed) {
    List<Double> temp = extractStreamTrackStat(streams, stat);
    if (fullyDetailed) {
      objectBuilder.add(stat.toString(), toJsonArray(temp));
    }
    return temp;
  }
  
  private static JsonArray toJsonArray(List<Double> values) {
    JsonArrayBuilder builder = Json.createArrayBuilder();
    for (double value: values) {
      if (value < 0) {
        builder.add(checkNegativeValue(value));
      } else {
        if (value > (int) value) {
          builder.add(value);
        } else {
          builder.add((int) value);
        }
      }
    }
    return builder.build();
  }
  
  private static List<Double> extractStreamTrackStat(List<RTCRtpStreamStats> streams, StatEnum stat) {
    List<Double> result = new ArrayList<>();
    for (RTCRtpStreamStats stream : streams) {
      switch (stat) {
        case RECEIVED_BITRATE:
        case SENT_BITRATE:
        case BYTES:
          if (stream instanceof RTCReceivedRtpStreamStats) {
            result.add(((RTCReceivedRtpStreamStats)stream).getBytesReceived());
          } else {
            if (stream instanceof RTCSentRtpStreamStats) {
              result.add(((RTCSentRtpStreamStats) stream).getBytesSent());
            }
          }
          break;
        case PACKETS:
          if (stream instanceof RTCInboundRtpStreamStats) {
            result.add(((RTCInboundRtpStreamStats)stream).getPacketsReceived());
          } else {
            result.add(((RTCSentRtpStreamStats)stream).getPacketsSent());
          }
          break;
        case PACKETS_LOST:
        case AVG_PACKETS_LOST:
          result.add(((RTCReceivedRtpStreamStats)stream).getPacketsLost());
          break;
        case PACKETS_DISCARDED:
          result.add(((RTCReceivedRtpStreamStats)stream).getPacketsDiscarded());
          break;
        case JITTER:
        case AVG_JITTER:
          if (stream.getKind().equals("audio") && stream instanceof RTCInboundRtpStreamStats) {
            result.add(((RTCReceivedRtpStreamStats)stream).getJitter());
          }
          break;
        case AUDIO_LEVEL:
        case AVG_AUDIO_LEVEL:
          if (stream.getKind().equals("audio")) {
            if (stream instanceof RTCInboundRtpStreamStats) {
              result.add(((RTCInboundRtpStreamStats)stream).getAudioLevel());
            }
          }
          break;
        case FRAME:
        case TOTAL_FRAME_RECEIVED:
        case TOTAL_FRAME_SENT:
          if (stream.getKind().equals("video")) {
            if (stream instanceof RTCInboundRtpStreamStats) {
              result.add(((RTCInboundRtpStreamStats)stream).getFramesReceived() == -1
                  ? ((RTCInboundRtpStreamStats)stream).getFramesDecoded()
                  : ((RTCInboundRtpStreamStats)stream).getFramesReceived());
            } else {
              result.add(((RTCOutboundRtpStreamStats)stream).getFramesSent() == -1
                  ? ((RTCOutboundRtpStreamStats)stream).getFramesEncoded()
                  : ((RTCOutboundRtpStreamStats)stream).getFramesSent());
            }
          }
          break;
        case FRAME_RATE:
          if (stream.getKind().equals("video")) {
            //            todo
            if (stream instanceof RTCOutboundRtpStreamStats) {
              result.add(((RTCOutboundRtpStreamStats) stream).getFramesPerSecond());
            }
          }
          break;
//        case AVG_FRAME_RATE_DECODED:
        case FRAME_DECODED:
          if (stream.getKind().equals("video")) {
            //            todo
            if (stream instanceof RTCInboundRtpStreamStats) {
              result.add(((RTCInboundRtpStreamStats)stream).getFramesDecoded());
            }
          }
          break;
        case FRAME_DROPPED:
          if (stream.getKind().equals("video")) {
            result.add(((RTCInboundRtpStreamStats)stream).getFramesDropped());
          }
          break;
          // not applicable
//        case FRAME_CORRUPTED:
//          if (stream.isVideo()) {
//            result.add(stream.getTrack() == null ? -1.0 : stream.getTrack().getFramesCorrupted());
//          }
//          break;
        default:
          logger.error("Wrong place to look for :" + stat.toString());
          break;
      }
    }
    if (result.isEmpty()) {
      logger.debug("There seems to be no values available for " + stat + ". " +
        "Please verify that you're trying to extract from the right streams/tracks (inbound/outbound and/or audio/video)");
    }
    if (containOnly(result, -1.0)) {
      logger.debug("There seems to be no track available for " + stat + ". " +
        "Please verify that the media track stats are included in the provided stats.");
    }

    return result;
  }
  
  private static double getDiffEndToStart(List<Double> values) {
    if (values.isEmpty()) {
      return 0;
    }
    if (values.size() > 1) {
      return values.get(values.size() - 1) - values.get(0);
    } else {
      return values.get(0);
    }
  }
  
  private static double getAverage(List<Double> values) {
    double sum = 0;
    for (Double value: values) {
      sum += value;
    }
    return sum/values.size();
  }
  
  private static boolean containOnly(List objectList, Object object) {
    Set objectSet = new HashSet(objectList);
    if (objectSet.size() == 1 && objectSet.contains(object)) {
      return true;
    }
    return false;
  }
  
  private static String checkNegativeValue(double value) {
    if (value < 0) {
      return "NA (" + value + ")";
    }
    String s = value + "";
    if (s.endsWith(".0")) {
      s = s.substring(0, s.length() - 2);
    }
    return (int)value + "";
  }
}
