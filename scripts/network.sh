#!/usr/bin/env bash

exists () {
    type "$1" &> /dev/null ;
}

if exists /usr/local/bin/ifstat ; then
    NETWORKUSAGE=$(/usr/local/bin/ifstat -n -z -S 2 1)
	echo "↓ $(echo "$NETWORKUSAGE" | awk 'FNR == 3 {for(x=1;x<=NF;++x)if(x % 2 == 0)sum+=$x} END {print sum}') ↑ $(echo "$NETWORKUSAGE" | awk 'FNR == 3 {for(x=1;x<=NF;++x)if(x % 2 == 1)sum+=$x} END {print sum}')"
else
    echo "Please install ifstat: `brew install ifstat`."
fi