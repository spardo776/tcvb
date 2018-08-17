
"use strict";

/*
 ** modules
 **/


var go_dict = require("./dict_tcvb");

var go_ds = require('./datastore');

// WBS get group
function f_wbs_get_group(req, res) {
    go_ds.f_get_object({
        "dict": go_dict,
        "name": "group",
        "res": res, 
        "data_in": req.query,
        "children": ["member"],
        "cb_failure": go_ds.f_wbs_failure,
        "cb_success": function (po_ctxt) {

            // compute isfree property
            po_ctxt.data_out.forEach(
                function (po_object) {
                    po_object.isfree = (!po_object.member) || (!po_object.member.length) || (po_object.size - po_object.member.length > 0);
                });

            // handle filter isfree
            if (po_ctxt.data_in.hasOwnProperty("isfree")) {
                po_ctxt.data_out = po_ctxt.data_out.filter(
                    function (po_object) {
                        return (po_object.isfree);
                    }
                );
            }

            go_ds.f_wbs_success(po_ctxt);
        }
    });
}

// WBS add group
function f_wbs_add_group(req, res) {
    go_ds.f_add_object({
        "dict": go_dict,
        "name": "group",
        "res": res,
        "data_in": req.body,
        "cb_failure": go_ds.f_wbs_failure,
        "cb_success": go_ds.f_wbs_success
    });
}

// WBS upd group
function f_wbs_upd_group(req, res) {
    go_ds.f_upd_object({
        "dict": go_dict,
        "name": "group",
        "res": res,
        "data_in": req.body,
        "cb_failure": go_ds.f_wbs_failure,
        "cb_success": go_ds.f_wbs_success
    });
}

// WBS delete group
function f_wbs_del_group(req, res) {
    go_ds.f_del_object({
        "dict": go_dict,
        "name": "group",
        "res": res,
        "data_in": req.params.group_id,
        "cb_failure": go_ds.f_wbs_failure,
        "cb_success": go_ds.f_wbs_success
    });
}

/*
 ** member
 */

// WBS get member
function f_wbs_get_member(req, res) {
    go_ds.f_get_object({
        "dict": go_dict,
        "name": "member",
        "res": res,
        "data_in": req.query,
        "parent": ["group"],
        "cb_failure": go_ds.f_wbs_failure,
        "cb_success": go_ds.f_wbs_success
    });
}

// WBS add member
function f_wbs_add_member(req, res) {
    go_ds.f_add_object({
        "dict": go_dict,
        "name": "member",
        "res": res,
        "data_in": req.body,
        "cb_failure": go_ds.f_wbs_failure,
        "cb_success": go_ds.f_wbs_success
    });
}

// WBS upd member
function f_wbs_upd_member(req, res) {
    go_ds.f_upd_object({
        "dict": go_dict,
        "name": "member",
        "res": res,
        "data_in": req.body,
        "cb_failure": go_ds.f_wbs_failure,
        "cb_success": go_ds.f_wbs_success
    });
}

// WBS delete member
function f_wbs_del_member(req, res) {

    go_ds.f_del_object({
        "dict": go_dict,
        "name": "member",
        "res": res,
        "data_in": req.params.member_id,
        "cb_failure": go_ds.f_wbs_failure,
        "cb_success": go_ds.f_wbs_success
    });
}


/*
 ** init application
 */

var express = require("express");
var morgan = require("morgan");
var express_basic_auth = require ("express-basic-auth");
var go_expasswd = require("./expasswd.js");

var app = express();

app.use(morgan(':date[iso] :remote-addr :remote-user :method :url HTTP/:http-version :status :res[content-length] - :response-time ms'));

app.use(express_basic_auth(
    { users: go_expasswd.users,
        challenge: true,
        realm: "Inscriptions TCVB"
    }));

app.use(express.urlencoded({
    extended: true
}));
app.use(express.json());

var port = process.env.PORT || 8080;

/*
 ** route and start
 */
app
    .get("/api/group", f_wbs_get_group)
    .post("/api/group", f_wbs_add_group)
    .put("/api/group", f_wbs_upd_group)
    .delete("/api/group/:group_id", f_wbs_del_group)
    .get("/api/member", f_wbs_get_member)
    .post("/api/member", f_wbs_add_member)
    .put("/api/member", f_wbs_upd_member)
    .delete("/api/member/:member_id", f_wbs_del_member)
    .use(express.static(__dirname + "/static"))
    // .use(function(req, res) {
    //     res.setHeader("Content-Type", "text/plain");
    //     res.status(404).send("Page not found");
    // })
    .listen(port);

var log_date = new Date(Date.now());
console.log(log_date.toUTCString() + " listening on port " + port);
