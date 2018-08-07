
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
exports.group={
            "caption": "groupe",
        "fields": {
            "day": { ctrl : "MSL", caption : "jour" },
            "hour": { ctrl : "MI", caption : "heure" },
            "court": { ctrl : "MSL", caption : "court" },
            "level": { ctrl : "MSL", caption : "niveau" },
            "size": { ctrl : "MI", caption : "taille" },
            "year": { ctrl : "MI", caption : "année" }
        },
        "pkey": ["day", "hour", "court"]
    };

exports.member={
        "caption": "membre",
        "fields": {
            "name": { ctrl : "MSU", caption : "nom" },
            "firstname": { ctrl : "MSL", caption : "prénom" },
            "year": { ctrl : "MI", caption : "année" },
            "group_id": { ctrl : "MS", caption : "group id" }
        },
        "pkey": ["name", "firstname"]
    };
