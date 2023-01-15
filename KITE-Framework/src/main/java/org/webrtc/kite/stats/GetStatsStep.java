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

import static org.webrtc.kite.Utils.getStackTrace;
import static org.webrtc.kite.stats.StatsUtils.buildStatSummary;
import static org.webrtc.kite.stats.StatsUtils.getPCStatOvertime;
import static org.webrtc.kite.stats.StatsUtils.transformToJson;

import io.cosmosoftware.kite.exception.KiteTestException;
import io.cosmosoftware.kite.interfaces.Runner;
import io.cosmosoftware.kite.report.Status;
import io.cosmosoftware.kite.steps.TestStep;
import javax.json.JsonObject;
import org.webrtc.kite.stats.rtc.RTCStatList;
import org.webrtc.kite.stats.rtc.RTCStatMap;

public class GetStatsStep extends TestStep {
  private final JsonObject getStatsConfig;
  private final Runner runner;
  private String customName = "";
  private boolean getRaw = true;
  private boolean keepStats = false;
  private RTCStatMap statMap;
  private int batchId = 0;

  public GetStatsStep(Runner runner, JsonObject getStatsConfig) {
    super(runner);
    this.runner = runner;
    this.getStatsConfig = getStatsConfig;
    this.keepStats = getStatsConfig.getBoolean("keepStats", this.keepStats);
  }

  @Override
  public String stepDescription() {
    return "Getting stats from " + this.getStatsConfig.getJsonArray("peerConnections");
  }

  @Override
  protected void step() throws KiteTestException {
    try {
      RTCStatMap results = getPCStatOvertime(webDriver, getStatsConfig, batchId, runner.getPlatform());
      results.setRegionId(this.runner.getClientRegion());
      results.setNetworkProfile(this.runner.getNetworkProfile());
      if (keepStats) {
        this.statMap = results;
      }
      if (!results.isEmpty()) {
        for (String pc : results.keySet()) {
          if (getRaw) {
            reporter.jsonAttachment(
                this.report,
                customName + "Stats(Raw)_" + pc.replaceAll("\"", ""),
                transformToJson(results.get(pc)));
          }
          reporter.jsonAttachment(this.report, customName + "Stats(Summary)_" + pc.replaceAll("\"", ""), buildStatSummary(
              results.get(pc)));
        }
      }
    } catch (Exception e) {
      throw new KiteTestException("Failed to getStats: " + e.getLocalizedMessage(), Status.BROKEN, e);
    }
  }


  public RTCStatMap getResults() {
    return statMap;
  }

  public void setCustomName(String customName) {
    this.customName = customName;
  }

  public void setGetRaw(boolean getRaw) {
    this.getRaw = getRaw;
  }

  public void setKeepStats(boolean keepStats) {
    this.keepStats = keepStats;
  }

  public void setBatchId(int batchId) { this.batchId = batchId; }
}
