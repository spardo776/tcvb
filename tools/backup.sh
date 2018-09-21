#!/bin/bash

stamp=`date '+%F-%H%M'`

tarfile="./backup/data_$stamp.tar"
logfile="./log/backup_$stamp.log"
cd `dirname $0`/..

tar cvf $tarfile data > $logfile 2>&1

gzip $tarfile >> $logfile 2>&1

find ./backup -name \*.tar.gz -mtime +30 -exec rm {} \; >> $logfile 2>&1
