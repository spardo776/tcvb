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
  cat test_commands.out
	status='\e[32m***SUCCEED***\e[39;49m'
  else
	status='\e[31m***FAILED***\e[39;49m'
  fi
  echo -e $status
fi

