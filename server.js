/*jslint white, single, node */
"use strict";



var express = require("express");
var app = express();
var fs = require("fs");

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

var port = process.env.PORT || 8080;

// build data path
function f_data_path(ls_class) {
    return (__dirname + "/data/" + ls_class + "/");
}

// get group
function f_get_group(req, res) {
    res.setHeader("content-type", "application/json");

    var ls_path = f_data_path("group");

    //dump each file in data/group directory into an array of json files
    fs.readdir(ls_path,
        function(err, files) {
            if (err) {
                return console.error(err);
            }

            var lo_result = [];

            // loop on files
            files.forEach(
                function(file, idx, files) {
                    if (file.match(/\.json$/)) {
                        fs.readFile(
                            ls_path + file, "utf8",
                            function(err, data) {
                                if (err) {
                                    return console.error(err);
                                }

                                var lo_group = JSON.parse(data);
                                var lb_select = 1;

                                // loop on filters		
                                Object.keys(req.query).forEach(
                                    function(ps_key) {
                                        if ((req.query[ps_key]) &&
                                            (lo_group[ps_key]) &&
                                            (req.query[ps_key] !== String(lo_group[ps_key]))) {
                                            lb_select = 0;
                                        }
                                    }
                                );

                                if (req.query.hasOwnProperty("is_free") && (lo_group.free === 0)) {
                                    lb_select = 0;
                                }

                                if (lb_select) {
                                    //output data	
                                    lo_result.push(lo_group);
                                }

                                if ((files.length - 1) === idx) {
                                    res.json(lo_result);
                                }
                            }
                        );
                    }
                }
            );
        });
}

function validate_object(ps_key, po_dict, po_err, po_object, po_req) {
    var lo_msg = {};

    if (po_dict[ps_key].match(/M/) && (!po_req.body[ps_key])) {
        lo_msg.msg = ps_key + " est obligatoire";
        po_err.msgs.push(lo_msg);
        return 0;
    }

    if (po_dict[ps_key].match(/I/) && (!String(po_req.body[ps_key]).match(/\d+/))) {
        lo_msg.msg = ps_key + " doit etre un nombre";
        po_err.msgs.push(lo_msg);
        return 0;
    }

    po_object[ps_key] = po_req.body[ps_key];

    return 1;
}


// add group
function f_add_group(req, res) {
    res.setHeader("content-type", "application/json");

    var lo_dict = {
        "day": "MS",
        "hour": "MI",
        "court": "MI",
        "level": "MS",
        "size": "MI",
        "year": "MI"
    };

    var lo_err = {
        "msgs": []
    };
    var lo_group = {};

    // check and gathered provided fields
    Object.keys(lo_dict).forEach(
        function(key) {
            validate_object(key, lo_dict, lo_err, lo_group, req);
        }
    );

    if (!lo_err.msgs.length) {
        lo_group.id = req.body.day.substr(0, 2) + "_" + req.body.hour + "_" + req.body.court;
        var ls_filename = f_data_path("group") + lo_group.id + ".json";

        // check unicity
        fs.stat(ls_filename, function(err) {
            if ((err) && (err.code === "ENOENT")) {
                // complete and store record
                lo_group.members = [];
                var ls_data = JSON.stringify(lo_group);
                fs.writeFile(ls_filename, ls_data, function(err) {
                    if (err) {
                lo_err.msgs.push({
                    "msg": "echec création groupe"
                });
                        res.status(400).json(lo_err);
                    } else {
                    res.sendStatus(201);
                    }
                });
            } else {
                lo_err.msgs.push({
                    "msg": "ce groupe existe déjà"
                });
                res.status(400).json(lo_err);
            }
        });
    } else {
        res.status(400).json(lo_err);
    }
}

// delete group
function f_del_group(req, res) {
    f_del_object ( { "res" : res, 
"object_name": "group", 
"object_id": req.params.group_id, 
"object_caption": "groupe" } );
}

// get member
function f_get_member(req, res) {
}

// add member
function f_add_member(req, res) {

    res.setHeader("Content-type", "application/json");
    
    var lo_dict = {
        "name": "MS",
        "firstname": "MS",
        "year": "MI",
        "group_id": "MS"
    };

    var lo_err = {
        "msgs": []
    };


    var lo_member = {};

    // check and gathered provided fields
    Object.keys(lo_dict).forEach(
        function(key) {
            validate_object(key, lo_dict, lo_err, lo_member, req);
        }
    );

    if (!lo_err.msgs.length) {
        lo_member.id = lo_member.name + "_" + lo_member.firstname;

        var ls_filename = f_data_path("member") + lo_member.id + ".json";
 // check unicity
        fs.stat(ls_filename, function(err) {
            if ((err) && (err.code === "ENOENT")) {
                // complete and store record
                var ls_data = JSON.stringify(lo_member);
                fs.writeFile(ls_filename, ls_data, function(err) {
                    if (err) {
                lo_err.msgs.push({
                    "msg": "echec création membre"
                });
                        res.status(400).json(lo_err);
                    } else {
                    res.sendStatus(201);
                    }
                });
            } else {
                lo_err.msgs.push({
                    "msg": "ce membre existe déjà"
                });
                res.status(400).json(lo_err);
            }
        });
    } else {
        res.status(400).json(lo_err);
    }

}

function f_del_object( po_ctxt )
{
 po_ctxt.res.setHeader("Content-type", "application/json");
 var ls_filename = f_data_path(po_ctxt.object_name) + po_ctxt.object_id + ".json";
 fs.unlink(ls_filename, function(err) {
        if (err) {
            po_ctxt.res.status(404).json({
                msgs: [{
                    msg: po_ctxt.object_caption + po_ctxt.object_id + " n\"existe pas"
                }]
            });
        } else {
            po_ctxt.res.sendStatus(204);
        }
    });
}

// delete member
function f_del_member(req, res) {

    f_del_object ( { "res" : res, 
"object_name": "member", 
"object_id": req.params.member_id, 
"object_caption": "membre" } );
}


app
    .get("/api/group", f_get_group)
    .post("/api/group", f_add_group)
    .delete("/api/group/:group_id", f_del_group)
    .get("/api/member", f_get_member)
    .post("/api/member", f_add_member)
    .delete("/api/member/:member_id", f_del_member)
    .use(function(req, res, next) {
        res.setHeader("Content-Type", "text/plain");
        res.status(404).send("Page not found");
    })
    .listen(port);

console.log("listening on port " + port);
