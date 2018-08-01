
DATA_DIR="data/$1"
export DATA_DIR
if [ -d $DATA_dIR ]
then
	nodemon server.js
else
	echo "$DATA_DIR does not exist"
fi

