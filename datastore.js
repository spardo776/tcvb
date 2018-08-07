
"use strict";

var fs = require("fs");

var debug = require("debug")("datastore");

/*
 ** utilities
 */

/* po_ctxt description 
.name : object name
.res : express res object for wbs output
.data_in : 
   for get_object : filter object { field:content_regexp,... }
   for add_object : data object { field:content,... } 
   for del_object : object id 
.data_out : data object array [ { field : content, ...}, ... ]
.children : get object children of type provided
.cb_failure : callback function for failure
.cb_success : callback function for success
.http_success : success http code
.http_failure : failure http code
.http_body : has http body boolean
*/

// build data path
function f_get_data_path(ls_class) {
    debug('f_get_data_path');
    return (__dirname + "/" + process.env.DATA_DIR + "/" + ls_class + "/");
}

// validate object fields
function f_validate_fields(po_ctxt, pf_success, pf_failure) {
    debug("f_validate_fields");
    var lo_object = {},
        lo_mydict = po_ctxt.dict[po_ctxt.name],
        lo_pkey_data_in = {};

    // check rules from dictionary
    Object.keys(lo_mydict.fields).forEach(
        function (ps_field_name) {
            debug("Object.keys(lo_mydict.fields).forEach %s", ps_field_name);
            var lo_msg = {},
                lx_field_value = po_ctxt.data_in[ps_field_name],
                ls_field_rule = po_ctxt.dict[po_ctxt.name].fields[ps_field_name].ctrl,
                ls_field_caption = po_ctxt.dict[po_ctxt.name].fields[ps_field_name].caption;
            if (ls_field_rule.match(/M/) && (!lx_field_value)) {
                lo_msg.msg = ls_field_caption + " est obligatoire";
                po_ctxt.msgs.push(lo_msg);
                return null;
            }
            if (ls_field_rule.match(/I/) && (!String(lx_field_value).match(/\d+/))) {
                lo_msg.msg = ls_field_caption + " doit etre un nombre";
                po_ctxt.msgs.push(lo_msg);
                return null;
            }
            if (!(ls_field_rule.match(/I/))) {
                // upper/lowercase
                if (ls_field_rule.match(/L/)) {
                    lx_field_value = String(lx_field_value).toLowerCase();
                }
                if (ls_field_rule.match(/U/)) {
                    lx_field_value = String(lx_field_value).toUpperCase();
                }
            }
            lo_object[ps_field_name] = lx_field_value;

            return 1;
        }
    );


    if (po_ctxt.msgs.length) {
        pf_failure();
    }
    else {
        // check primary key
        // setup criteria on pkey
        lo_mydict.pkey.forEach(
            function (ps_field) {
                debug('lo_mydict.pkey.forEach %s', ps_field);
                lo_pkey_data_in[ps_field] = lo_object[ps_field];
            }
        );
        // search object with same pkey    
        exports.f_get_object({
            "name": po_ctxt.name,
            "data_in": lo_pkey_data_in,
            "res": po_ctxt.res, // same as object
            "cb_failure": function () { pf_failure(); },
            "cb_success": function (po_pkey_ctxt) {
                debug('f_get_object.cb_success %S %j %s', po_pkey_ctxt.name, po_pkey_ctxt.data_in, po_pkey_ctxt.data_out.length);
                var la_dup_pkey = po_pkey_ctxt.data_out.filter(function (po_object) { return (po_object.id !== po_ctxt.data_in.id); });

                if (la_dup_pkey.length) {
                    po_ctxt.msgs.push({
                        "msg": lo_mydict.caption + " existe déjà"
                    });
                    pf_failure();
                } else {
                    pf_success(lo_object);
                }
            }
        });
    }
}

// generic delete function
exports.f_del_object = function (po_ctxt) {

    debug('f_del_object %s %j', po_ctxt.name, po_ctxt.data_in);

    var lo_mydict = po_ctxt.dict[po_ctxt.name],
        ls_filename = f_get_data_path(po_ctxt.name) + po_ctxt.data_in + ".json";
    po_ctxt.msgs = [];
    po_ctxt.data_out = [];
    po_ctxt.http_success = 204;
    po_ctxt.http_failure = 404;
    po_ctxt.http_body = false;

    fs.unlink(ls_filename,
        function (err) {
            debug('fs.unlink %s' + ls_filename);
            if (err) {
                po_ctxt.msgs.push({
                    msg: lo_mydict.caption + " n'existe pas",
                    diag: err
                });
            }
            if (po_ctxt.msgs.length) {
                po_ctxt.cb_failure(po_ctxt);

            } else {
                po_ctxt.cb_success(po_ctxt);
            }
        });
};

// generic add function
exports.f_add_object = function (po_ctxt) {

    debug('f_add_object %s %j', po_ctxt.name, po_ctxt.data_in);

    po_ctxt.msgs = [];
    po_ctxt.data_out = [];
    po_ctxt.http_success = 201;
    po_ctxt.http_failure = 400;
    po_ctxt.http_body = false;

    var lo_mydict = po_ctxt.dict[po_ctxt.name];

    f_validate_fields(po_ctxt,
        // success CB 
        function (po_object) {
            debug('f_validate_fields.cb_success');
            po_object.id = Date.now();
            var ls_filename = f_get_data_path(po_ctxt.name) + po_object.id + ".json";
            // check unicity
            fs.stat(ls_filename,
                function (err) {
                    debug('fs.stat');
                    if (err && (err.code === "ENOENT")) {
                        // complete and store record
                        var ls_data = JSON.stringify(po_object);
                        fs.writeFile(ls_filename, ls_data,
                            function (err) {
                                debug('fs.writeFile');
                                if (err) {
                                    po_ctxt.msgs.push({
                                        "msg": "echec création " + lo_mydict.caption,
                                        "diag": err
                                    });
                                    po_ctxt.cb_failure(po_ctxt);

                                } else {
                                    po_ctxt.cb_success(po_ctxt);
                                }
                            });
                    } else {
                        po_ctxt.msgs.push({
                            "msg": lo_mydict.caption + " existe déjà",
                            "diag": err
                        });
                        po_ctxt.cb_failure(po_ctxt);

                    }
                }
            );
        },
        //failure CB
        function () { debug('f_validate_fields.cb_failure'); po_ctxt.cb_failure(po_ctxt); }
    );
};

// generic add function
exports.f_upd_object = function (po_ctxt) {

    debug('f_upd_object %s %j', po_ctxt.name, po_ctxt.data_in);

    po_ctxt.msgs = [];
    po_ctxt.data_out = [];
    po_ctxt.http_success = 200;
    po_ctxt.http_failure = 400;
    po_ctxt.http_body = false;

    var lo_mydict = po_ctxt.dict[po_ctxt.name];


    f_validate_fields(po_ctxt,
        //success CB
        function (po_object) {
            debug('f_validate_fields.cb_success');
            po_object.id = po_ctxt.data_in.id;
            var ls_filename = f_get_data_path(po_ctxt.name) + po_object.id + ".json";
            // check unicity
            fs.stat(ls_filename,
                function (err) {
                    debug('fs.stat');
                    if (!(err && (err.code === "ENOENT"))) {
                        // complete and store record
                        var ls_data = JSON.stringify(po_object);
                        fs.writeFile(ls_filename, ls_data,
                            function (err) {
                                debug('fs.writeFile');
                                if (err) {
                                    po_ctxt.msgs.push({
                                        "msg": "echec modification " + lo_mydict.caption,
                                        "diag": err
                                    });
                                    po_ctxt.cb_failure(po_ctxt);

                                } else {
                                    po_ctxt.cb_success(po_ctxt);
                                }
                            });
                    } else {
                        po_ctxt.msgs.push({
                            "msg": lo_mydict.caption + "n'existe pas",
                            "diag": err
                        });
                        po_ctxt.cb_failure(po_ctxt);

                    }
                }
            );
        },
        //failure CB
        function () {
            debug('f_validate_fields.cb_failure');
            po_ctxt.cb_failure(po_ctxt);
        }
    );
};

// generic get parent
function f_get_parent(po_ctxt) {

    debug('f_get_parent %s %j %s', po_ctxt.name, po_ctxt.data_in, po_ctxt.data_out.length);

    if ((po_ctxt.data_out.length) && (po_ctxt.parent) && (po_ctxt.parent.length)) {
        //loop on parent types
        po_ctxt.parent.forEach(
            function (ps_parent_name, pi_parent_idx, pa_parent) {
                debug('po_ctxt.parent.forEach %s', ps_parent_name);
                var lb_lst_parent = (pi_parent_idx === (pa_parent.length - 1));

                //loop on data objects
                po_ctxt.data_out.forEach(
                    function (po_object, pi_object_idx, pa_object) {
                        debug('po_ctxt.data_out.forEach %s', po_object.id);
                        var lb_lst_object = (pi_object_idx === (pa_object.length - 1)),
                            lo_parent_data_in = {};
                        // build search criteria (foreign key) 

                        lo_parent_data_in.id = po_object[ps_parent_name + "_id"];

                        // get children
                        exports.f_get_object({
                            "name": ps_parent_name,
                            "data_in": lo_parent_data_in,
                            "res": po_ctxt.res, // same as object
                            "cb_failure": po_ctxt.cb_failure, // same as object
                            "cb_success": function (po_parent_ctxt) {
                                po_object[ps_parent_name] = po_parent_ctxt.data_out;
                                debug('cb_success %s %j %s', po_parent_ctxt.name, po_parent_ctxt.data_in, po_parent_ctxt.data_out.length);
                                //last runner - trigger object success
                                if (lb_lst_parent && lb_lst_object) {
                                    po_ctxt.cb_success(po_ctxt);
                                }
                            }
                        });
                    }
                );
            }
        );
    } else {
        po_ctxt.cb_success(po_ctxt);
    }
}

// generic get children
function f_get_children(po_ctxt) {

    debug('f_get_children %s %j %s', po_ctxt.name, po_ctxt.data_in, po_ctxt.data_out.length);

    if ((po_ctxt.data_out.length) && (po_ctxt.children) && (po_ctxt.children.length)) {
        //loop on children types
        po_ctxt.children.forEach(
            function (ps_child_name, pi_child_idx, pa_children) {
                debug('po_ctxt.children.forEach %s', ps_child_name);
                var lb_lst_child = (pi_child_idx === (pa_children.length - 1));

                //loop on data objects
                po_ctxt.data_out.forEach(
                    function (po_object, pi_object_idx, pa_object) {
                        debug('po_ctxt.data_out.forEach %s', po_object.id);
                        var lb_lst_object = (pi_object_idx === (pa_object.length - 1)),
                            lo_child_data_in = {};
                        // build search criteria (foreign key) 

                        lo_child_data_in[po_ctxt.name + "_id"] = po_object.id;

                        // get children
                        exports.f_get_object({
                            "name": ps_child_name,
                            "data_in": lo_child_data_in,
                            "res": po_ctxt.res, // same as object
                            "cb_failure": po_ctxt.cb_failure, // same as object
                            "cb_success": function (po_child_ctxt) {
                                debug('f_get_object.cb_success');
                                po_object[ps_child_name] = po_child_ctxt.data_out;
                                debug('cb_success %s %j %s', po_child_ctxt.name, po_child_ctxt.data_in, po_child_ctxt.data_out.length);
                                //last runner - trigger object success
                                if (lb_lst_child && lb_lst_object) {
                                    f_get_parent(po_ctxt);
                                }
                            }
                        });
                    }
                );
            }
        );
    } else {
        f_get_parent(po_ctxt);
    }
}


// generic get function
exports.f_get_object = function (po_ctxt) {
    debug('f_get_object %s %j', po_ctxt.name, po_ctxt.data_in);

    var ls_path = f_get_data_path(po_ctxt.name);

    po_ctxt.msgs = [];
    po_ctxt.data_out = [];
    po_ctxt.http_success = 200;
    po_ctxt.http_failure = 400;
    po_ctxt.http_body = true;

    //dump each file in data/group directory into an array of json files
    fs.readdir(ls_path,
        function (err, pa_files) {
            debug('fs.readdir');
            if (err) {
                po_ctxt.msgs.push({
                    "msg": "echec accès données",
                    "diag": err
                });
                po_ctxt.cb_failure(po_ctxt);
            } else {
                var la_json_files = pa_files.filter(function (file) { return file.match(/\.json$/); });

                if (la_json_files.length) {
                    // loop on files
                    la_json_files.forEach(
                        function (file, idx, files) {
                            debug('la_json_files.forEach %s', file);
                            fs.readFile(
                                ls_path + file, "utf8",
                                function (err, data) {
                                    debug('fs.readFile %s', file);
                                    var lb_lst_file = (idx === files.length - 1),
                                        lo_object = JSON.parse(data),
                                        lb_select = 1;

                                    if (err) {
                                        po_ctxt.msgs.push({
                                            "msg": "echec accès données",
                                            "diag": err
                                        });
                                        po_ctxt.cb_failure(po_ctxt);
                                    }

                                    // loop on filters		
                                    Object.keys(po_ctxt.data_in).forEach(
                                        function (ps_key) {
                                            debug('Object.keys(po_ctxt.data_in).forEach %s', ps_key);
                                            if ((po_ctxt.data_in[ps_key]) &&
                                                (lo_object[ps_key])) {
                                                // build filtering regexp
                                                var ls_filter = po_ctxt.data_in[ps_key]
                                                    .replace(/[\\\^\$\{\}\[\]\(\)\.\+\|]/g, '') // remove regexp special chars
                                                    .replace(/\*/g, '.*') // * wildcard allowed
                                                    .replace(/\?/g, '.'); // ? wildcard allowed
                                                if (!String(lo_object[ps_key]).match("^" + ls_filter + "$")) {
                                                    lb_select = 0;
                                                }
                                            }
                                        }
                                    );

                                    if (lb_select) {
                                        po_ctxt.data_out.push(lo_object);
                                    }
                                    if (lb_lst_file) {
                                        f_get_children(po_ctxt); // last file => trigger get children 
                                    }
                                } // end - cb readfile
                            );

                        }
                    );
                } else {
                    // no file
                    po_ctxt.cb_success(po_ctxt);
                }

            }
        }
    );
};


// callback wbs failure
exports.f_wbs_failure = function (po_ctxt) {
    debug('f_wbs_failure %s %j %s %s', po_ctxt.name, po_ctxt.data_in, po_ctxt.msgs.length, po_ctxt.msgs[0]);
    po_ctxt.res.setHeader("Content-type", "application/json");
    po_ctxt.res.status(po_ctxt.http_failure).json(po_ctxt.msgs);
};

// callback wbs success
exports.f_wbs_success = function (po_ctxt) {
    debug('f_wbs_success %s %j %s', po_ctxt.name, po_ctxt.data_in, po_ctxt.data_out.length);
    po_ctxt.res.setHeader("Content-type", "application/json");
    if (po_ctxt.http_body) {
        po_ctxt.res.status(po_ctxt.http_success).json(po_ctxt.data_out);
    } else {
        po_ctxt.res.sendStatus(po_ctxt.http_success);
    }
};

