/*jslint white, single, node */
"use strict";


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

// validate object field
function f_validate_field(ps_field, ps_field_dict, po_err, po_object, po_req) {
    var lo_msg = {};

    if (ps_field_dict.match(/M/) && (!po_req.body[ps_field])) {
        lo_msg.msg = ps_field + " est obligatoire";
        po_err.msgs.push(lo_msg);
        return 0;
    }

    if (ps_field_dict.match(/I/) && (!String(po_req.body[ps_field]).match(/\d+/))) {
        lo_msg.msg = ps_field + " doit etre un nombre";
        po_err.msgs.push(lo_msg);
        return 0;
    }

    po_object[ps_field] = po_req.body[ps_field];

    return 1;
}

// generic delete function
function f_del_object(po_ctxt) {
    po_ctxt.res.setHeader("Content-type", "application/json");
    var ls_filename = f_get_data_path(po_ctxt.dict.name) + po_ctxt.id + ".json";
    fs.unlink(ls_filename, function(err) {
        if (err) {
            po_ctxt.res.status(404).json({
                msgs: [{
                    msg: po_ctxt.dict.caption + " " + po_ctxt.id + " n\"existe pas"
                }]
            });
        } else {
            po_ctxt.res.sendStatus(204);
        }
    });
}

// generic add function
function f_add_object(po_ctxt) {
    po_ctxt.res.setHeader("Content-type", "application/json");

    var lo_object = {};

    var lo_err = {
        "msgs": []
    };

    // check and gathered provided fields
    Object.keys(po_ctxt.dict.fields).forEach(
        function(ps_field) {
            f_validate_field(ps_field, po_ctxt.dict.fields[ps_field], lo_err, lo_object, po_ctxt.req);
        }
    );

    if (!lo_err.msgs.length) {

        // build id
        lo_object.id = '';
        po_ctxt.dict.pkey.forEach(
            function(ps_field) {
                lo_object.id = lo_object.id + "_" + lo_object[ps_field];
            });

        var ls_filename = f_get_data_path(po_ctxt.dict.name) + lo_object.id + ".json";
        // check unicity
        fs.stat(ls_filename, function(err) {
            if ((err) && (err.code === "ENOENT")) {
                // complete and store record
                var ls_data = JSON.stringify(lo_object);
                fs.writeFile(ls_filename, ls_data, function(err) {
                    if (err) {
                        lo_err.msgs.push({
                            "msg": "echec création " + po_ctxt.dict.caption + "(" +  err + ")" 
                        });
                        po_ctxt.res.status(400).json(lo_err);
                    } else {
                        po_ctxt.res.sendStatus(201);
                    }
                });
            } else {
                lo_err.msgs.push({
                    "msg": po_ctxt.dict.caption + " existe déjà"
                });
                po_ctxt.res.status(400).json(lo_err);
            }
        });
    } else {
        po_ctxt.res.status(400).json(lo_err);
    }
}

/*
 ** group
 */

var go_dict_group = {
    "name": "group",
    "caption": "groupe",
    "fields": {
        "day": "MS",
        "hour": "MI",
        "court": "MI",
        "level": "MS",
        "size": "MI",
        "year": "MI"
    },
    "pkey": ["day", "hour", "court"]
};

// get group
function f_get_group(req, res) {
    res.setHeader("content-type", "application/json");

    var ls_path = f_get_data_path("group");

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

// add group
function f_add_group(req, res) {
    f_add_object({
        "dict": go_dict_group,
        "res": res,
        "req": req
    });
}

// delete group
function f_del_group(req, res) {
    f_del_object({
        "dict": go_dict_group,
        "res": res,
        "id": req.params.group_id
    });
}

/*
 ** member
 */
var go_dict_member = {
    "name": "member",
    "caption": "membre",
    "fields": {
        "name": "MS",
        "firstname": "MS",
        "year": "MI",
        "group_id": "MS"
    },
    "pkey": ["name", "firstname"]
};

// get member
function f_get_member(req, res) {
    // TODO
}

// add member
function f_add_member(req, res) {
    f_add_object({
        "dict": go_dict_member,
        "res": res,
        "req": req
    });
}

// delete member
function f_del_member(req, res) {

    f_del_object({
        "dict": go_dict_member,
        "res": res,
        "id": req.params.member_id
    });
}

/*
 ** route and start
 */
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
