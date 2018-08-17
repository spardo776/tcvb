// jslint --edition=latest --node  --white --color  --this  tcvb.js

"use strict";

bootbox.setLocale('fr');

const go_levellist = [{ name: "blanc" }, { name: "violet" }, { name: "rouge" }, { name: "orange" }, { name: "vert" }, { name: "autre" }];

const go_courtlist = [{ name: "1" }, { name: "2" }, { name: "3" }, { name: "jazy" }, { name: "herzog" }];

const go_sizelist = [{ name: 4 }, { name: 6 }, { name: 8 }];

const go_daylist = [{ name: "lundi", order: 1 }, { name: "mardi", order: 2 }, { name: "mercredi", order: 3 }, { name: "jeudi", order: 4 }, { name: "vendredi", order: 5 }, { name: "samedi", order: 6 }, { name: "dimanche", order: 7 }];

var go_yearlist = [];

for (var i = 2000; i < 2016; i++) {
    go_yearlist.push({ name: i });
}

var go_hourlist = [];

for (var i = 9; i < 22; i++) {
    if (i < 10)
    {
        go_hourlist.push({ name: '0'+i+":00 " });
        go_hourlist.push({ name: '0'+i+":30" });

    } else {
        go_hourlist.push({ name: i+":00 " });
        go_hourlist.push({ name: i+":30" });
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
        <button class="btn btn-secondary oi oi-home" v-on:click="f_home()"></button>
        <button class="btn btn-secondary oi oi-chevron-left" v-on:click="f_back()"></button>
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
            <!-- <h4 class="text-center">ajout groupe</h4> -->
            </div>
            <div id="go_scroll" class="container-fluid">
                <div class="text-center">
                    <h5>
                        nouveau groupe
                    </h5>
                </div>              
                <form><div class="form-row">
                  <div class="form-group col-md">
                     <label for="go_day">jour</label>
                     <select  id ="go_day" class="form-control" v-model="group.day">
                        <option v-for="cur_daylist in daylist">
                           {{cur_daylist.name}}
                        </option>
                     </select>
                  </div>
                  <div class="form-group col-md">
                     <label for="go_hour">heure</label>
                     <select id ="go_hour" class="form-control" v-model="group.hour">
                     <option v-for="cur_hourlist in hourlist">
                        {{cur_hourlist.name}}
                     </option>
                  </select>                     
                  </div>
                  <div class="form-group col-md">
                     <label for="go_court">court</label>
                     <select id ="go_court" class="form-control" v-model="group.court">
                        <option v-for="cur_courtlist in courtlist">
                           {{cur_courtlist.name}}
                        </option>
                     </select>
                  </div>
               </div>
               <div class="form-row">
                  <div class="form-group col-md">
                     <label for="go_level">niveau</label>
                     <select id ="go_level" class="form-control" v-model="group.level">
                        <option v-for="cur_levellist in levellist">
                           {{cur_levellist.name}}
                        </option>
                     </select>
                  </div>
                  <div class="form-group col-md">
                     <label for="go_year">année</label>
                     <select id ="go_year" class="form-control" v-model="group.year">
                        <option v-for="cur_yearlist in yearlist">
                           {{cur_yearlist.name}}
                        </option>
                     </select>
                  </div>
                  <div class="form-group col-md">
                     <label for="go_size">taille</label>
                     <select  id ="go_size" class="form-control" v-model="group.size">
                        <option v-for="cur_sizelist in sizelist">
                           {{cur_sizelist.name}}
                        </option>
                     </select>
                  </div>
               </div></form>
               <div v-if="api_error.length" class="alert alert-danger">
                  <div v-for="cur_api_error in api_error">{{cur_api_error.msg}}</div>
               </div>
            </div>
            <div id="go_footer" class="fixed-bottom text-center">
            <button-bar></button-bar>
            <button type="button" class="btn btn-warning oi oi-check" v-on:click="f_save()"></button>
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
                sizelist: go_sizelist
            }
            );
        },
        methods: {
            f_load:
                // group data load
                function () {
                    var lo_comp = this;
                    //console.log('@f_load');
                    if (lo_comp.id !== "0") {
                        var ls_url = "/api/group?id=" + lo_comp.id;
                        //console.log("-url=" + ls_url);
                        axios.get(ls_url).then(
                            function (response) {
                                //console.log("-rowcount=" + response.data.length);
                                lo_comp.noresult = (response.data.length === 0);
                                lo_comp.group = (lo_comp.noresult ? null : response.data[0]);
                            });
                    } else {
                        lo_comp.group = { day: null, hour: null, court: null, level: null, year: null, size: 6 };
                    }
                },
            f_save: function () {
                //console.log('@f_save');
                var lo_comp = this;
                var ls_url = "/api/group";
                //console.log("-url=" + ls_url);
                lo_comp.api_error.splice(0);
                axios.post(ls_url, lo_comp.group)
                    .then(
                        function (response) {
                            //console.log("-response.status=" + response.status);
                            router.push('/');
                        }
                    )
                    .catch(function (error) {
                        if (error.response) {
                            lo_comp.api_error = error.response.data;
                        }
                        //console.log("-error=" + error.message);
                    });
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
                <!--
                    
                    <button type="button" class="btn btn-warning oi oi-pencil" v-on:click="f_edit_group(group.id)"></button>
                -->
            </div>
            <div id="go_scroll" class="container-fluid">
               <div class="text-center">
                    <h5>
                    {{ group.day.slice(0,3) }} {{ group.hour }} [{{ group.court }}]  
                    <span v-bind:class="'class-level-'+group.level">{{ group.level }}</span>
                    {{ group.year }}
                    </h5>
               </div>
               <table class="table">
                  <thead>
                     <tr>
                        <th>nom</th>
                        <th>prénom</th>
                        <th>année</th>
                        <th></th>
                     </tr>
                  </thead>
                  <tbody>
                     <tr v-for="cur_member in group.member" v-bind:key="cur_member.id">
                        <td>{{cur_member.name}}</td>
                        <td>{{cur_member.firstname}}</td>
                        <td>{{cur_member.year}}</td>
                        <td><button type="button" class="btn btn-danger oi oi-trash" v-on:click="f_del_member(cur_member)"></button></td>
                     </tr>
                     <tr v-if="isempty" >
                        <td colspan=4 class="text-center"><span style="font-style:italic">aucun inscrit</span></td>
                     </tr>
                     <tr v-if="group.isfree">
                        <td><input class="form-control" v-model="new_member.name" placeholder="nom"></td>
                        <td><input class="form-control" v-model="new_member.firstname" placeholder="prénom"></td>
                        <td>
                        <select id ="go_year" class="form-control" v-model="new_member.year">
                        <option v-for="cur_yearlist in yearlist">
                           {{cur_yearlist.name}}
                        </option>
                        </select>
                        </td>
                        <td><button type="button" class="btn btn-warning oi oi-plus" v-on:click="f_add_member()"></button></td>
                     </tr>
                     <!-- isfree -->
                     <tr v-if="api_error.length" class="alert alert-danger">
                        <td  colspan=4>
                           <div v-for="cur_api_error in api_error">{{cur_api_error.msg}}</div>
                        </td>
                     </tr>
                  </tbody>
               </table>
            </div>
            <div id="go_footer" class="fixed-bottom text-center">
            <button-bar></button-bar>
            <button v-if="isempty" type="button" class="btn btn-danger oi oi-trash" v-on:click="f_del_group(group)"></button>
            </div>
         </div>
         <!-- component -->
         
         
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
            f_home:
                function () { router.push('/') },
            f_load:
                // group data load
                function () {
                    var lo_comp = this;
                    //console.log('@f_load');
                    var ls_url = "/api/group?id=" + lo_comp.id;
                    //console.log("-url=" + ls_url);
                    axios.get(ls_url).then(
                        function (response) {
                            //console.log("-rowcount=" + response.data.length);
                            lo_comp.noresult = (response.data.length === 0);
                            if (!lo_comp.noresult) {
                                // sort members
                                response.data[0].member.sort(function (a, b) { return a.name.localeCompare(b.name) });
                            }
                            lo_comp.group = (lo_comp.noresult ? null : response.data[0]);
                        });
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
                        }
                    )
                    .catch(function (error) {
                        if (error.response) {
                            lo_comp.api_error = error.response.data;
                        }
                        //console.log("-error=" + error.message);
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
                                    }
                                )
                                .catch(function (error) {
                                    if (error.response) {
                                        lo_comp.api_error = error.response.data;
                                    }
                                    //console.log("-error=" + error.message);
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
                                        f_home(); // refresh group data
                                    }
                                )
                                .catch(function (error) {
                                    if (error.response) {
                                        lo_comp.api_error = error.response.data;
                                    }
                                    //console.log("-error=" + error.message);
                                });
                        }
                    });

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
        <div class="form-group">
          <label for= "go_filter" > filtre</label>
          <input id="go_filter" class="form-control" v-model="filter" v-on:change="f_filter" placeholder="année, niveau ou jour">
       </div>
       <div class="form-group">
          <div class="form-check">
             <input id="go_isfree" class="form-check-input" type="checkbox" v-model="isfree" v-on:change="f_filter">
             <label class="form-check-label" for="go_isfree">
             libre
             </label>
          </div>
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
                   {{ group.day.slice(0,3) }} {{ group.hour }} [{{ group.court }}]
                </td>
                 <td>
                   <span v-bind:class="'class-level-'+group.level">{{ group.level }}</span>
                </td>                
               <td>
                   {{ group.year }}
                </td>
                <td>
                   <span v-bind:class="{'class-isnotfree' : !group.isfree, 'class-isfree' : group.isfree}">{{ group.member.length }}/{{ group.size }}</span>
                </td>
             </tr>
          </tbody >
       </table>
    </div>
    <div id="go_footer" class="fixed-bottom text-center">
    <button-bar></button-bar>
    <button type="button" class="btn btn-warning oi oi-plus" v-on:click="f_add_group()"></button>
    </div>
 </div>
 
 `,
    data:
        function () {
            return {
                filter: '',
                groups: [],
                isfree: true,
                noresult: true
            };
        },
    methods: {
        f_filter: function () {
            var lo_data = this;
            //console.log("@f_filter");
            var ls_url = "/api/group?";
            var lb_filtered = false;

            if ((!lb_filtered) && go_yearlist.find(function (po_year) { return (lo_data.filter.match(po_year.name)) })) {
                ls_url = ls_url + "year=" + lo_data.filter;
                lb_filtered = true;
            }
            if ((!lb_filtered) && go_daylist.find(function (po_day) { return (lo_data.filter.match(po_day.name)) })) {
                ls_url = ls_url + "day=" + lo_data.filter;
                lb_filtered = true;
            }
            if ((!lb_filtered) && go_levellist.find(function (po_level) { return (lo_data.filter.match(po_level.name)) })) {
                ls_url = ls_url + "level=" + lo_data.filter;
                lb_filtered = true;
            }
            if (lo_data.isfree) {
                ls_url = ls_url + (lb_filtered ? "&isfree" : "isfree");
            }
            if (!lb_filtered) {
                //invalid filter - reset
                lo_data.filter = "";
            }
            //console.log("-url=" + ls_url);


            axios.get(ls_url).then(
                function (response) {
                    //console.log("-rowcount=" + response.data.length);
                    lo_data.noresult = (response.data.length === 0);

                    response.data.sort(function (a, b) {
                        var lo_lkp_order = {};
                        go_daylist.forEach(function (po_day) { lo_lkp_order[po_day.name] = po_day.order; });
                        if (a.day === b.day) {
                            return (a.hour.localeCompare(b.hour));
                        } else {
                            return (lo_lkp_order[a.day] - lo_lkp_order[b.day]);
                        }
                    });

                    lo_data.groups = response.data;

                }); //TODO error handling


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
       <div class="form-group">
          <label for= "go_filter" > filtre</label>
          <input id="go_filter" class="form-control" v-model="filter" v-on:change="f_filter" placeholder="nom">
       </div>
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
                noresult: true
            };
        },
    methods: {
        f_filter: function () {
            var lo_data = this;
            //console.log("@f_filter");
            var ls_url = "/api/member?";
            ls_url = ls_url + "name=" + lo_data.filter.toUpperCase();

            axios.get(ls_url).then(
                function (response) {
                    //console.log("-rowcount=" + response.data.length);
                    lo_data.noresult = (response.data.length === 0);
                    lo_data.members = response.data;

                }); //TODO error handling
        }
    },
    created:
        function () {
            //console.log('created');
        }

};
const router = new VueRouter({
    routes:
        [
            { path: '/', component: group_list },
            { path: '/group', component: group_list },
            { path: '/member', component: member_list },
            { path: '/group/:id', component: group_detail, props: true },
            { path: '/group/:id/edit', component: group_edit, props: true }
        ]

});

const app = new Vue({
    el: '#go_vue_app',
    router: router
});
