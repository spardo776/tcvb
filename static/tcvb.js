// jslint --edition=latest --node  --white --color  --this  tcvb.js

"use strict";

bootbox.setLocale('fr');

const go_levellist = [{ name: "nouveau" }, { name: "blanc" }, { name: "violet" }, { name: "rouge" }, { name: "orange" }, { name: "vert-moins" }, { name: "vert" }, { name: "balle-dure" }, { name: "adulte" }];

const go_courtlist = [{ name: "1" }, { name: "2" }, { name: "3" }, { name: "jazy" }];

const go_sizelist = [{ name: 4 }, { name: 6 }, { name: 8 }];

const go_daylist = [{ name: "lundi", order: 1 }, { name: "mardi", order: 2 }, { name: "mercredi", order: 3 }, { name: "jeudi", order: 4 }, { name: "vendredi", order: 5 }, { name: "samedi", order: 6 }, { name: "dimanche", order: 7 }];

var go_yearlist = [];

for (var i = 2000; i < 2016; i++) {
    go_yearlist.push({ name: i });
}

var go_hourlist = [];

for (var i = 8; i < 22; i++) {
    if (i < 10) {
        go_hourlist.push({ name: '0' + i + ":00" });
        go_hourlist.push({ name: '0' + i + ":30" });

    } else {
        go_hourlist.push({ name: i + ":00" });
        go_hourlist.push({ name: i + ":30" });
    }
}

const main_menu = Vue.component('main-menu',
    {
        template:
            `
         <div>
            <ul class="nav nav-pills">
               <li class="nav-item"><a class="nav-link" v-bind:class="active_tag === 'group' ? 'active' : ''" href="#/group">groupes</a></li>
               <li class="nav-item"><a class="nav-link" v-bind:class="active_tag === 'member' ? 'active' : ''" href="#/member">membres</a></li>
               <!-- <li class="nav-item"><a class="nav-link" v-bind:class="active_tag === 'import' ? 'active' : ''" href="#/import">import</a></li> -->
            </ul>
         </div>
            `,
        props: ["active_tag"]

    }
);

const button_bar = Vue.component('button-bar',
    {
        template:
            `
        <span>    
            <button class="btn btn-secondary oi oi-home mr-2" v-on:click="f_home()"></button>
            <button class="btn btn-secondary oi oi-chevron-left mr-2" v-on:click="f_back()"></button>
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
               <div class="text-center">
                  <h5>
                     {{title}}
                  </h5>
               </div>
               <form v-on:keyup.enter="f_save()">
                  <div class="form">
                     <div class="form-group">
                        <label for="go_day">jour</label>
                        <select  id ="go_day" class="form-control" v-model="group.day" v-bind:disabled="isupdate">
                           <option v-for="cur_daylist in daylist">
                              {{cur_daylist.name}}
                           </option>
                        </select>
                     </div>
                     <div class="form-group">
                        <label for="go_hour">heure</label>
                        <select id ="go_hour" class="form-control" v-model="group.hour" v-bind:disabled="isupdate">
                           <option v-for="cur_hourlist in hourlist">
                              {{cur_hourlist.name}}
                           </option>
                        </select>
                     </div>
                     <div class="form-group">
                        <label for="go_court">court</label>
                        <select id ="go_court" class="form-control" v-model="group.court">
                           <option v-for="cur_courtlist in courtlist">
                              {{cur_courtlist.name}}
                           </option>
                        </select>
                     </div>
                  </div>
                     <div class="form-group">
                        <label for="go_level">niveau</label>
                        <select id ="go_level" class="form-control" v-model="group.level">
                           <option v-for="cur_levellist in levellist">
                              {{cur_levellist.name}}
                           </option>
                        </select>
                     </div>
                     <div class="form-group">
                        <label for="go_year">année</label>
                        <select id ="go_year" class="form-control" v-model="group.year">
                           <option v-for="cur_yearlist in yearlist">
                              {{cur_yearlist.name}}
                           </option>
                        </select>
                     </div>
                     <div class="form-group">
                        <label for="go_size">taille</label>
                        <select  id ="go_size" class="form-control" v-model="group.size">
                           <option v-for="cur_sizelist in sizelist">
                              {{cur_sizelist.name}}
                           </option>
                        </select>
                     </div>
               </form>
               <div v-if="api_error.length" class="alert alert-danger">
                  <div v-for="cur_api_error in api_error">{{cur_api_error.msg}}</div>
               </div>
            </div>
            <div id="go_footer" class="fixed-bottom text-center">
               <button-bar></button-bar>
               <button type="button" class="btn btn-warning oi oi-check mr-2" v-on:click="f_save()"></button>
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
                    //console.log('@f_load');
                    lo_comp.isupdate = (lo_comp.id !== "0");
                    if (lo_comp.isupdate) {
                        lo_comp.title = "modifier groupe";
                        var ls_url = "/api/group?id=" + lo_comp.id;
                        //console.log("-url=" + ls_url);
                        axios.get(ls_url)
                            .then(
                                function (response) {
                                    //console.log("-rowcount=" + response.data.length);
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
                //console.log('@f_save');
                var lo_comp = this;
                var ls_url = "/api/group";
                lo_comp.api_error.splice(0);

                if (lo_comp.isupdate) {
                    axios.put(ls_url, lo_comp.group)
                        .then(
                            function (response) {
                                //console.log("-response.status=" + response.status);
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
                    axios.post(ls_url, lo_comp.group)
                        .then(
                            function (response) {
                                //console.log("-response.status=" + response.status);
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
            //console.log('@created');
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
               <div class="text-center">
                  <h5>
                     {{ group.day }} {{ group.hour }} [{{ group.court }}]  
                     <span v-bind:class="'class-level-'+group.level">{{ group.level }}</span>
                     {{ group.year }}
                  </h5>
               </div>
               <table class="table">
                  <thead>
                     <tr>
                        <th>nom prénom</th>
                        <th>année</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr v-for="cur_member in group.member" v-bind:key="cur_member.id">
                        <td>{{cur_member.name}} {{cur_member.firstname}}</td>
                        <td>{{cur_member.year}}</td>
                        <td><button type="button" class="btn btn-danger oi oi-trash" v-on:click="f_del_member(cur_member)"></button></td>
                     </tr>
                     <tr v-if="isempty" >
                        <td colspan=4 class="text-center"><span style="font-style:italic">aucun inscrit</span></td>
                     </tr>
                  </tbody>
               </table>
               <div v-if="group.isfree">
                     <h6 style="font-style:italic">nouvel inscrit:</h6>
                     <form class="form-inline align-items-center" v-on:keyup.enter="f_add_member()">
                        <label for="go_name" class="sr-only">nom</label>
                        <input class="form-control mr-sm-2 mb-2" v-model="new_member.name" placeholder="nom"></td>
                        <label for="go_firstname" class="sr-only">prénom</label> 
                        <input class="form-control mr-sm-2 mb-2" v-model="new_member.firstname" placeholder="prénom"></td>
                        <label for="go_year" class="sr-only">année</label> 
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
               <button v-if="isempty" type="button" class="btn btn-danger oi oi-trash mr-2" v-on:click="f_del_group(group)"></button>
               <button type="button" class="btn btn-info oi oi-pencil mr-2" v-on:click="f_upd_group(group)"></button>
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
                    //console.log('@f_load');
                    var ls_url = "/api/group?id=" + lo_comp.id;
                    //console.log("-url=" + ls_url);
                    axios.get(ls_url)
                        .then(
                            function (response) {
                                //console.log("-rowcount=" + response.data.length);
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
                //console.log('@f_add_member');
                lo_comp.new_member.group_id = lo_comp.group.id;
                var ls_url = "/api/member";
                //console.log("-url=" + ls_url);
                lo_comp.api_error.splice(0);
                axios.post(ls_url, lo_comp.new_member)
                    .then(
                        function (response) {
                            //console.log("-response.status=" + response.status)
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
                //console.log('@f_del_member');
                bootbox.confirm("supprimer inscrit " + po_member.firstname + " " + po_member.name + " ?",
                    function (pb_result) {
                        if (pb_result) {
                            var ls_url = "/api/member/" + po_member.id;
                            axios.delete(ls_url)
                                .then(
                                    function (response) {
                                        //console.log("-response.status=" + response.status);
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
                //console.log('@f_del_group');
                bootbox.confirm("supprimer groupe " + po_group.day + " " + po_group.hour + " " + "[" + po_group.court + "] ?",
                    function (pb_result) {
                        if (pb_result) {
                            var ls_url = "/api/group/" + po_group.id;
                            axios.delete(ls_url)
                                .then(
                                    function (response) {
                                        //console.log("-response.status=" + response.status);
                                        router.go(-1);; // refresh group data
                                    }
                                )
                                .catch(function (error) {
                                    if (error.response) {
                                        lo_comp.api_error = error.response.data;
                                    } else {
                                        lo_comp.api_error = [{ "msg": error.message }];
                                    }
                                    //console.log("-error=" + error.message);
                                });
                        }
                    });

            },
            // update a group
            f_upd_group: function (po_group) {
                router.push('/group/' + po_group.id + '/edit');
            }
        },
        created:
            function () {
                //console.log('@created');
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
   <div class="text-center">
      <h5>
         groupes
      </h5>
   </div>
   <form class="form-inline" v-on:keyup.enter="f_filter">
      <div class="input-group mr-sm-2 mb-2">
         <label for="go_filter" class="sr-only">filtre:</label>
         <input type="search" id="go_filter" class="form-control" v-model="filter" placeholder="année, niveau ou jour">
         <button type="button" class="btn btn-secondary oi oi-magnifying-glass" v-on:click="f_filter"></button>
      </div>
      <div class="custom-control custom-checkbox  mb-2">
         <input id="go_isfree" class="custom-control-input" type="checkbox" v-model="isfree" v-on:change="f_filter">
         <label class="custom-control-label" for="go_isfree">
         libre
         </label>
      </div>
   </form>
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
               {{ group.day.slice(0,3) }} {{ group.hour }}
            </td>
            <td>
               <span v-bind:class="'class-level-'+group.level">{{ group.level }}</span>
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
   <div v-if="api_error.length" class="alert alert-danger">
    <div v-for="cur_api_error in api_error">{{cur_api_error.msg}}</div>
   </div>
</div>
<div id="go_footer" class="fixed-bottom text-center">
   <button-bar></button-bar>
   <button type="button" class="btn btn-warning oi oi-plus mr-2" v-on:click="f_add_group()"></button>
</div>
</div>


 `,
    data:
        function () {
            return {
                filter: '',
                groups: [],
                isfree: true,
                noresult: true,
                api_error: []
            };
        },
    methods: {
        f_filter: function () {
            var lo_comp = this;
            //console.log("@f_filter");
            var ls_url = "/api/group?";
            var lb_filtered = false;

            if ((!lb_filtered) && go_yearlist.find(function (po_year) { return (lo_comp.filter.match(po_year.name)) })) {
                ls_url = ls_url + "year=" + lo_comp.filter;
                lb_filtered = true;
            }
            if ((!lb_filtered) && go_daylist.find(function (po_day) { return (lo_comp.filter.match(po_day.name)) })) {
                ls_url = ls_url + "day=" + lo_comp.filter;
                lb_filtered = true;
            }
            if ((!lb_filtered) && go_levellist.find(function (po_level) { return (lo_comp.filter.match(po_level.name)) })) {
                ls_url = ls_url + "level=" + lo_comp.filter;
                lb_filtered = true;
            }
            if (lo_comp.isfree) {
                ls_url = ls_url + (lb_filtered ? "&isfree" : "isfree");
            }
            if (!lb_filtered) {
                //invalid filter - reset
                lo_comp.filter = "";
            }
            //console.log("-url=" + ls_url);


            axios.get(ls_url)
                .then(
                    function (response) {
                        //console.log("-rowcount=" + response.data.length);
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


        },
        f_open_group: function (ps_group_id) {
            //console.log('@f_open group ' + ps_group_id);
            router.push('/group/' + ps_group_id);
        },
        f_add_group: function () {
            //console.log('@f_add_group');
            router.push('/group/0/edit');
        }

    },
    created:
        function () {
            //console.log('created');
            this.f_filter();
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
        <div class="text-center">
            <h5>
                membres
            </h5>
        </div>
       <form class="form-inline" v-on:keyup.enter="f_filter">
       <div class="input-group mr-sm-2 mb-2">
          <label for="go_filter" class="sr-only">filtre:</label>
          <input type="search" id="go_filter" class="form-control" v-model="filter" placeholder="nom">
          <button type="button" class="btn btn-secondary oi oi-magnifying-glass" v-on:click="f_filter"></button>
       </div>
       </form>       
       <table class="table">
          <thead>
             <th>nom prénom</th>
             <th>année</th>
             <th>groupe</th>
          </thead>
          <tbody>
             <tr v-for="member in members" v-bind:key="member.id">
                <td>
                   {{ member.name }} {{ member.firstname }}
                </td>
                <td>
                {{ member.year }}
                </td>
                <td>
                {{ member.group[0].day.slice(0,3) }} {{ member.group[0].hour }} [{{ member.group[0].court }}]
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
        f_filter: function () {
            var lo_comp = this;
            //console.log("@f_filter");
            var ls_url = "/api/member?";
            ls_url = ls_url + "name=" + lo_comp.filter.toUpperCase();

            axios
                .get(ls_url).then(
                    function (response) {
                        //console.log("-rowcount=" + response.data.length);
                        lo_comp.noresult = (response.data.length === 0);
                        lo_comp.members = response.data;
                        lo_comp.api_error = [];
                    })
                .catch(function (error) {
                    lo_comp.api_error = [{ "msg": error.message }];
                });
        }
    },
    created:
        function () {
            //console.log('created');
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
                <label for="go_text_in">texte</label>
                <textarea class="form-control" id="go_text_in" rows="8" v-model="text_in">
                </textarea>
            </div>
            <button type="button" class="btn btn-secondary" v-on:click="f_parse()">analyser</button>
            <div class="form-group">
                <label for="go_text_out">données</label>
                <textarea class="form-control" id="go_text_out" rows="8" readonly  v-model="text_out">
                </textarea>
            </div>
            <button type="button" class="btn btn-secondary">charger</button>
            <div class="form-group">
                <label for="go_result">résultat</label>
                <textarea class="form-control" id="go_result" rows="8"  v-model="result">
                </textarea>
            </div>
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
                text_in: `lundi ET 	18 H A 19 H  	  	 
                1 	Deveaux Killian 	05 	Cl
                2 	Marchand Thomas 	04 	Cl
                3 	Tran Hugo 	04 	Cl
                4 	  	  	 
                5 	  	  	 
                6`,
                text_out: 'bb',
                result: 'cc',
                api_error: []
            };
        },
    methods: {
        f_parse: function () {
            var lo_comp = this;
            var lo_group = { size: 0 };
            var la_members = [];
            var la_bad_rows = [];
            // split rows
            var la_text = lo_comp.text_in.split('\n').map(
                function (ps_line) {
                    return (ps_line.trim());
                }
            );
            // group line
            console.log(la_text[0]);
            var la_match = la_text[0].match(/^(\w+)\s+\w+\s+(\d+)\s*H/);
            if ((la_match) && (la_match.length === 3)
                && (la_match[1].match('lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche'))) {
                lo_group.day = la_match[1];
                lo_group.hour = la_match[2];
            }
            else {
                la_bad_rows.push(la_text[0]);
            }
            // size : use max member row number
            lo_group.size = 0;
            la_text.forEach(
                function (ps_line, pi_index) {

                    var lo_member = {},
                        li_year,
                        ls_row_status = 'error',
                        ls_level;

                    if (pi_index) {
                        console.log(ps_line);

                        var la_match = ps_line.match(/^\d+/);
                        if (la_match) {
                            lo_group.size = ((lo_group.size < parseInt(la_match[0])) ? parseInt(la_match[0]) : lo_group.size)
                        }

                        la_match = ps_line.match(/^\d+\s+(\w+)\s+(\w+)\s+(\d+)\s+(\w+)/);
                        if (la_match) {
                            lo_member.name = la_match[1];
                            lo_member.firstname = la_match[2];
                            li_year = parseInt(la_match[3]);
                            lo_member.year = (li_year > 20 ? 1900 + li_year : 2000 + li_year);
                            ls_level = la_match[4];
                            ls_row_status = 'valid';
                        }
                        la_match = ps_line.match(/^\d+\s*$/);

                        //ignore empty rows
                        if (la_match) {
                            ls_row_status = 'ignore';
                        }

                        if (ls_row_status === 'valid') {
                            la_members.push(lo_member);
                        } else {
                            if (ls_row_status === 'error') {
                                la_bad_rows.push(ps_line);
                            }
                        }
                    }

                }
            );
            console.log("group", lo_group);
            console.log("members", la_members);
            console.log("bad rows", la_bad_rows);
        }
    }
}


const router = new VueRouter({
    routes:
        [
            { path: '/', component: group_list },
            { path: '/group', component: group_list },
            { path: '/member', component: member_list },
            { path: '/group/:id', component: group_detail, props: true },
            { path: '/group/:id/edit', component: group_edit, props: true },
            { path: '/import', component: group_import }
        ]

});


const app = new Vue({
    el: '#go_vue_app',
    router: router
});
