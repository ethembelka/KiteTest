#!/bin/bash
set +v
. ./gridConfig.sh
cd ..
cd ..
mkdir -p localGrid
cd localGrid
mkdir -p chrome
mkdir -p firefox
mkdir -p hub



if [[ "$LOCALHOST" = "TRUE" ]]
then
  IP="localhost"
else
  IP="$(hostname -I|cut -f1 -d ' ')"
fi

rm startGrid.sh || true
if [[ "$DESKTOP_ENVIRONMENT" = "TRUE" ]]
then
  echo cd $KITE_HOME/localGrid/hub >> startGrid.sh
  echo x-terminal-emulator -e ./startHub.sh >> startGrid.sh
  echo cd $KITE_HOME/localGrid/chrome >> startGrid.sh
  echo x-terminal-emulator -e ./startNode.sh >> startGrid.sh

  echo cd $KITE_HOME/localGrid/firefox >> startGrid.sh
  echo x-terminal-emulator -e ./startNode.sh >> startGrid.sh
else
  echo cd $KITE_HOME/localGrid/hub >> startGrid.sh
  echo "./startHub.sh &" >> startGrid.sh
  echo cd $KITE_HOME/localGrid/chrome >> startGrid.sh
  echo "./startNode.sh &" >> startGrid.sh
  echo cd $KITE_HOME/localGrid/firefox >> startGrid.sh
  echo "./startNode.sh &" >> startGrid.sh
fi


rm stopGrid.sh || true
echo "kill -9 \$(ps ax | grep role | fgrep -v grep | awk '{ print \$1 }')" >> stopGrid.sh

rm chrome/startNode.sh || true
echo echo -n -e '"\033]0;NODE CHROME\007"' >> chrome/startNode.sh
echo   java -Dwebdriver.chrome.driver=./chromedriver -jar ../selenium.jar -role node -maxSession 5 -port 6001 -host $IP -hub http://$IP:4444/grid/register -browser browserName=chrome,version=$CHROME_VERSION,platform=LINUX,maxInstances=5 --debug >> chrome/startNode.sh




rm firefox/startNode.sh || true
echo echo -n -e '"\033]0;NODE FIREFOX\007"' >> firefox/startNode.sh
echo java -Dwebdriver.gecko.driver=./geckodriver -jar ../selenium.jar -role node -maxSession 10 -port 6002 -host $IP -hub http://$IP:4444/grid/register  -browser browserName=firefox,version=$FIREFOX_VERSION,platform=LINUX,maxInstances=10 --debug  >> firefox/startNode.sh


rm hub/startHub.sh || true
echo echo -n -e '"\033]0;HUB\007"' >> hub/startHub.sh
echo java -cp "*:.:../*" org.openqa.grid.selenium.GridLauncherV3 -role hub --debug -host $IP >> hub/startHub.sh
chmod +x startGrid.sh
chmod +x stopGrid.sh
cd hub
chmod +x startHub.sh
cd ..
cd firefox
chmod +x startNode.sh
cd ..
cd chrome
chmod +x startNode.sh
cd ..

exit

