/*jslint white, single, node */

"use strict";

var fs = require("fs");

/*
 ** utilities
 */

/* po_ctxt description 
.name : object name
.res : express res object for wbs output
.data_in : 
   for get_object : filter object { field:content,... } 
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
    return (__dirname + "/data/" + ls_class + "/");
}

// validate object fields
function f_validate_fields(po_ctxt, po_object) {

    var lo_mydict = po_ctxt.dict[po_ctxt.name];

    Object.keys(lo_mydict.fields).forEach(
        function(ps_field_name) {
            var lo_msg = {};

            var lx_field_value = po_ctxt.data_in[ps_field_name];
            var ls_field_rule = po_ctxt.dict[po_ctxt.name].fields[ps_field_name];
            if (ls_field_rule.match(/M/) && (!lx_field_value)) {
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
exports.f_del_object = function (po_ctxt) {

    console.log('f_del_object', po_ctxt.name, po_ctxt.data_in);

    var lo_mydict = po_ctxt.dict[po_ctxt.name];
    po_ctxt.msgs = [];
    po_ctxt.data_out = [];
    po_ctxt.http_success=204;
    po_ctxt.http_failure=404;
    po_ctxt.http_body=false;

    var ls_filename = f_get_data_path(po_ctxt.name) + po_ctxt.data_in + ".json";
    fs.unlink(ls_filename, function(err) {
        if (err) {
            po_ctxt.msgs.push({
                msg: lo_mydict.caption + " n\"existe pas",
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
exports.f_add_object=function (po_ctxt) {

    console.log('f_add_object', po_ctxt.name, po_ctxt.data_in);

    var lo_object = {};

    po_ctxt.msgs = [];
    po_ctxt.data_out = [];
    po_ctxt.http_success=201;
    po_ctxt.http_failure=400;
    po_ctxt.http_body=false;

    var lo_mydict = po_ctxt.dict[po_ctxt.name];

    f_validate_fields(po_ctxt, lo_object);

    if (!po_ctxt.msgs.length) {

        // build id
        lo_object.id = '';
        lo_mydict.pkey.forEach(
            function(ps_field) {
                lo_object.id = lo_object.id + "_" + lo_object[ps_field];
            });

        var ls_filename = f_get_data_path(po_ctxt.name) + lo_object.id + ".json";
        // check unicity
        fs.stat(ls_filename,
            function(err) {
                if ((err) && (err.code === "ENOENT")) {
                    // complete and store record
                    var ls_data = JSON.stringify(lo_object);
                    fs.writeFile(ls_filename, ls_data, function(err) {
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
    } else {
        po_ctxt.cb_failure(po_ctxt);
    }
};

// generic add function
exports.f_upd_object=function (po_ctxt) {
    
        console.log('f_upd_object', po_ctxt.name, po_ctxt.data_in);
    
        var lo_object = {};
    
        po_ctxt.msgs = [];
        po_ctxt.data_out = [];
        po_ctxt.http_success=200;
        po_ctxt.http_failure=400;
        po_ctxt.http_body=false;
    
        var lo_mydict = po_ctxt.dict[po_ctxt.name];
    
            
        f_validate_fields(po_ctxt, lo_object);
    
        lo_object.id=po_ctxt.data_in.id;

        if (!po_ctxt.msgs.length) {
                    
            var ls_filename = f_get_data_path(po_ctxt.name) + lo_object.id + ".json";
            // check unicity
            fs.stat(ls_filename,
                function(err) {
                    if (! ( (err) && (err.code === "ENOENT"))) {
                        // complete and store record
                        var ls_data = JSON.stringify(lo_object);
                        fs.writeFile(ls_filename, ls_data, function(err) {
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
        } else {
            po_ctxt.cb_failure(po_ctxt);
        }
    };
    
    
// generic get children
function f_get_children(po_ctxt) {

    console.log('f_get_children', po_ctxt.name, po_ctxt.data_in, po_ctxt.data_out.length);

    if ((po_ctxt.data_out.length)&&(po_ctxt.children) && (po_ctxt.children.length)) {
        //loop on children types
        po_ctxt.children.forEach(
            function(ps_child_name, pi_child_idx, pa_children) {

                var lb_lst_child = (pi_child_idx === (pa_children.length - 1));

                //loop on data objects
                po_ctxt.data_out.forEach(
                    function(po_object, pi_object_idx, pa_object) {

                        var lb_lst_object = (pi_object_idx === (pa_object.length - 1));
                        // build search criteria (foreign key) 
                        var lo_child_data_in = {};

                        lo_child_data_in[po_ctxt.name + "_id"] = po_object.id;

                        // get children
                        exports.f_get_object({
                            "name": ps_child_name,
                            "data_in": lo_child_data_in,
                            "res" : po_ctxt.res, // same as object
                            "cb_failure": po_ctxt.cb_failure, // same as object
                            "cb_success": function(po_child_ctxt) {
                                po_object[ps_child_name] = po_child_ctxt.data_out;
                                console.log('cb_success',po_child_ctxt.name, po_child_ctxt.data_in, po_child_ctxt.data_out.length);    
                                //last runner - trigger object success
                                if (lb_lst_child && lb_lst_object) {
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


// generic get function
exports.f_get_object = function (po_ctxt) {
    console.log('f_get_object', po_ctxt.name, po_ctxt.data_in);

    var ls_path = f_get_data_path(po_ctxt.name);

    po_ctxt.msgs = [];
    po_ctxt.data_out = [];
    po_ctxt.http_success=200;
    po_ctxt.http_failure=400;
    po_ctxt.http_body=true;

    //dump each file in data/group directory into an array of json files
    fs.readdir(ls_path,
        function(err, pa_files) {
            if (err) {
                po_ctxt.msgs.push({
                    "msg": "echec accès données",
                    "diag": err
                });
                po_ctxt.cb_failure(po_ctxt);
            } else {
                var la_json_files=pa_files.filter(function(file){ return file.match(/\.json$/); });

                if (la_json_files.length)
                {
                // loop on files
                la_json_files.forEach(
                    function(file, idx, files) {
                            fs.readFile(
                                ls_path + file, "utf8",
                                function(err, data) {

                                    var lb_lst_file = ( idx === files.length - 1 );

                                    if (err) {
                                        po_ctxt.msgs.push({
                                            "msg": "echec accès données",
                                            "diag": err
                                        });
                                        po_ctxt.cb_failure(po_ctxt);
                                    }

                                    var lo_object = JSON.parse(data);
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
                }  else {
                    // no file
                    po_ctxt.cb_success(po_ctxt);
                }  
                
            }
        }
    );
};


// callback wbs failure
exports.f_wbs_failure = function (po_ctxt) {
    console.log('f_wbs_failure', po_ctxt.msgs.length, po_ctxt.msgs[0]);
    po_ctxt.res.setHeader("Content-type", "application/json");
    po_ctxt.res.status(po_ctxt.http_failure).json(po_ctxt.msgs);
};

// callback wbs success
exports.f_wbs_success = function (po_ctxt) {
    console.log('f_wbs_success', po_ctxt.data_out.length);
    po_ctxt.res.setHeader("Content-type", "application/json");
    if (po_ctxt.http_body) {
        po_ctxt.res.status(po_ctxt.http_success).json(po_ctxt.data_out);
    } else {
        po_ctxt.res.sendStatus(po_ctxt.http_success);
    }
};

