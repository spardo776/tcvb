debug
/*
 ** data dictionary

    {
     "<object_name>": 
        {
            "caption": "<caption>",
            "fields": {
            "<field_name>": "<rule string : M andatory, I nteger, Uppercase, L owercase",
            ...
            },
            "pkey": ["field_name", ...]
        },
    ...
    },

 ** 
 */

/*
group.level
Terrain blanc : A partir de 5 ans / 8 m de long sans filet avec ballon blanc (20 cm de diamètre).

Terrain violet : A partir de 6 ans / 11 m avec filet à 0,50 m et une balle violette (15 cm de diamètre).

Terrain rouge : A partir de 6 ans / 12,8 m avec filet de 0,80 m et balle rouge (7,5 cm de diamètre)

Terrain orange : A partir de 7 ans / 18 m avec filet à 0,80 m et balle orange.

Terrain vert : A partir de 9 ans / Court de tennis traditionnel avec balle verte.
 */

"use strict";

var go_ds = require('./datastore');
var debug = require('debug')('dict_tcvb');

exports.group = {
    "caption": "groupe",
    "fields": {
        "day": { ctrl: "MSL", caption: "jour" },
        "hour": { ctrl: "MI", caption: "heure" },
        "court": { ctrl: "MSL", caption: "court" },
        "level": { ctrl: "MSL", caption: "niveau" },
        "size": { ctrl: "MI", caption: "taille" },
        "year": { ctrl: "MI", caption: "année" }
    },
    "pkey": ["day", "hour", "court"],
    "f_validate_object": function (po_object, po_ctxt, pf_success, pf_failure) {
        debug('f_validate_object %s',po_ctxt.name);
        if (po_object.year < 1920 || po_object.year > 2015) {
            po_ctxt.msgs.push({ msg: 'année invalide' });
        }
        if (po_ctxt.msgs.length) { pf_failure(); } else { pf_success(po_object); }
    }
};

exports.member = {
    "caption": "membre",
    "fields": {
        "name": { ctrl: "MSU", caption: "nom" },
        "firstname": { ctrl: "MSL", caption: "prénom" },
        "year": { ctrl: "MI", caption: "année" },
        "group_id": { ctrl: "MS", caption: "group id" }
    },
    "pkey": ["name", "firstname"],
    "f_validate_object":
        function (po_object, po_ctxt, pf_success, pf_failure) {

            debug('f_validate_object %s',po_ctxt.name);

            if (po_object.year < 1920 || po_object.year > 2015) {
                po_ctxt.msgs.push({ msg: 'année invalide' });
            }
            if (po_ctxt.msgs.length) {
                pf_failure();
            }
            else {
                if (po_ctxt.edit_mode === 'add') {
                    go_ds.f_get_object({
                        "dict": po_ctxt.dict,
                        "name": "group",
                        "res": po_ctxt.res,
                        "data_in": { "id": po_object.group_id },
                        "children": ["member"],
                        "cb_failure": pf_failure,
                        "cb_success": function (po_ctxt) {
                            debug('f_validate_object/f_get_object/cb_success');

                            var lo_group;
                            if (po_ctxt.data_out.length === 1) {
                                lo_group = po_ctxt.data_out[0];
                                if ((!lo_group.member) || (!lo_group.member.length) || (lo_group.size - lo_group.member.length > 0)) {
                                    pf_success(po_object);
                                }
                                else {
                                    po_ctxt.msgs.push({ msg: 'groupe complet' });
                                    pf_failure();
                                }
                            } else {
                                po_ctxt.msgs.push({ msg: 'echec recherche groupe' });
                                pf_failure();
                            }
                        }
                    });

                }
                else {
                    pf_success(po_object);
                }
            }
        }
};
