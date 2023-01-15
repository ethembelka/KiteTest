echo -n -e "\033]0;NODE CHROME\007"
java -Dwebdriver.chrome.driver=./chromedriver -jar ../selenium.jar -role node -maxSession 5 -port 6001 -host localhost -hub http://localhost:4444/grid/register -browser browserName=chrome,version=108,platform=LINUX,maxInstances=5 --debug
