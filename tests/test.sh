if [ "$1" = "init" ]
then
  mv test_commands.ref test_commands.ref-prev
  sh ./test_commands.sh > test_commands.ref
  grep -v '#' test_commands.ref > test_commands.ref_for_diff
  cat test_commands.ref
else
  sh ./test_commands.sh > test_commands.out
  grep -v '#' test_commands.ref > test_commands.ref_for_diff
  grep -v '#' test_commands.out > test_commands.out_for_diff
  diff test_commands.ref_for_diff test_commands.out_for_diff
  rm test_commands.ref_for_diff test_commands.out_for_diff
  if [ "$?" = 0 ]
  then
  cat test_commands.out
	status='\e[32m***SUCCEED***\e[39;49m'
  else
	status='\e[31m***FAILED***\e[39;49m'
  fi
  echo
  echo -e $status
fi

