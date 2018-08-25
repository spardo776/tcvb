RUNNER="pm2 start"

if [ "$USER"  != "ubuntu" ]
then
	RUNNER="nodemon"
	#OPTIONS="--watch --ignore-watch data"
	#DEBUG="datastore dict_tcvb"
	#export DEBUG
fi

DATA_DIR="data/$1"
export DATA_DIR

if [ -d "$DATA_DIR" ]
then
	$RUNNER server.js $OPTIONS
else
	echo "$DATA_DIR does not exist"
fi

