echo -n -e "\033]0;HUB\007"
java -cp *:.:../* org.openqa.grid.selenium.GridLauncherV3 -role hub --debug -host localhost
