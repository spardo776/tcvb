
if [ "$USER"  = "ubuntu" ]
then
	RUNNER="pm2 start"
else
	RUNNER="nodemon"
	#DEBUG="datastore dict_tcvb"
	#export DEBUG
fi

DATA_DIR="data/$1"
export DATA_DIR

if [ -d "$DATA_DIR" ]
then
	$RUNNER server.js
else
	echo "$DATA_DIR does not exist"
fi

