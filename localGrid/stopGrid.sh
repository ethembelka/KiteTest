kill -9 $(ps ax | grep role | fgrep -v grep | awk '{ print $1 }')
