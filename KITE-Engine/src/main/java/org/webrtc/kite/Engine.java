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

package org.webrtc.kite;

import static io.cosmosoftware.kite.entities.Timeouts.ONE_SECOND_INTERVAL;
import static io.cosmosoftware.kite.util.TestUtils.waitAround;
import static org.webrtc.kite.Utils.shutdown;

import io.cosmosoftware.kite.instrumentation.NetworkProfile;
import io.cosmosoftware.kite.util.CircularLinkedList;
import java.io.File;
import java.io.FileNotFoundException;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Date;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import javax.json.JsonException;

import io.cosmosoftware.kite.util.ReportUtils;
import org.webrtc.kite.config.Configurator;
import org.webrtc.kite.config.client.Client;
import org.webrtc.kite.config.paas.Paas;
import org.webrtc.kite.config.test.TestConfig;
import org.webrtc.kite.config.test.Tuple;
import org.webrtc.kite.exception.KiteBadValueException;
import org.webrtc.kite.exception.KiteGridException;
import org.webrtc.kite.exception.KiteInsufficientValueException;
import org.webrtc.kite.exception.KiteNoKeyException;
import io.cosmosoftware.kite.report.KiteLogger;

/**
 * Entry point of the program.
 */
public class Engine {

  /** The run thread. */
//  public static TestRunThread runThread;
  public static List<TestRunThread> testRunThreads = new ArrayList<>();
  private static final int IDEAL_TUPLE_SIZE = 20;

  static {
    SimpleDateFormat dateFormat = new SimpleDateFormat("yyyy-MM-dd HHmmss");
    System.setProperty("current.date", dateFormat.format(new Date()));
  }

  /** The Constant logger. */
  private static final KiteLogger logger = KiteLogger.getLogger(Engine.class.getName());

  /**
   * Builds the config.
   *
   * @param configurator the configurator
   * @param pathToConfigFile the path to config file
   */
  public static void buildConfig(Configurator configurator, String pathToConfigFile) {
    try {
      configurator.setConfigFilePath(pathToConfigFile);
      configurator.buildConfig();
      configurator.setTimeStamp();
    } catch (FileNotFoundException e) {
      logger.fatal("Error [File Not Found]: '" + pathToConfigFile
          + "' either doesn't exist or is not a file.", e);
    } catch (JsonException | IllegalStateException e) {
      logger.fatal("Error [Config Parsing]: Unable to parse the provided configuration "
          + "file with the following error: " + e.getLocalizedMessage(), e);
    } catch (KiteNoKeyException e) {
      logger.fatal("Error [Config Parsing]: '" + e.getKey()
          + "' is not found in the configuration file or is null.", e);
    } catch (KiteBadValueException e) {
      logger.fatal("Error [Config Parsing]: '" + e.getKey()
          + "' has an inappropriate value in the configuration file.", e);
    } catch (KiteInsufficientValueException e) {
      logger.fatal("Error [Config Parsing]: " + e.getLocalizedMessage(), e);
    } catch (Exception e) {
      logger.fatal("FATAL Error: KITE has failed to start execution", e);
    }
  }

  /**
   * Distribute remote.
   *
   * @param configurator the configurator
   * @param tupleList the tuple list
   */
  public static void distributeRemote(Configurator configurator, List<Tuple> tupleList) {
    distributeRemote(configurator.getRemoteList(), tupleList);
  }


  /**
   * Distribute remote.
   *
   * @param paasList the list of available paas
   * @param tupleList the tuple list
   */
  public static void distributeRemote(List<Paas> paasList, List<Tuple> tupleList) {
    CircularLinkedList<Paas> linkedList = new CircularLinkedList(paasList);
    for (Tuple tuple : tupleList) {
      distributeRemote(linkedList, tuple);
    }
  }


  /**
   * Distribute remote.
   *
   * @param paasList the list of available paas
   * @param tuple the tuple
   */
  public static void distributeRemote(CircularLinkedList<Paas> paasList, Tuple tuple) {
    // setting remote hub address to client, using circular linked list
    // each tuple will be prioritised to be in the same hub
    // need to handle mobile == null
    for (Client client : tuple.getClients()) {
      if (client.getPaas() == null) {
        Paas paas = paasList.get();
        logger.debug("Assigning client to: " + paas.toString());
        client.setPaas(paas);
      }
    }
  }

  /**
   * main method.
   *
   * @param args relative or absolute path of the configuration file.
   */
  public static void main(String[] args) {
    if (args.length < 1) {
      logger.error("Error [Missing Argument]: Use java -jar KITE.jar <absolute path/config.json>");
      return;
    }

    for (String configFile : getConfigfilesFromParameters(args)) {
      Configurator configurator = new Configurator();
      buildConfig(configurator, configFile);

      for (TestConfig testConfig : configurator.getConfigHandler().getTestList()) {
        List<Tuple> tupleList = new ArrayList<>();
        testConfig.setPathToConfigFile(configurator.getConfigFilePath());
        testConfig.setReportPath(configurator.getReportPath());
        ExecutorService service = Executors.newSingleThreadExecutor();
        try {
          if (testConfig.isLoadTest()) {
            testConfig.setIncrement(testConfig.getTupleSize());
            for (Client client : configurator.getConfigHandler().getClientList()) {
              client.setCount(testConfig.getTupleSize());
            }
            List<Future<List<Future<Object>>>> ramUpResults = runRampUp(service, configurator.getName() ,testConfig,
                configurator.getRemoteList(), configurator.getConfigHandler().getClientList());
            List<List<TestManager>> secondPhase = processRamUpResults(ramUpResults);
            runLoadReached(service, configurator.getName(), secondPhase);
          } else {
            List<List<Integer>> matrix = configurator.getMatrix();
            if (matrix != null && !matrix.isEmpty()) {
              for (List<Integer> indexList : matrix) {
                Tuple tuple = new Tuple();
                for (int index : indexList) {
                  tuple.add(configurator.getConfigHandler().getClientList().get(index));
                }
                tupleList.add(tuple);
              }
            } else {
              tupleList = configurator.buildTuples(testConfig.getTupleSize(), testConfig.isPermute(),
                  testConfig.isRegression());
            }
            distributeRemote(configurator, tupleList);
            List<Future<Object>> interopResult = runInterop(service, configurator.getName(), testConfig, tupleList);
          }

          if(testConfig.getCallbackUrl() != null) {
            upload(testConfig.getReporter().getReportPath() + "../" + testConfig.getName() + "-allure." + System.currentTimeMillis() + ".zip",
                    testConfig.getReporter().getReportPath(), testConfig.getCallbackUrl(), testConfig.getCallbackPort(), testConfig.getCallbackUsername(), testConfig.getCallbackPassword());
          }

        } catch (Exception e) {
          e.printStackTrace();
        } finally {
          service.shutdown();
        }
      }
    }
  }

  private static List<String> getConfigfilesFromParameters(String[] args) {
    List<String> configFiles = new ArrayList<>();
    for (String arg : args) {
      configFiles.addAll(getJsonFiles(new File(arg)));
    }
    return configFiles;
  }

  private static List<String> getJsonFiles (File file) {
    List<String> files = new ArrayList<>();
    if (file.isFile()) {
      if (file.getName().endsWith(".json")) {
        files.add(file.getAbsolutePath());
      }
    } else {
      for (File subFile : file.listFiles()) {
        files.addAll(getJsonFiles(subFile));
      }
    }
    return files;
  }

  public static boolean upload(String desFile, String sourcePath, String callbackUrl, int callbackPort, String username, String password) {
    try{
      String fileName = ReportUtils.zipFile(sourcePath, desFile, true);
      File zipToSend = new File(fileName);
      if (zipToSend.exists()) {
        CallbackThread callbackThread = new CallbackThread(callbackUrl, callbackPort, username, password, zipToSend);
        callbackThread.run();
        return callbackThread.isUploadComplete();
      }
    } catch (Exception e) {
      logger.error("Could not upload the file (" + desFile +") to -> " + callbackUrl);
    }

    return false;
  }

  /**
   * Run interop.
   *
   * @param service the service
   * @param testSuiteName the test suite name
   * @param testConfig the test config
   * @param tupleList the tuple list
   * @return the list
   * @throws ExecutionException the execution exception
   * @throws InterruptedException the interrupted exception
   */
  public static List<Future<Object>> runInterop(ExecutorService service, String testSuiteName,
      TestConfig testConfig, List<Tuple> tupleList)
      throws ExecutionException, InterruptedException {
    TestRunThread runThread = new TestRunThread(testConfig, tupleList);
    runThread.setName(testSuiteName);
    testRunThreads.add(runThread);
    List<Future<Object>> runResults = service.submit(runThread).get();
    runThread = null;
    return runResults;
  }

  private static List<Future<Object>> processRunResults (List<Future<Object>> runResults) {
    List<Future<Object>> res = new ArrayList<>();
    ExecutorService executor
        = Executors.newSingleThreadExecutor();
    for (Future future : runResults) {
      try {
        Object object = future.get();
        if (object instanceof TestManager) {
          ((TestManager) object).terminate();
          res.add(null);
        } else {
          res.add(wrapObjectBackToFuture(executor, object));
        }
      } catch (Exception e) {
        // ignore
      }
    }
    executor.shutdown();
    return res;
  }

  private static Future<Object> wrapObjectBackToFuture(ExecutorService executor, Object object) {
    return executor.submit(() -> object);
  }

  /**
   * Stop interop.
   */
  public static void stopRunThreads() {
    logger.info("Trying to stop all test run threads");
    for (TestRunThread thread : testRunThreads ) {
      thread.interrupt();
    }
  }


  public static List<Future<List<Future<Object>>>> runLoadReached(ExecutorService executorService, String testSuiteName, List<List<TestManager>> secondPhaseTestManagerList)
      throws InterruptedException {
//    List<TestRunThread> testRunThreads = new ArrayList<>();
    testRunThreads.clear();
    for (int index = 0 ; index < secondPhaseTestManagerList.size(); index ++) {
      TestRunThread testRunThread = new TestRunThread(testSuiteName, secondPhaseTestManagerList.get(index));
      if (index == secondPhaseTestManagerList.size() - 1) {
        testRunThread.setLastThread(true);
      }
      testRunThreads.add(testRunThread);
    }
    executorService = Executors.newFixedThreadPool(secondPhaseTestManagerList.size());
    List<Future<List<Future<Object>>>> res =  executorService.invokeAll(testRunThreads);
    shutdown(executorService);
    return res;
  }

  public static List<Future<List<Future<Object>>>> runRampUp(ExecutorService executorService, String testSuiteName, TestConfig testConfig, List<Paas> paasList, List<Client> clients) throws KiteGridException, InterruptedException {
    if (paasList.size() < 1) {
      throw new KiteGridException("Looks like the grid is not up, no hub IP or DNS was provided.");
    }
    testConfig.setNoOfThreads(paasList.size());
    testRunThreads.clear();

    for (Client client : clients) {
      CircularLinkedList<Paas> paasWithProfile = getPaasWithProfile(paasList, client);
      int increment = testConfig.getIncrement();
      int numberOfIteration = (int) Math.floor(client.getCount()/increment);
      int leftOver = client.getCount() - increment*numberOfIteration;
      logger.info("SUMMARY----------------------------------------------------");
      logger.info("Current client is: " + client.toString());
      logger.info("Increment: "  + increment);
      logger.info("The client will be distributed evenly into every grids in round-robin fashion");
      logger.info("END OF SUMMARY---------------------------------------------");
      for (int iterationCount = 0; iterationCount < numberOfIteration; iterationCount ++) {
        List<Tuple> tupleList = new ArrayList<>();
        if (increment > IDEAL_TUPLE_SIZE) {
          tupleList = getSmallerTuple(paasWithProfile, client, increment, IDEAL_TUPLE_SIZE);
        } else {
          Tuple tuple = new Tuple();
          for (int count = 0; count < increment; count ++) {
            client.setPaas(paasWithProfile.get());
            tuple.add(client);
          }
          tupleList.add(tuple);
        }

        TestRunThread runThread = new TestRunThread(testConfig, tupleList);
        runThread.setName(testSuiteName);
        runThread.setCurrentIteration(iterationCount*increment);
        testRunThreads.add(runThread);
      }

      if (leftOver > 0) {
        List<Tuple> tupleList = new ArrayList<>();
        if (leftOver > IDEAL_TUPLE_SIZE) {
          tupleList = getSmallerTuple(paasWithProfile, client, leftOver, IDEAL_TUPLE_SIZE);
        } else {
          Tuple tuple = new Tuple();
          for (int count = 0; count < leftOver; count ++) {
            client.setPaas(paasWithProfile.get());
            tuple.add(client);
          }
          tupleList.add(tuple);
        }

        TestRunThread runThread = new TestRunThread(testConfig, tupleList);
        runThread.setName(testSuiteName);
        runThread.setCurrentIteration(increment*numberOfIteration);
        testRunThreads.add(runThread);
      }
    }
    List<Future<List<Future<Object>>>> res = new ArrayList<>();
    if(testConfig.getRampUpDelay() == 0) {
      executorService = Executors.newFixedThreadPool(1);
       res =  executorService.invokeAll(testRunThreads);
      shutdown(executorService);
    } else {
      List<ExecutorService> executorServices = new ArrayList<>();
      int index = 0;
      while(index < testRunThreads.size() ) {
        long start = System.currentTimeMillis();
        logger.info("Starting batch no. " + index);
        List<TestRunThread> testRunThread = new ArrayList<>();
        testRunThread.add(testRunThreads.get(index));
        executorService = Executors.newFixedThreadPool(1);
        res.addAll(executorService.invokeAll(testRunThread));
        executorServices.add(executorService);
        int threadTime = (int) (System.currentTimeMillis() - start);
        logger.info("Threadtime : " + threadTime);
        index ++;
        if (threadTime < testConfig.getRampUpDelay()) {
          logger.info("Waiting " +  (testConfig.getRampUpDelay() - threadTime));
          waitAround(Math.abs((testConfig.getRampUpDelay() - threadTime) - ONE_SECOND_INTERVAL));
        }
      }
      for(ExecutorService service: executorServices) {
        shutdown(service);
      }
    }
    return res;
  }

  private static List<Tuple> getSmallerTuple(CircularLinkedList<Paas> paasList, Client client, int originalTupleSize, int idealTupleSize) {
    List<Tuple> tupleList = new ArrayList<>();
    int tupleCount = originalTupleSize/idealTupleSize;
    int leftOver = originalTupleSize - idealTupleSize*tupleCount;

    for (int i = 0; i < tupleCount; i++) {
      Tuple tuple = new Tuple();
      for (int j = 0; j < idealTupleSize; j++) {
        client.setPaas(paasList.get());
        tuple.add(client);
      }
      tupleList.add(tuple);
    }
    if (leftOver > 0) {
      Tuple tuple = new Tuple();
      for (int j = 0; j < leftOver; j++) {
        client.setPaas(paasList.get());
        tuple.add(client);
      }
      tupleList.add(tuple);
    }
    return tupleList;
  }

  public static CircularLinkedList<Paas> getPaasWithProfile(List<Paas> originalList, Client client) {

    List<Paas> res = new ArrayList<>();
    for (Paas paas : originalList) {
//      logger.info("looking for paas with spec " + client.getBrowserSpecs());
//      if (paas.getSpecList().contains(client.getBrowserSpecs())) {
        logger.info("looking for paas with profile " + client.getNetworkProfile().getName());
//        if (paas.getNetworkProfile().getName().equals(client.getNetworkProfile().getName())) {
//          if (paas.getAvailableSlots() > 0) {
            res.add(paas);
//          }
//        }
//      }
    }
    return new CircularLinkedList<Paas>(res);
  }

  private static HashMap<Client, Integer> getIncrementMap(List<Client> clients, int totalIncrement) {
    int totalCount = 0;
    HashMap<Client, Integer> map = new HashMap<>();
    for (Client client : clients) {
      totalCount += client.getCount();
    }
    for (Client client : clients) {
      map.put(client, client.getCount()*totalIncrement/totalCount);
    }
    return map;
  }

  public static List<List<TestManager>> processRamUpResults(List<Future<List<Future<Object>>>> RamUpResults)
      throws ExecutionException, InterruptedException {
    List<List<TestManager>> secondPhase = new ArrayList<>();
    for (Future futures : RamUpResults) {
      List<Future> future = (List<Future>) futures.get();
      List<TestManager> temp = new ArrayList<>();
      for (Future testManager : future) {
        temp.add((TestManager) testManager.get());
      }
      secondPhase.add(temp);
    }
    return secondPhase;
  }

}
