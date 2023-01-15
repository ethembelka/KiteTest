@echo off
call gridConfig.bat

rem create the folders 
cd ..
cd ..
mkdir localGrid
cd localGrid
mkdir chrome
mkdir firefox
mkdir hub

IF "%LOCALHOST%" == "TRUE" (
  set IP=localhost
) ELSE (
  for /f "delims=[] tokens=2" %%a in ('ping -4 -n 1 %ComputerName% ^| findstr [') do set IP=%%a
)

rem create script to kill the grid
IF EXIST stopGrid.bat del /F stopGrid.bat
ECHO @echo off >> stopGrid.bat
ECHO taskkill /FI "WINDOWTITLE eq Chrome Node*" /F >> stopGrid.bat
ECHO taskkill /FI "WINDOWTITLE eq Chrome Node*" /F >> stopGrid.bat
ECHO taskkill /FI "WINDOWTITLE eq Firefox Node*" /F >> stopGrid.bat
ECHO taskkill /FI "WINDOWTITLE eq Firefox Node*" /F >> stopGrid.bat
ECHO taskkill /FI "WINDOWTITLE eq Hub*" /F >> stopGrid.bat
ECHO taskkill /FI "WINDOWTITLE eq Hub*" /F >> stopGrid.bat

rem create script for Grid
IF EXIST startGrid.bat del /F startGrid.bat
ECHO @echo off >> startGrid.bat
ECHO cd %KITE_HOME%\localGrid\hub >> startGrid.bat
ECHO start startHub.bat >> startGrid.bat
ECHO cd %KITE_HOME%\localGrid\chrome >> startGrid.bat
ECHO start startNode.bat >> startGrid.bat
ECHO cd %KITE_HOME%\localGrid\firefox >> startGrid.bat
ECHO start startNode.bat >> startGrid.bat
ECHO exit >> startGrid.bat


rem create script for Chrome Node
cd chrome
IF EXIST startNode.bat del /F startNode.bat
cd ..
ECHO @echo off >> chrome/startNode.bat
ECHO setlocal >> chrome/startNode.bat
ECHO   title Chrome Node  >> chrome/startNode.bat
ECHO   java -Dwebdriver.chrome.driver=./chromedriver.exe -jar ../selenium.jar -role node -maxSession 5 -port 6001 -host %IP% -hub http://%IP%:4444/grid/register -browser browserName=chrome,version=%CHROME_VERSION%,platform=WINDOWS,maxInstances=5 --debug >> chrome/startNode.bat
ECHO   endlocal  >> chrome/startNode.bat
ECHO pause >> chrome/startNode.bat

rem create script for Firefox Node
cd firefox
IF EXIST startNode.bat del /F startNode.bat
cd ..
ECHO @echo off >> firefox/startNode.bat
ECHO setlocal >> firefox/startNode.bat
ECHO   title Firefox Node >> firefox/startNode.bat
ECHO   java -Dwebdriver.gecko.driver=./geckodriver.exe -jar ../selenium.jar -role node -maxSession 10 -port 6002 -host %IP% -hub http://%IP%:4444/grid/register  -browser browserName=firefox,version=%FIREFOX_VERSION%,platform=WINDOWS,maxInstances=10 --debug  >> firefox/startNode.bat
ECHO   endlocal  >> firefox/startNode.bat
ECHO pause >> firefox/startNode.bat

rem create script for Hub
cd hub
IF EXIST startHub.bat del /F startHub.bat
cd ..
ECHO @echo off >> hub/startHub.bat
ECHO setlocal >> hub/startHub.bat
ECHO   title Hub >> hub/startHub.bat
ECHO   java -jar ../selenium.jar -role hub --debug -host %IP% >> hub/startHub.bat
ECHO endlocal >> hub/startHub.bat
ECHO pause >> hub/startHub.bat
