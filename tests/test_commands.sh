title()
{
echo  "\n=== $1 ===\n"
}

curlopt='-s -S'

title "list all groups"
curl $curlopt http://localhost:8080/api/group

title "list groups 2008"
curl $curlopt 'http://localhost:8080/api/group?year=2008'

title "list groups vert"
curl $curlopt 'http://localhost:8080/api/group?level=vert'

title "list groups vert free"
curl $curlopt -w '\nHTTP%{http_code}\n\n' 'http://localhost:8080/api/group?level=vert&is_free'

title "add group _mercredi_10_1"
curl $curlopt -w '\nHTTP%{http_code}\n\n' -H "Content-Type: application/json" --request POST --data @add_group.json 'http://localhost:8080/api/group' 

title "show group rouge"
curl $curlopt 'http://localhost:8080/api/group?level=rouge'

title "add member"
curl $curlopt -w '\nHTTP%{http_code}\n\n' -H "Content-Type: application/json" --request POST --data @add_member.json 'http://localhost:8080/api/member' 

title "show group rouge with a member"
curl $curlopt 'http://localhost:8080/api/group?level=rouge'

title "duplicate member"
curl $curlopt -w '\nHTTP%{http_code}\n\n' -H "Content-Type: application/json" --request POST --data @add_member.json 'http://localhost:8080/api/member' 

title "delete membre"
curl $curlopt -w '\nHTTP%{http_code}\n\n' -H "Content-Type: application/json" --request DELETE 'http://localhost:8080/api/member/_hugo_tonelli' 

title "show group rouge with no member"
curl $curlopt 'http://localhost:8080/api/group?level=rouge'

title "delete group _mercredi_10_1"
curl $curlopt -w '\nHTTP%{http_code}\n\n' -H "Content-Type: application/json" --request DELETE 'http://localhost:8080/api/group/_mercredi_10_1' 

title "show group rouge"
curl $curlopt 'http://localhost:8080/api/group?level=rouge'


