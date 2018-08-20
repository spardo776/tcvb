
DATA_DIR="data/$1"
export DATA_DIR
#DEBUG="datastore dict_tcvb"
export DEBUG
if [ -d $DATA_DIR ]
then
	nodemon server.js
else
	echo "$DATA_DIR does not exist"
fi

