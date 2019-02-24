#!/usr/bin/env bash

exists () {
    type "$1" &> /dev/null ;
}

if exists /usr/local/bin/ifstat ; then
	echo "↓ $(/usr/local/bin/ifstat -n -z -S 1 1 | awk 'FNR == 3 {print $2}') ↑ $(/usr/local/bin/ifstat -n -z -S 1 1 | awk 'FNR == 3 {print $3}')"
else
    echo "Please install ifstat: `brew install ifstat`."
fi