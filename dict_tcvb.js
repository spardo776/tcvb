/*jslint white, single, node */

/*
 ** data dictionary

    {
     "<object_name>": 
        {
            "caption": "<caption>",
            "fields": {
            "<field_name>": "<rule string : M for mandat, I for integer",
            ...
            },
            "pkey": ["field_name", ...]
        },
    ...
    },

 ** 
 */

exports.group={
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

exports.member={
        "caption": "membre",
        "fields": {
            "name": "MS",
            "firstname": "MS",
            "year": "MI",
            "group_id": "MS"
        },
        "pkey": ["name", "firstname"]
    };
