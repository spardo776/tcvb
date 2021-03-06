title()
{
echo  "\n=== $1 ===\n"
}

curlopt='-s -S  -w \nHTTP%{http_code}\n\n'

title "list all groups"
curl $curlopt http://localhost:8080/api/group | js-beautify -

title "list groups 2008"
curl $curlopt 'http://localhost:8080/api/group?year=2008'| js-beautify -

title "list groups vert"
curl $curlopt 'http://localhost:8080/api/group?level=vert'| js-beautify -

title "list groups vert free"
curl $curlopt 'http://localhost:8080/api/group?level=vert&isfree'| js-beautify -

title "add group _mercredi_10_1 rouge"
curl $curlopt -H "Content-Type: application/json" --request POST --data @add_group.json 'http://localhost:8080/api/group' | js-beautify -
last_group_file=`ls -t $HOME/tcvb/data/tests/group/*.json|head -1`
last_group=`basename $last_group_file .json`
echo
echo "#id=$last_group"

title "show group rouge"
curl $curlopt 'http://localhost:8080/api/group?level=rouge'| js-beautify -

title "add member"
curl $curlopt -H "Content-Type: application/json" --request POST --data @add_member.json 'http://localhost:8080/api/member' | js-beautify -
last_member_file=`ls -t $HOME/tcvb/data/tests/member/*.json|head -1`
last_member=`basename $last_member_file .json`
echo
echo "#id=$last_member"

title "show group with new member"
curl $curlopt 'http://localhost:8080/api/group?id=_lundi_18_1'| js-beautify -

title "show group member"
curl $curlopt "http://localhost:8080/api/member?group_id=_lundi_18_1"| js-beautify -

title "duplicate member"
curl $curlopt  -H "Content-Type: application/json" --request POST --data @add_member.json 'http://localhost:8080/api/member' | js-beautify -

title "delete member"
curl $curlopt -H "Content-Type: application/json" --request DELETE "http://localhost:8080/api/member/$last_member" | js-beautify -

title "show vert with no member"
curl $curlopt 'http://localhost:8080/api/group?id=_lundi_18_1'| js-beautify -

title "update group _lundi_18_1"
curl $curlopt -H "Content-Type: application/json" --request PUT --data @upd_group.json 'http://localhost:8080/api/group' | js-beautify -

title "show updated group (size 4)"
curl $curlopt 'http://localhost:8080/api/group?id=_lundi_18_1&size=4'| js-beautify -

title "update group _lundi_18_1 back"
curl $curlopt -H "Content-Type: application/json" --request PUT --data @upd_group_back.json 'http://localhost:8080/api/group' | js-beautify -

title "delete group _mercredi_10_1"
curl $curlopt -H "Content-Type: application/json" --request DELETE "http://localhost:8080/api/group/$last_group" | js-beautify -

title "show group rouge (none)"
curl $curlopt 'http://localhost:8080/api/group?level=rouge'| js-beautify -


