
DATA_DIR="data/live"
export DATA_DIR

if [ -d "$DATA_DIR" ]
then
	node server.js
else
	echo "$DATA_DIR does not exist"
fi

