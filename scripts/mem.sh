#!/bin/bash

FREE_BLOCKS=$(vm_stat | grep free | awk '{ print $3 }' | sed 's/\.//')
INACTIVE_BLOCKS=$(vm_stat | grep inactive | awk '{ print $3 }' | sed 's/\.//')
SPECULATIVE_BLOCKS=$(vm_stat | grep speculative | awk '{ print $3 }' | sed 's/\.//')

TOTAL_MEMSIZE=$(($(sysctl -a | sed 's/hw.memsize: \([0-9]*\)/\1/; s/^[a-zA-Z].*//g' | tr -d "\n")/1048576))

FREE=$((($FREE_BLOCKS+SPECULATIVE_BLOCKS)*4096/1048576))
INACTIVE=$(($INACTIVE_BLOCKS*4096/1048576))
TOTAL=$((($FREE+$INACTIVE)))
# not required
# echo Free:       $FREE MB
# echo Inactive:   $INACTIVE MB
# echo Total free: $TOTAL MB

# just output the total used mem in GB
echo "$(($TOTAL_MEMSIZE-$TOTAL))/1024" | bc -l