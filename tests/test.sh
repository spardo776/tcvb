if [ "$1" = "init" ]
then
  mv test_commands.ref test_commands.ref-prev
  sh ./test_commands.sh > test_commands.ref
  cat test_commands.ref
else
  sh ./test_commands.sh > test_commands.out
  diff test_commands.ref test_commands.out
  if [ "$?" = 0 ]
  then
	echo "SUCCEED"
  else
	echo "FAILED"
  fi
fi

