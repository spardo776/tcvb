#!/bin/bash

stamp=`date '+%F-%H%M'`

tarfile="./backup/data_$stamp.tar"
logfile="./log/backup_$stamp.log"
cd `dirname $0`/..

tar cvf $tarfile data > $logfile 2>&1

gzip $tarfile

find ./backup -name \*.tar.gz -mtime +21 --print