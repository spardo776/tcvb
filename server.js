/*jslint white, single, node */
"use strict";


/*
 ** data dictionary
 */

var go_dict= {
    "group" : {
    "caption": "groupe",
    "fields": {
        "day": "MS",
        "hour": "MI",
        "court": "MI",
        "level": "MS",
        "size": "MI",
        "year": "MI"
    },
    "children" : [ "member"],
    "pkey": ["day", "hour", "court"]
    },

    "member" : {
        "caption": "membre",
    "fields": {
        "name": "MS",
        "firstname": "MS",
        "year": "MI",
        "group_id": "MS"
    },
    "pkey": ["name", "firstname"] ,
    "parents": [ "group"]
}
};



/*
 ** init application
 */

var express = require("express");
var app = express();
var fs = require("fs");

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

var port = process.env.PORT || 8080;

/*
 ** utilities
*/

// build data path
function f_get_data_path(ls_class) {
    return (__dirname + "/data/" + ls_class + "/");
}

// validate object fields
function f_validate_fields(po_ctxt,po_object) {

    var lo_mydict=go_dict[po_ctxt.name];

    Object.keys(lo_mydict.fields).forEach(
     function(ps_field_name) {
        var lo_msg = {};

        var lx_field_value = po_ctxt.data_in[ps_field_name];
        var ls_field_rule=go_dict[po_ctxt.name].fields[ps_field_name];
        if (ls_field_rule.match(/M/) && (! lx_field_value)) {
            lo_msg.msg = ps_field_name + " est obligatoire";
            po_ctxt.msgs.push(lo_msg);
            return null;
        }
        if (ls_field_rule.match(/I/) && (!String(lx_field_value).match(/\d+/))) {
            lo_msg.msg = ps_field_name + " doit etre un nombre";
            po_ctxt.msgs.push(lo_msg);
            return null;
        }
    
        po_object[ps_field_name] = lx_field_value;
    
        return 1;
     });
}

// generic delete function
function f_del_object(po_ctxt) {

    var lo_mydict=go_dict[po_ctxt.name];
    po_ctxt.msgs =[];
    po_ctxt.data_out =[];

    var ls_filename = f_get_data_path(po_ctxt.name) + po_ctxt.data_in + ".json";
    fs.unlink(ls_filename, function(err) {
        if (err) {
            po_ctxt.msgs.push({
                    msg : lo_mydict.caption + ": n\"existe pas" ,
                    diag : err 
                    });
           } 
       if (po_ctxt.msgs.length)
       {
           po_ctxt.cb_failure(po_ctxt);
           
       } else {
        po_ctxt.cb_success(po_ctxt);
            }
   });
}

// generic add function
function f_add_object(po_ctxt) {

    var lo_object = {};
    
    po_ctxt.msgs =[];
    po_ctxt.data_out =[];
    
    var lo_mydict=go_dict[po_ctxt.name];

    f_validate_fields(po_ctxt,lo_object); 
    
    if (!po_ctxt.msgs.length) {

        // build id
        lo_object.id = '';
        lo_mydict.pkey.forEach(
            function(ps_field) {
                lo_object.id = lo_object.id + "_" + lo_object[ps_field];
            });

        var ls_filename = f_get_data_path(po_ctxt.name) + lo_object.id + ".json";
        // check unicity
        fs.stat(ls_filename, function(err) {
            if ((err) && (err.code === "ENOENT")) {
                // complete and store record
                var ls_data = JSON.stringify(lo_object);
                fs.writeFile(ls_filename, ls_data, function(err) {
                    if (err) {
                        po_ctxt.msgs.push({
                            "msg": "echec création " + lo_mydict.caption,
                            "diag" : err
                        });
                        po_ctxt.cb_failure(po_ctxt);
                       
                    } else {
                        po_ctxt.cb_success(po_ctxt);
                    }
                });
            } else {
                po_ctxt.msgs.push({
                    "msg": lo_mydict.caption + ": existe déjà",
                    "diag" : err
                });
                po_ctxt.cb_failure(po_ctxt);
                
            }
        });
    } else {
        po_ctxt.cb_failure(po_ctxt);
    }
}

// generic get function
function f_get_object(po_ctxt)
{

var lo_mydict=go_dict[po_ctxt.name];
var ls_path = f_get_data_path(po_ctxt.name);

console.log('f_get_object',po_ctxt.name, po_ctxt.data_in, ls_path)

po_ctxt.msgs =[];
po_ctxt.data_out =[];

//dump each file in data/group directory into an array of json files
fs.readdir(ls_path,
    function(err, files) {
        if (err) {
            po_ctxt.msgs.push({
                "msg": "echec accès données",
                "diag" : err
            });
            po_ctxt.cb_failure(po_ctxt);console.log(err);
        } else {
      
        // loop on files
        files.forEach(
            function(file, idx, files) {
                if (file.match(/\.json$/)) {
                    console.log('readFile',ls_path + file);
                    fs.readFile(
                        ls_path + file, "utf8",
                        function(err, data) {
                            if (err) {
                                po_ctxt.msgs.push({
                                    "msg": "echec accès données",
                                    "diag" : err
                                });
                                po_ctxt.cb_failure(po_ctxt);
                            }

                            var lo_object = JSON.parse(data); console.log(data);
                            var lb_select = 1;

                            // loop on filters		
                            Object.keys(po_ctxt.data_in).forEach(
                                function(ps_key) {
                                    if ((po_ctxt.data_in[ps_key]) &&
                                        (lo_object[ps_key]) &&
                                        (po_ctxt.data_in[ps_key] !== String(lo_object[ps_key]))) {
                                        lb_select = 0;
                                    }
                                }
                            );

                            // TODO if (po_ctxt.data_in.hasOwnProperty("is_free") && (lo_object.free === 0)) {
                            //     lb_select = 0;
                            // }

                            if (lb_select) {
                                
                                // get children
                                if ((lo_mydict.children)&&(lo_mydict.children.length))
                                {
                                    lo_mydict.children.forEach(
                                        function (ps_child_name,pi_idx, pa_children) {
                                            // build search criteria (on foreign key) 
                                            var lo_child_data_in={};
                                            
                                            lo_child_data_in[po_ctxt.name+"_id"]=lo_object.id;
                                            
                                            f_get_object( {
                                                "name" : ps_child_name,
                                                "data_in" : lo_child_data_in,
                                                "cb_failure" : po_ctxt.cb_failure,   
                                                "cb_success" : function (po_child_ctxt) {
                                                    console.log('child');
                                                    lo_object[ps_child_name]=po_child_ctxt.data_out;
                                                    console.log(lo_object);
                                                    if (pi_idx === (pa_children.length - 1)) {
                                                        //all children processed - output data
                                                        po_ctxt.data_out.push(lo_object); 
                                                    }
                                                }
                                            }
                                            );
                                        }
                                    )
                                }
                                else {
                                    po_ctxt.data_out.push(lo_object);
                                }
                            }

                            if ((files.length - 1) === idx) {
                                po_ctxt.cb_success(po_ctxt); // TODO declenchement possible avant le traitement de tous les children ??
                            }
                        }
                    );
                }
            }
           );
        }
    });
}

// callback wbs failure
function f_wbs_failure(po_ctxt)
{
    console.log('f_wbs_failure',po_ctxt.msgs)
    po_ctxt.res.setHeader("Content-type", "application/json");
    po_ctxt.res.status(400).json(po_ctxt.msgs);
}

// callback wbs success
function f_wbs_success(po_ctxt)
{
    console.log('f_wbs_success',po_ctxt.data_out)
    po_ctxt.res.setHeader("Content-type", "application/json");
    if (po_ctxt.data_out.length) { po_ctxt.res.status(200).json(po_ctxt.data_out); } else { po_ctxt.res.sendStatus(200);}
}


// WBS get group
function f_wbs_get_group(req, res) {
    f_get_object({
        "name": "group",
        "res": res,
        "data_in": req.query,
        "cb_failure" : f_wbs_failure,
        "cb_success": f_wbs_success
    });
}

// WBS add group
function f_wbs_add_group(req, res) {
    f_add_object({
        "name": "group",
        "res": res,
        "data_in": req.body,
        "cb_failure" : f_wbs_failure,
        "cb_success": f_wbs_success
    });
}

// WBS delete group
function f_wbs_del_group(req, res) {
    f_del_object({
        "name": "group",
        "res": res,
        "data_in": req.params.group_id,
        "cb_failure" : f_wbs_failure,
        "cb_success": f_wbs_success
    });
}

/*
 ** member
 */

// WBS get member
function f_wbs_get_member(req, res) {
    f_get_object({
        "name": "member",
        "res": res,
        "data_in": req.query,
        "cb_failure" : f_wbs_failure,
        "cb_success": f_wbs_success
    });
}

// WBS add member
function f_wbs_add_member(req, res) {
    f_add_object({
        "name": "member",
        "res": res,
        "data_in": req.body,
        "cb_failure" : f_wbs_failure,
        "cb_success": f_wbs_success
    });
}

// WBS delete member
function f_wbs_del_member(req, res) {

    f_del_object({
        "name": "member",
        "res": res,
        "data_in": req.params.member_id,
        "cb_failure" : f_wbs_failure,
        "cb_success": f_wbs_success
    });
}

/*
 ** route and start
 */
app
    .get("/api/group", f_wbs_get_group)
    .post("/api/group", f_wbs_add_group)
    .delete("/api/group/:group_id", f_wbs_del_group)
    .get("/api/member", f_wbs_get_member)
    .post("/api/member", f_wbs_add_member)
    .delete("/api/member/:member_id", f_wbs_del_member)
    .use(function(req, res) {
        res.setHeader("Content-Type", "text/plain");
        res.status(404).send("Page not found");
    })
    .listen(port);

console.log("listening on port " + port);
