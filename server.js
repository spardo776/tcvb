var express=require('express');
var app=express();
var fs=require('fs');

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

var port = process.env.PORT || 8080;  

// build data path
function f_data_path(ls_class)
{
return (__dirname + '/data/' + ls_class + '/') 
}

// get group
function f_get_group(req,res) {
  res.setHeader('content-type','application/json');

  var ls_path=f_data_path('group');

  //dump each file in data/group directory into an array of json files
  fs.readdir(ls_path,
    function (err, files) {
      if (err) { return console.error(err);  }

      var lb_first_group=1; // to handle comma
		
      // loop on files
      files.forEach(
        function (file,idx,files){
	   if (file.match(/.json$/))
           {
                fs.readFile(
                        ls_path+file,'utf8',
                        function (err, data) {
                                if (err) { return console.error(err) };

			        if (idx==0) res.write('['); // first file : open array
	
                                var lo_group=JSON.parse(data);
				var lb_select=1;	
		
				// loop on filters		
				Object.keys(req.query).forEach(
				  function(key){ 
                                  if ((req.query[key])
                                     &&(lo_group[key])
                                     &&(req.query[key]!=lo_group[key])) lb_select=0;
                                  }
				);
				if ((req.query.dispo)&&(lo_group.libre==0)) lb_select=0;

				if (lb_select) {
				  //output data	
				  if (! lb_first_group) { res.write(',')} else {lb_first_group=0};	
				  res.write(data);
                                }
                                if ( (files.length-1) == idx) res.end(']\n'); // last file close array
                        }
                )
             }
       } 
      );
  });
}

// add group
function f_add_group(req,res)
{
  res.setHeader('content-type','application/json');
  var ls_path=f_data_path('group');

  var lo_dict= { "jour" : "MS", "heure" : "MI", "court" : "MI", "niveau" : "MS", "taille" : "MI" , "annee" : "MI" };

  var lo_err = { "msgs" : [] };
  var lo_msg = {};
  var lo_group = {};

  // check and gathered provided fields
  Object.keys(lo_dict).forEach(
   function (key) {

     if (lo_dict[key].match(/M/) && (! req.body[key])) 
      { lo_msg.msg = key+ ' est obligatoire'; lo_err.msgs.push( lo_msg ); return};

     if (lo_dict[key].match(/I/) && (! String(req.body[key]).match(/\d+/))) 
      { lo_msg.msg = key+ ' doit etre un nombre'; lo_err.msgs.push( lo_msg ); return};

     lo_group[key]=req.body[key];
    }
  );

  if (! lo_err.msgs.length)
  {
    lo_group.id=req.body.jour.substr(0,2)+'_'+req.body.heure+'_'+req.body.court;
    var ls_filename=f_data_path('group')+lo_group.id+'.json';

    // check unicity
    fs.stat(ls_filename, function (err,stats) {
      if ((err)&&(err.code=='ENOENT'))
      {
	// complete and store record
        lo_group.taille=0;
        lo_group.membres=[];
        var ls_data=JSON.stringify(lo_group);
        fs.writeFile(ls_filename, ls_data, function (err) { 
           if (err) { console.log(err) };
           res.sendStatus(201);
        });        
      }
      else
      {
       lo_err.msgs.push ( { 'msg' : 'ce groupe existe deja' } );
       res.status(400).json(lo_err);
      } 
    });
  } 
  else
  {
   res.status(400).json(lo_err);
  }
}
// delete group
function f_del_group(req,res) 
{
  res.setHeader('Content-type','application/json');
  var ls_filename=f_data_path('group')+req.params.id+'.json';
  fs.unlink(ls_filename, function (err) {
   if (err) {
     res.status(404).json( { msgs : [ { msg : 'le groupe '+req.params.id+' n\'existe pas' } ] } );
   }
   else
   {
    res.sendStatus(204);
   }
  });
}
// add user in group

// delete user in group

app
.get('/api/group', f_get_group)
.post('/api/group', f_add_group)
.delete('/api/group/:id', f_del_group)
.use(function(req, res, next){
    res.setHeader('Content-Type', 'text/plain');
    res.status(404).send('Page not found');
})
.listen(port);

console.log('listening on port ' + port);
