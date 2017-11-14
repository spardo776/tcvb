echo "groups"
curl http://localhost:8080/api/groups
echo "groups 2008"
curl 'http://localhost:8080/api/group?annee=2008'
echo "groups vert"
curl 'http://localhost:8080/api/group?niveau=vert'
echo "groups vert libre"
curl -w '\nHTTP%{http_code}\n\n' 'http://localhost:8080/api/group?niveau=vert&dispo=0'
echo "add group"
curl -w '\nHTTP%{http_code}\n\n' -H 'Content-Type: application/json' --request POST --data @add_group.json 'http://localhost:8080/api/group' 
echo "delete group"
curl -w '\nHTTP%{http_code}\n\n' -H 'Content-Type: application/json' --request DELETE 'http://localhost:8080/api/group/me_10_1' 
