// jslint --edition=latest --node  --white --color  --this  tcvb.js

"use strict";

bootbox.setLocale('fr');

const go_axios = axios.create({
    timeout: 1000
});
//
// UTILS
//

function f_build_filter_re(ps_filter, ps_case) {
    var ls_filter_re;

    if (ps_case === 'upper') {
        ls_filter_re = ps_filter.toUpperCase();
    } else {
        if (ps_case === 'lower') {
            ls_filter_re = ps_filter.toLowerCase();
        } else {
            ls_filter_re = ps_filter;
        }
    }

    ls_filter_re = ls_filter_re
        .replace(/[\\\^\$\{\}\[\]\(\)\?\+\|]/g, '') // remove regexp special chars
        .replace(/[\*\.]/g, '.*'); // * and . wildcard allowed => /.*/

    ls_filter_re = '^' + ls_filter_re + '$';
    return (ls_filter_re);
}

function f_isadmin() { return (go_user && (go_user.profile === "A")); }

function f_level_class_name(ps_level) {
    return ('class-level-'+(ps_level ? ps_level.replace('/','-') : 'unknown'));
}

//
// LISTS OF VALUES 
//

const go_levellist = [{ name: "nouveau" }, { name: "nouv-violet" }, { name: "nouv-rouge" }, { name: "nouv-orange" },
{ name: "blanc" }, { name: "violet" }, { name: "rouge" }, { name: "orange" }, { name: "vert" },
{ name: "moyen" }, { name: "nc" },
{ name: "30/5" }, { name: "30/4" }, { name: "30/3" }, { name: "30" }, { name: "15/4" }, { name: "libre" }];

const go_courtlist = [{ name: "1" }, { name: "2" }, { name: "3" }, { name: "jazy1" }, { name: "jazy2" }, { name: "jazy3" }];

const go_sizelist = [{ name: 4 }, { name: 6 }, { name: 7 }, { name: 8 }];

const go_daylist = [{ name: "lundi", order: 1 }, { name: "mardi", order: 2 }, { name: "mercredi", order: 3 }, { name: "jeudi", order: 4 }, { name: "vendredi", order: 5 }, { name: "samedi", order: 6 }, { name: "dimanche", order: 7 }];

var go_yearlist = [];
for (var i = 2000; i < 2016; i++) {
    go_yearlist.push({ name: String(i) });
}
go_yearlist.push({ name: "ado" });
go_yearlist.push({ name: "adulte" });
go_yearlist.push({ name: "libre" });

var go_hourlist = [];
for (var i = 8; i < 22; i++) {
    if (i < 10) {
        go_hourlist.push({ name: '0' + i + ":00" });

    } else {
        go_hourlist.push({ name: i + ":00" });
        // jazy
        if (i >= 12 && i <= 14) {
            go_hourlist.push({ name: i + ":15" });
        }
    }
}

//
// COMPONENTS
//

const main_menu = Vue.component('main-menu',
    {
        template:
            `
         <div>
            <ul class="nav nav-pills">
               <li class="nav-item"><a class="nav-link" v-bind:class="(isactive && (active_tag === 'group')) ? 'active' : ''" href="#/groups">groupes</a></li>
               <li class="nav-item"><a class="nav-link" v-bind:class="(isactive && (active_tag === 'member')) ? 'active' : ''" href="#/members">membres</a></li>
               <!-- <li class="nav-item"><a class="nav-link" v-bind:class="(isactive && (active_tag === 'import)) ' ? 'active' : ''" href="#/import">import</a></li> -->
            </ul>
         </div>
            `,
        data: function () { return ({ isactive: false }) },
        props: ["active_tag"]

    }
);

const button_bar = Vue.component('button-bar',
    {
        template:
            `
        <span>    
            <button class="btn btn-secondary oi oi-home mr-3" v-on:click="f_home()"></button>
            <button class="btn btn-secondary oi oi-chevron-left mr-3" v-on:click="f_back()"></button>
        </span>
        `,
        methods: {
            f_home:
                function () { router.push('/'); },
            f_back:
                function () { router.go(-1); }
        }
    });

//
// MEMBER-EDIT
//
const member_edit = Vue.component('member-edit',
    {
        template:
            `
         <div>
            <div id="go_header" class="fixed-top">
               <main-menu active_tag="member"></main-menu>
            </div>
            <div id="go_scroll" class="container-fluid">
                  <h5>
                     {{title}}
                  </h5>
               <form class="form-inline" v-on:keyup.enter="f_save()">
               <label for="go_name" class="sr-only">nom</label>
               <input class="form-control mr-sm-2 mb-2" v-model="member.name" placeholder="nom" disabled></td>
               <label for="go_firstname" class="sr-only">prénom</label> 
               <input class="form-control mr-sm-2 mb-2" v-model="member.firstname" placeholder="prénom" disabled></td>
               <label for="go_level" class="mr-sm-2 mb-2">niveau</label> 
               <select id ="go_level" class="form-control mr-sm-2 mb-2" v-model="member.level" placeholder="niveau">
                  <option v-for="cur_levellist in levellist">
                     {{cur_levellist.name}}
                  </option>
               </select>
               <label for="go_year" class="mr-sm-2 mb-2">année</label> 
               <select id ="go_year" class="form-control mr-sm-2 mb-2" v-model="member.year">
                  <option v-for="cur_yearlist in yearlist">
                     {{cur_yearlist.name}}
                  </option>
               </select>
               </form>
               <div v-if="api_error.length" class="alert alert-danger">
                  <div v-for="cur_api_error in api_error">{{cur_api_error.msg}}</div>
               </div>
            </div>
            <div id="go_footer" class="fixed-bottom text-center">
               <button-bar></button-bar>
               <button type="button" class="btn btn-warning oi oi-check mr-3" v-on:click="f_save()"></button>
            </div>
         </div>
        `,
        props: ['id'], //member id
        data: function () {
            return ({
                member: {},
                api_error: [],
                noresult: true,
                levellist: go_levellist,
                yearlist: go_yearlist,
                title: "",
                isupdate: false
            }
            );
        },
        methods: {
            f_load:
                // member data load
                function () {
                    var lo_comp = this;
                    lo_comp.isupdate = (lo_comp.id !== "0");
                    if (lo_comp.isupdate) {
                        lo_comp.title = "modifier membre";
                        var ls_url = "/api/member?id=" + lo_comp.id;
                        go_axios.get(ls_url)
                            .then(
                                function (response) {
                                    lo_comp.noresult = (response.data.length === 0);
                                    lo_comp.member = (lo_comp.noresult ? null : response.data[0]);
                                    lo_comp.api_error = [];
                                })
                            .catch(function (error) {
                                lo_comp.api_error = [{ "msg": error.message }];
                            });
                    }
                },
            f_save: function () {
                var lo_comp = this;
                var ls_url = "/api/member";
                lo_comp.api_error.splice(0);

                if (lo_comp.isupdate) {
                    go_axios.put(ls_url, lo_comp.member)
                        .then(
                            function (response) {
                                router.go(-1);
                            }
                        )
                        .catch(function (error) {
                            if (error.response) {
                                lo_comp.api_error = error.response.data;
                            } else {
                                lo_comp.api_error = [{ "msg": error.message }];
                            }
                        });
                }
            }
        },
        created: function () {
            this.f_load();
        }
    }
);

//
// GROUP-EDIT
//

const group_edit = Vue.component('group-edit',
    {
        template:
            `
         <div>
            <div id="go_header" class="fixed-top">
               <main-menu active_tag="group"></main-menu>
            </div>
            <div id="go_scroll" class="container-fluid">
                  <h5>
                     {{title}}
                  </h5>
               <form v-on:keyup.enter="f_save()">
                  <div class="form">
                     <div class="form-group row">
                        <label for="go_day" class="col-sm-2 col-lg-1 col-form-label">jour</label>
                        <div class="col-sm-4 col-lg-2">
                        <select  id ="go_day" class="form-control" v-model="group.day" v-bind:disabled="isupdate">
                           <option v-for="cur_daylist in daylist">
                              {{cur_daylist.name}}
                           </option>
                        </select>
                        </div>
                     </div>
                     <div class="form-group row">
                        <label for="go_hour" class="col-sm-2 col-lg-1 col-form-label">heure</label>
                        <div class="col-sm-4 col-lg-2">
                        <select id ="go_hour" class="form-control" v-model="group.hour" v-bind:disabled="isupdate">
                           <option v-for="cur_hourlist in hourlist">
                              {{cur_hourlist.name}}
                           </option>
                        </select>
                        </div>
                     </div>
                     <div class="form-group row">
                        <label for="go_court" class="col-sm-2 col-lg-1 col-form-label">court</label>
                        <div class="col-sm-4 col-lg-2">
                        <select id ="go_court" class="form-control" v-model="group.court">
                           <option v-for="cur_courtlist in courtlist">
                              {{cur_courtlist.name}}
                           </option>
                        </select>
                        </div>
                     </div>
                     <div class="form-group row">
                        <label for="go_level" class="col-sm-2 col-lg-1 col-form-label">niveau</label>
                        <div class="col-sm-4 col-lg-2">
                        <select id ="go_level" class="form-control" v-model="group.level">
                           <option v-for="cur_levellist in levellist">
                              {{cur_levellist.name}}
                           </option>
                        </select>
                        </div>
                     </div>
                     <div class="form-group row">
                        <label for="go_year" class="col-sm-2 col-lg-1 col-form-label">année</label>
                        <div class="col-sm-4 col-lg-2">
                        <select id ="go_year" class="form-control" v-model="group.year">
                           <option v-for="cur_yearlist in yearlist">
                              {{cur_yearlist.name}}
                           </option>
                        </select>
                        </div>
                     </div>
                     <div class="form-group row">
                        <label for="go_size" class="col-sm-2 col-lg-1 col-form-label">taille</label>
                        <div class="col-sm-4 col-lg-2">
                        <select  id ="go_size" class="form-control" v-model="group.size">
                           <option v-for="cur_sizelist in sizelist">
                              {{cur_sizelist.name}}
                           </option>
                        </select>
                        </div>
                     </div>
               </form>
               <div v-if="api_error.length" class="alert alert-danger">
                  <div v-for="cur_api_error in api_error">{{cur_api_error.msg}}</div>
               </div>
            </div>
            <div id="go_footer" class="fixed-bottom text-center">
               <button-bar></button-bar>
               <button type="button" class="btn btn-warning oi oi-check mr-3" v-on:click="f_save()"></button>
            </div>
         </div>
                     `,
        props: ['id'], //group id
        data: function () {
            return ({
                group: {},
                api_error: [],
                noresult: true,
                daylist: go_daylist,
                hourlist: go_hourlist,
                courtlist: go_courtlist,
                levellist: go_levellist,
                yearlist: go_yearlist,
                sizelist: go_sizelist,
                title: "",
                isupdate: false
            }
            );
        },
        methods: {
            f_load:
                // group data load
                function () {
                    var lo_comp = this;
                    lo_comp.isupdate = (lo_comp.id !== "0");
                    if (lo_comp.isupdate) {
                        lo_comp.title = "modifier groupe";
                        var ls_url = "/api/group?id=" + lo_comp.id;
                        go_axios.get(ls_url)
                            .then(
                                function (response) {
                                    lo_comp.noresult = (response.data.length === 0);
                                    lo_comp.group = (lo_comp.noresult ? null : response.data[0]);
                                    lo_comp.api_error = [];
                                })
                            .catch(function (error) {
                                lo_comp.api_error = [{ "msg": error.message }];
                            });
                    } else {
                        lo_comp.title = "nouveau groupe"
                        lo_comp.group = { day: null, hour: null, court: null, level: null, year: null, size: 6 };
                    }
                },
            f_save: function () {
                var lo_comp = this;
                var ls_url = "/api/group";
                lo_comp.api_error.splice(0);

                if (lo_comp.isupdate) {
                    go_axios.put(ls_url, lo_comp.group)
                        .then(
                            function (response) {
                                router.go(-1);
                            }
                        )
                        .catch(function (error) {
                            if (error.response) {
                                lo_comp.api_error = error.response.data;
                            } else {
                                lo_comp.api_error = [{ "msg": error.message }];
                            }
                        });
                } else {
                    go_axios.post(ls_url, lo_comp.group)
                        .then(
                            function (response) {
                                router.go(-1);
                            }
                        )
                        .catch(function (error) {
                            if (error.response) {
                                lo_comp.api_error = error.response.data;
                            } else {
                                lo_comp.api_error = [{ "msg": error.message }];
                            }
                        });

                }
            }
        },
        created: function () {
            this.f_load();
        }
    }
);

//
// GROUP-DETAIL
//

const group_detail = Vue.component('group-detail',
    {
        template:
            `
            <div>
            <div id="go_header" class="fixed-top">
               <main-menu active_tag="group"></main-menu>
            </div>
            <div id="go_scroll" class="container-fluid">
                  <h5>
                     groupe : {{ group.day }} {{ group.hour }} [{{ group.court }}]  
                     <span v-bind:class="f_level_class_name(group.level)">{{ group.level }}</span>
                     {{ group.year }}
                  </h5>
               <table class="table">
                  <thead>
                     <tr>
                        <th>nom prénom</th>
                        <th>niveau</th>
                        <th>année</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr v-for="cur_member in group.member" v-bind:key="cur_member.id">
                        <td>{{cur_member.name}} {{cur_member.firstname}}</td>
                        <td>
                        <span v-bind:class="f_level_class_name(cur_member.level)">{{ cur_member.level }}</span>
                        </td>
                        <td>{{cur_member.year}}</td>
                        <td>
                        <button v-if="f_isadmin()" type="button" class="btn btn-danger oi oi-trash mr-3" v-on:click="f_del_member(cur_member)"></button>
                        </td>
                     </tr>
                     <tr v-if="isempty" >
                        <td colspan=4 class="text-center"><span style="font-style:italic">aucun inscrit</span></td>
                     </tr>
                  </tbody>
               </table>
               <div v-if="group.isfree">
                     <h5>inscrire:</h5>
                     <form class="form-inline align-items-center" v-on:keyup.enter="f_add_member()">
                        <label for="go_name" class="sr-only">nom</label>
                        <input class="form-control mr-sm-2 mb-2" v-model="new_member.name" placeholder="nom"></td>
                        <label for="go_firstname" class="sr-only">prénom</label> 
                        <input class="form-control mr-sm-2 mb-2" v-model="new_member.firstname" placeholder="prénom"></td>
                        <label for="go_level" class="mr-sm-2 mb-2">niveau</label> 
                        <select id ="go_level" class="form-control mr-sm-2 mb-2" v-model="new_member.level" placeholder="niveau">
                           <option v-for="cur_levellist in levellist">
                              {{cur_levellist.name}}
                           </option>
                        </select>
                        <label for="go_year" class="mr-sm-2 mb-2">année</label> 
                        <select id ="go_year" class="form-control mr-sm-2 mb-2" v-model="new_member.year">
                           <option v-for="cur_yearlist in yearlist">
                              {{cur_yearlist.name}}
                           </option>
                        </select>
                        <button type="button" class="btn btn-warning oi oi-plus mb-2" v-on:click="f_add_member()"></button>
                     </form>
               </div>
               <div v-if="api_error.length" class="alert alert-danger">
                  <div v-for="cur_api_error in api_error">{{cur_api_error.msg}}</div>
               </div>
            </div>
            <div id="go_footer" class="fixed-bottom text-center">
               <button-bar></button-bar>
               <button v-if="f_isadmin()" type="button" class="btn btn-info oi oi-pencil mr-3" v-on:click="f_upd_group(group)"></button>
               <button v-if="(isempty && f_isadmin())" type="button" class="btn btn-danger oi oi-trash mr-3" v-on:click="f_del_group(group)"></button>
            </div>
         </div>
    `,
        props: ['id'], // group id
        data:
            function () {
                return ({
                    group: {},
                    noresult: true,
                    new_member: {},
                    api_error: [],
                    yearlist: go_yearlist,
                    levellist: go_levellist
                }
                );
            },
        computed: {
            isempty: function () { var lo_comp = this; return ((!lo_comp.group.member) || (lo_comp.group.member.length === 0)); }
        },
        methods: {
            f_load:
                // group data load
                function () {
                    var lo_comp = this;
                    var ls_url = "/api/group?id=" + lo_comp.id;
                    go_axios.get(ls_url)
                        .then(
                            function (response) {
                                lo_comp.noresult = (response.data.length === 0);
                                if (!lo_comp.noresult) {
                                    // sort members
                                    response.data[0].member.sort(function (a, b) { return a.name.localeCompare(b.name) });
                                }
                                lo_comp.group = (lo_comp.noresult ? null : response.data[0]);
                                lo_comp.api_error = [];
                            })
                        .catch(
                            function (error) {
                                lo_comp.api_error = [{ "msg": error.message }];
                            }
                        );
                },
            // add a member in group
            f_add_member: function () {
                var lo_comp = this;
                lo_comp.new_member.group_id = lo_comp.group.id;
                var ls_url = "/api/member";
                lo_comp.api_error.splice(0);
                go_axios.post(ls_url, lo_comp.new_member)
                    .then(
                        function (response) {
                            lo_comp.f_load(); // refresh group data;
                            lo_comp.new_member = {};
                            lo_comp.api_error = [];
                        }
                    )
                    .catch(function (error) {
                        if (error.response) {
                            lo_comp.api_error = error.response.data;
                        } else {
                            lo_comp.api_error = [{ "msg": error.message }];
                        }
                    });
            },
            // delete a member
            f_del_member: function (po_member) {
                var lo_comp = this;
                bootbox.confirm("supprimer inscrit " + po_member.firstname + " " + po_member.name + " ?",
                    function (pb_result) {
                        if (pb_result) {
                            var ls_url = "/api/member/" + po_member.id;
                            go_axios.delete(ls_url)
                                .then(
                                    function (response) {
                                        lo_comp.f_load(); // refresh group data
                                        lo_comp.api_error = [];
                                    }
                                )
                                .catch(function (error) {
                                    if (error.response) {
                                        lo_comp.api_error = error.response.data;
                                    } else {
                                        lo_comp.api_error = [{ "msg": error.message }];
                                    }
                                });
                        }
                    });

            },
            // delete a group
            f_del_group: function (po_group) {
                var lo_comp = this;
                bootbox.confirm("supprimer groupe " + po_group.day + " " + po_group.hour + " " + "[" + po_group.court + "] ?",
                    function (pb_result) {
                        if (pb_result) {
                            var ls_url = "/api/group/" + po_group.id;
                            go_axios.delete(ls_url)
                                .then(
                                    function (response) {
                                        router.go(-1);; // refresh group data
                                    }
                                )
                                .catch(function (error) {
                                    if (error.response) {
                                        lo_comp.api_error = error.response.data;
                                    } else {
                                        lo_comp.api_error = [{ "msg": error.message }];
                                    }
                                });
                        }
                    });

            },
            // update a group
            f_upd_group: function (po_group) {
                router.push('/group/' + po_group.id + '/edit');
            },
            f_isadmin: f_isadmin,
            f_level_class_name : f_level_class_name
        },
        created:
            function () {
                this.f_load();
            }
    });

//
// GROUP-LIST
//
const group_list = {
    template:
        `
<div>
<div id="go_header" class="fixed-top">
   <main-menu active_tag="group"></main-menu>
</div>
<div id="go_scroll" class="container-fluid">
      <h5>
         groupes
      </h5>
   <form class="form-inline" v-on:keyup.enter="f_push_filter">
      <div class="input-group mr-sm-3 mb-2">
         <label for="go_filter_group" class="sr-only">filtre:</label>
         <input type="search" id="go_filter_group" class="form-control mr-1" v-model="filter" placeholder="année, niveau, jour ou court">
         <button type="button" class="btn btn-secondary oi oi-magnifying-glass" v-on:click="f_push_filter"></button>
      </div>
      <div class="custom-control custom-checkbox mb-2">
         <input id="go_isfree" class="custom-control-input" type="checkbox" v-model="isfree" v-on:change="f_push_filter">
         <label class="custom-control-label" for="go_isfree">
         libre
         </label>
      </div>
   </form>
   <div v-if="api_error.length" class="alert alert-danger">
    <div v-for="cur_api_error in api_error">{{cur_api_error.msg}}</div>
   </div>
   <table class="table">
      <thead>
         <th>groupe</th>
         <th>niveau</th>
         <th>année</th>
         <th>effectif</th>
      </thead>
      <tbody>
         <tr v-for="group in groups" v-bind:key="group.id" v-on:click="f_open_group(group.id)">
            <td>
               {{ group.day.slice(0,3) }} {{ group.hour }} [{{group.court}}]
            </td>
            <td>
               <span v-bind:class="f_level_class_name(group.level)">{{ group.level }}</span>
            </td>
            <td>
               {{ group.year }}
            </td>
            <td>
               <span v-bind:class="{'class-isnotfree' : !group.isfree, 'class-isfree' : group.isfree}">{{ ( group.member ? group.member.length : 0 ) }}/{{ group.size }}</span>
            </td>
         </tr>
      </tbody>
   </table>
   
</div>
<div id="go_footer" class="fixed-bottom text-center">
   <button-bar></button-bar>
   <button v-if="f_isadmin()"   type="button" class="btn btn-warning oi oi-plus mr-3" v-on:click="f_add_group()"></button>
</div>
</div>


 `,
    data:
        function () {
            return {
                filter:'',
                groups: [],
                isfree: true,
                noresult: true,
                api_error: []
            };
        },
    methods: {
        f_push_filter: function () {
            var lo_comp = this;
            // filter cleaning
            lo_comp.filter.replace(/[^\d\w\.\*]/g);
            router.push({ path : '/groups', query : {filter: lo_comp.filter, isfree:lo_comp.isfree}});
        },
        f_run_filter: function () {
            var lo_comp = this;
            var ls_url = "/api/group?";
            var lb_filtered = false;
            lo_comp.filter = ( (lo_comp.$route.query && lo_comp.$route.query.hasOwnProperty('filter'))  ? lo_comp.$route.query.filter : '');
            lo_comp.isfree = ( (lo_comp.$route.query && lo_comp.$route.query.hasOwnProperty('isfree'))  ?  (String(lo_comp.$route.query.isfree) === "true")  : true);

            var ls_filter_re = f_build_filter_re(lo_comp.filter, 'lower');

            lb_filtered = (ls_filter_re === "^$"); // no filtering

            if ((!lb_filtered) && go_yearlist.find(function (po_year) { return (String(po_year.name).match(ls_filter_re)) })) {
                ls_url = ls_url + "year=" + ls_filter_re;
                lb_filtered = true;
            }
            if ((!lb_filtered) && go_daylist.find(function (po_day) { return (po_day.name.match(ls_filter_re)) })) {
                ls_url = ls_url + "day=" + ls_filter_re;
                lb_filtered = true;
            }
            if ((!lb_filtered) && go_levellist.find(function (po_level) { return (po_level.name.match(ls_filter_re)) })) {
                ls_url = ls_url + "level=" + ls_filter_re;
                lb_filtered = true;
            }
            if ((!lb_filtered) && go_courtlist.find(function (po_court) { return (po_court.name.match(ls_filter_re)) })) {
                ls_url = ls_url + "court=" + ls_filter_re;
                lb_filtered = true;
            }
            if (lo_comp.isfree) {
                ls_url = ls_url + (lb_filtered ? "&isfree" : "isfree");
            }
            if (!lb_filtered) {
                //invalid filter - reset
                lo_comp.api_error = [{ "msg": "filtre incorrect" }];
            } else {
                go_axios.get(ls_url)
                    .then(
                        function (response) {
                            lo_comp.noresult = (response.data.length === 0);

                            response.data.sort(function (a, b) {
                                var lo_lkp_order = {};
                                go_daylist.forEach(function (po_day) { lo_lkp_order[po_day.name] = po_day.order; });
                                if (a.day === b.day) {
                                    return (a.hour.localeCompare(b.hour));
                                } else {
                                    return (lo_lkp_order[a.day] - lo_lkp_order[b.day]);
                                }
                            });

                            lo_comp.groups = response.data;
                            lo_comp.api_error = [];
                        })
                    .catch(
                        function (error) {
                            lo_comp.api_error = [{ "msg": error.message }];
                        }
                    );
            }


        },
        f_open_group: function (ps_group_id) {
            router.push('/group/' + ps_group_id);
        },
        f_add_group: function () {
            router.push('/group/0/edit');
        },
        f_isadmin: f_isadmin,
        f_level_class_name : f_level_class_name

    },
    watch: {
        '$route': function (po_to, po_from) {
            var lo_comp = this;
            lo_comp.f_run_filter();
        }
    },
    created:
        function () {
            this.f_run_filter();
        }

};

//
// MEMBER-LIST
//
const member_list = {
    template:
        `


    <div>
    <div id="go_header" class="fixed-top">
        <main-menu active_tag="member"></main-menu>
    </div>
    <div id="go_scroll" class="container-fluid">
            <h5>
                membres
            </h5>
       <form class="form-inline" v-on:keyup.enter="f_push_filter">
       <div class="input-group mr-sm-2 mb-2">
          <label for="go_filter_member" class="sr-only">filtre:</label>
          <input type="search" id="go_filter_member" class="form-control mr-1" v-model="filter" placeholder="nom">
          <button type="button" class="btn btn-secondary oi oi-magnifying-glass" v-on:click="f_push_filter"></button>
       </div>
       </form>       
       <table class="table">
          <thead>
             <th>nom prénom</th>
             <th>niveau</th>
             <th>année</th>
             <th>groupe</th>
             <th></th>
          </thead>
          <tbody>
             <tr v-for="member in members" v-bind:key="member.id">
                <td>
                   {{ member.name }} {{ member.firstname }}
                </td>
                <td>
                <span v-bind:class="f_level_class_name(member.level)">{{ member.level }}</span>
                </td>
                <td>
                {{ member.year }}
                </td>
                <td>
                {{ member.group[0].day.slice(0,3) }} {{ member.group[0].hour }} [{{ member.group[0].court }}]
                </td>
                <td>
                <button v-if="f_isadmin()" type="button" class="btn btn-info oi oi-pencil mr-3" v-on:click="f_upd_member(member)"></button>
                </td>
             </tr>
          </tbody >
       </table>
       <div v-if="api_error.length" class="alert alert-danger">
         <div v-for="cur_api_error in api_error">{{cur_api_error.msg}}</div>
       </div>
    </div>
    <div id="go_footer" class="fixed-bottom text-center">
    <button-bar></button-bar>
    </div>
 </div>
 
 `,
    data:
        function () {
            return {
                filter: '',
                members: [],
                noresult: true,
                api_error: []
            };
        },
    methods: {
        f_push_filter: function () {
            var lo_comp = this;
            // filter cleaning
            lo_comp.filter.replace(/[^\d\w\.\*]/g);
            router.push({ path: '/members', query: { 'filter': lo_comp.filter } });
        },
        f_run_filter: function () {
            var lo_comp = this;
            var ls_url = "/api/member?";

            lo_comp.filter = ( (lo_comp.$route.query && lo_comp.$route.query.filter)  ? lo_comp.$route.query.filter : '');
            // build regexp
            var ls_filter_re = f_build_filter_re(lo_comp.filter, 'upper');

            if (ls_filter_re !== "^$") {
                // filtering
                ls_url = ls_url + "name=" + ls_filter_re;
            }

            go_axios
                .get(ls_url).then(
                    function (response) {
                        lo_comp.noresult = (response.data.length === 0);
                        lo_comp.members = response.data;
                        lo_comp.api_error = [];
                    })
                .catch(function (error) {
                    lo_comp.api_error = [{ "msg": error.message }];
                });
        },
        // update a member
        f_upd_member: function (po_member) {
            router.push('/member/' + po_member.id + '/edit');
        },
        f_isadmin: f_isadmin,
        f_level_class_name: f_level_class_name 
    },
  
    watch: {
        '$route': function (po_to, po_from) {
            var lo_comp = this;
            lo_comp.f_run_filter();
        }
    },
    created:
        function () {
            var lo_comp = this;
            lo_comp.f_run_filter();
        }

};

const group_import = {
    template:
        `
        <div>
        <div id="go_header" class="fixed-top">
               <main-menu active_tag="import"></main-menu>
               <!-- <h4 class="text-center">ajout groupe</h4> -->
        </div>
        <div id="go_scroll" class="container-fluid">
          <form>
            <div class="form-group">
                <label for="go_text_in">text groupe</label>
                <textarea class="form-control" id="go_text_in" rows="8" v-model="text_in">
                </textarea>
            </div>

            <button type="button" class="btn btn-secondary" v-on:click="f_parse()">analyser</button>
            {{members.length + 1}}


            <div  v-bind:class="(group.status ? 'alert alert-success' : 'alert alert-warning')">{{group}}</div>
            <div v-for="member in members" v-bind:class="(member.status ? 'alert alert-success' : 'alert alert-warning')">{{member}}</div>
            <div v-for="bad_row in bad_rows" class="alert alert-danger">{{bad_row}}</div>

            <button type="button" class="btn btn-secondary" v-bind:disabled="(! isloadable)" v-on:click="f_load()">importer</button>
            {{loads.length}}
            <div v-for="load in loads" v-bind:class="(load.status ? 'alert alert-success' : 'alert alert-danger')">{{load}}</div>

            </form>
        </div>
        <div id="go_footer" class="fixed-bottom text-center">
    <button-bar></button-bar>
    </div>
 </div>
        `,
    data:
        function () {
            return {
                text_in: '',
                // example: 
                // lundi ET 	18 H A 19 H 4	30/3	2
                // 1 	Deveaux Killian 	05 	30/3
                // 2 	Marchand Thomas 	04 	30/3
                // 3 	Tran Hugo 	04 	30/3
                // 4 	  	  	 
                // 5 	  	  	 
                // 6
                group: {},
                members: [],
                bad_rows: [],
                isloadable: false,
                loads: []
            };
        },
    methods: {
        f_parse: function () {
            var lo_comp = this,
                li_year = 0,
                lo_lkp_level = { "Or": "orange", "Ro": "rouge", "V": "vert", "N": "nouveau", "Bl": "blanc", "M": "nc", "Vi": "violet" };

            // reset
            lo_comp.group = {};
            lo_comp.loads = [];
            Vue.set(lo_comp.group, 'size', 0);
            Vue.set(lo_comp.group, 'status', false);
            lo_comp.members.splice(0);
            lo_comp.bad_rows.splice(0);

            // split rows
            var la_text = lo_comp.text_in.split('\n').map(
                function (ps_line) {
                    return (ps_line.trim());
                }
            );

            // parse group line (first row)
            var la_match = la_text[0].match(/^(\w+)\s+\w+\s+(\d+)\s*H\s+A\s+\d+\s+H\s+(\w+)\s+([\w\/]+)\s+(\w+)/);  // <day> XX <hour> H A NN H <year> <level>	<court>
            if (la_match) {
                lo_comp.group.day = la_match[1];
                lo_comp.group.hour = (parseInt(la_match[2]) < 10 ? "0" + la_match[2] + ":00" : la_match[2] + ":00");
                li_year = parseInt(la_match[3]);
                if (!isNaN(li_year)) {
                    lo_comp.group.year = (li_year > 50 ? "adulte" : String(2000 + li_year));
                } else {
                    lo_comp.group.year = la_match[3];
                }
                lo_comp.group.level = (lo_lkp_level[la_match[4]] ? lo_lkp_level[la_match[4]] : la_match[4].toLowerCase());
                lo_comp.group.court = la_match[5];

                if (
                    (go_daylist.findIndex(function (po_elmt) { return (po_elmt.name === lo_comp.group.day) }) >= 0)
                    && (go_hourlist.findIndex(function (po_elmt) { return (po_elmt.name === lo_comp.group.hour) }) >= 0)
                    && (go_levellist.findIndex(function (po_elmt) { return (po_elmt.name === lo_comp.group.level) }) >= 0)
                    && (go_courtlist.findIndex(function (po_elmt) { return (po_elmt.name === lo_comp.group.court) }) >= 0)
                ) {
                    lo_comp.group.status = true;
                }
            }
            else {
                lo_comp.bad_rows.push(la_text[0]);
            }

            // loop on rows
            la_text.forEach(
                function (ps_line, pi_index) {

                    var lo_member = {},
                        li_year,
                        ls_row_status = 'error',
                        ls_level;
                    // skip first row
                    if (pi_index) {

                        // compute size : use max member row number
                        var la_match = ps_line.match(/^\d+/);
                        if (la_match) {
                            //set group size
                            lo_comp.group.size = ((lo_comp.group.size < parseInt(la_match[0])) ? parseInt(la_match[0]) : lo_comp.group.size)
                        }

                        // parse member
                        la_match = ps_line.match(/^\d+\s+([\-\w]+)\s+([\-\w]+)\s+([\d\w]+)\s+([\d\w\/]+)/); // n <name> <firstname> <year> <level>
                        if (la_match) {
                            ls_row_status = 'valid';

                            lo_member.name = la_match[1];
                            lo_member.firstname = la_match[2];
                            li_year = parseInt(la_match[3]);
                            if (!isNaN(li_year)) {
                                lo_member.year = (li_year > 50 ? "adulte" : String(2000 + li_year));
                            } else {
                                lo_member.year = la_match[3];
                            }
                            lo_member.level = (lo_lkp_level[la_match[4]] ? lo_lkp_level[la_match[4]] : la_match[4].toLowerCase());

                            lo_member.status = (
                                (go_yearlist.findIndex(function (po_elmt) { return (po_elmt.name === lo_member.year) }) >= 0)
                                && (go_levellist.findIndex(function (po_elmt) { return (po_elmt.name === lo_member.level) }) >= 0)
                            );

                            lo_comp.members.push(lo_member);
                        }
                        //ignore empty rows
                        if ((ps_line.match(/^\d+\s*$/)) || (ps_line.match(/^\s*$/))) {
                            ls_row_status = 'valid';
                        }

                        if (ls_row_status === 'error') {
                            lo_comp.bad_rows.push(ps_line);
                        }
                    }

                }
            );

            lo_comp.isloadable = ((lo_comp.group.status)
                && (lo_comp.members.findIndex(function (po_member) { return (!po_member.status) }) === -1));
        },
        f_load: function () {
            var lo_comp = this;
            lo_comp.loads.splice(0);
            go_axios.post("/api/group", lo_comp.group)
                .then(
                    function (response) {
                        var ls_group_id = response.data[0].id;
                        lo_comp.loads.push({ status: true, "type": "group" });

                        lo_comp.members.forEach(
                            function (po_member) {
                                po_member.group_id = ls_group_id;
                                go_axios
                                    .post("/api/member/", po_member)
                                    .then(
                                        function (response) {
                                            po_member.status = true;
                                            lo_comp.loads.push({ status: true, "type": "membre" });

                                        })
                                    .catch(
                                        function (error) {
                                            var ls_error = error.message;
                                            if (error.response) {
                                                ls_error = ls_error + "/" + error.response.data[0].msg;
                                            }
                                            lo_comp.loads.push({ status: false, "type": "membre", "error": ls_error });
                                        }
                                    )
                            }
                        );
                    }
                )
                .catch(
                    function (error) {
                        var ls_error = error.message;
                        if (error.response) {
                            ls_error = ls_error + "/" + error.response.data[0].msg;
                        }
                        lo_comp.loads.push({ status: false, "type": "group", "error": ls_error });

                    }
                );
        }
    }
}


const router = new VueRouter({
    routes:
        [
            { path: '/', component: group_list,  props: { filter: "" , isfree:true} },
            { path: '/groups', component: group_list, props: { filter: "" , isfree:true} },
            { path: '/groups/:filter', component: group_list, props: true },
            { path: '/members', component: member_list },
            { path: '/group/:id', component: group_detail, props: true },
            { path: '/group/:id/edit', component: group_edit, props: true },
            { path: '/member/:id/edit', component: member_edit, props: true },
            { path: '/import', component: group_import }
        ]

});


//get user profile
var go_user;

go_axios.get('/api/user')
    .then(
        function (response) {
            go_user = response.data;
        })
    .catch(function (error) {
        console.log(error.message);
    });


const app = new Vue({
    el: '#go_vue_app',
    router: router
});
