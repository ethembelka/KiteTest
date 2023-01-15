#! /bin/bash
cd $KITE_HOME/scripts/mac
source gridConfig.sh

cd $KITE_HOME

mkdir localGrid
cd localGrid
mkdir chrome
mkdir firefox
mkdir safari
mkdir hub

if [[ "$LOCALHOST" = "TRUE" ]]
then
  IP="localhost"
else
  IF=$(route get default |grep 'interface' |awk -F: '{print $2}');
  IP=$(ifconfig |grep -A5 $IF | grep 'inet ' | cut -d: -f2 |awk '{print $2}');
fi

rm startGrid.sh || true
echo cd $KITE_HOME/localGrid/hub >> startGrid.sh
echo osascript -e "'tell application \"Terminal\" to do script \"$KITE_HOME/localGrid/hub/startHub.sh;exit\" '" >> startGrid.sh

echo cd $KITE_HOME/localGrid/chrome >> startGrid.sh
echo  osascript -e "'tell application \"Terminal\" to do script \"$KITE_HOME/localGrid/chrome/startNode.sh;exit\" '" >> startGrid.sh

echo cd $KITE_HOME/localGrid/safari >> startGrid.sh
echo  osascript -e "'tell application \"Terminal\" to do script \"$KITE_HOME/localGrid/safari/startNode.sh;exit\" '" >> startGrid.sh

echo cd $KITE_HOME/localGrid/firefox >> startGrid.sh
echo  osascript -e "'tell application \"Terminal\" to do script \"$KITE_HOME/localGrid/firefox/startNode.sh;exit\" '" >> startGrid.sh

rm stopGrid.sh || true
echo "kill \$(ps aux | grep role | grep -v grep | awk '{print \$2}')" >> stopGrid.sh
echo "pkill -f hub" >> stopGrid.sh

rm chrome/startNode.sh || true
echo echo -n -e '"\033]0;NODE CHROME\007"' >> chrome/startNode.sh
echo   java -Dwebdriver.chrome.driver=$KITE_HOME/localGrid/chrome/chromedriver -jar $KITE_HOME/localGrid/selenium.jar -role node -maxSession 5 -port 6001 -host $IP -hub http://$IP:4444/grid/register -browser browserName=chrome,version=$CHROME_VERSION,platform=MAC,maxInstances=5 --debug >> chrome/startNode.sh


rm firefox/startNode.sh || true
echo echo -n -e '"\033]0;NODE FIREFOX\007"' >> firefox/startNode.sh
echo   java -Dwebdriver.gecko.driver=$KITE_HOME/localGrid/firefox/geckodriver -jar $KITE_HOME/localGrid/selenium.jar -role node -maxSession 10 -port 6002 -host $IP -hub http://$IP:4444/grid/register  -browser browserName=firefox,version=$FIREFOX_VERSION,platform=MAC,maxInstances=10 --debug  >> firefox/startNode.sh


rm safari/startNode.sh || true
echo echo -n -e '"\033]0;NODE SAFARI\007"' >> safari/startNode.sh
echo   java -Dwebdriver.safari.driver=/Applications/Safari.app/Contents/MacOS/safaridriver -jar $KITE_HOME/localGrid/selenium.jar -role node -maxSession 1 -port 6003 -host $IP -hub http://$IP:4444/grid/register  -browser browserName=safari,version=$SAFARI_VERSION,platform=MAC,maxInstances=1 --debug  >> safari/startNode.sh


rm hub/startHub.sh || true
echo echo -n -e '"\033]0;HUB\007"' >> hub/startHub.sh
echo   java -jar $KITE_HOME/localGrid/selenium.jar -role hub --debug -host $IP >> hub/startHub.sh


chmod +x startGrid.sh
chmod +x stopGrid.sh

cd hub
chmod +x startHub.sh
cd ..

cd safari
chmod +x startNode.sh
cd ..
cd chrome
chmod +x startNode.sh
cd ..
cd firefox
chmod +x startNode.sh
cd ..

kill -9 $PPID
