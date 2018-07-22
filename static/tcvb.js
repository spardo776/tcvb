"use strict";

const group_detail = Vue.component('group-detail', 
{
    template :
    `
<div>
{{ group.day }} {{ group.hour }}h - court{{group.court}} - <span v-bind:class="'class-level-'+group.level">{{ group.year }}</span>
<table>
   <thead>
      <tr>
         <th>prénom</th>
         <th>nom</th>
         <th>année</th>
         <th></th>
      </tr>
   </thead>
   <tbody>
      <tr v-if="(! group.member) || (group.member.length===0)">
         <td colspan=3 style="text-align:center;font-style:italic">aucun inscrit</td>
      </tr>
      <tr v-for="cur_member in group.member" v-bind:key="cur_member.id">
         <td>{{cur_member.firstname}}</td>
         <td>{{cur_member.name}}</td>
         <td>{{cur_member.year}}</td>
         <td><button>-</button></td>
      </tr>
      <tr v-if="group.isfree">
         <td><input v-model="new_member.firstname"></td>
         <td><input v-model="new_member.name"></td>
         <td><input v-model="new_member.year"></td>
         <td><button v-on:click="f_add_member()">+</button></td>
      </tr>
      <!-- isfree -->
      <tr v-for="cur_add_error in add_error">
      <td class="alert alert-danger" colspan=3>{{cur_add_error.msg}}</td>
      </tr>
   </tbody>
</table>

</div> <!-- component -->
    `,
    props : [ 'id'], // group id
    data:
    function (){
        return ({
            group : {},
            noresult : true,
            new_member : { },
            add_error : { }
            }
        );
    },
    methods: {
        f_load: 
        // group data load
        function () {
            var lo_comp=this;
            console.log('@f_load');
            var ls_url = "http://localhost:8080/api/group?id=" + lo_comp.id;
            console.log("-url=" + ls_url);
            axios.get(ls_url).then(
                function (response) {
                    console.log("-rowcount=" + response.data.length);
                    lo_comp.noresult = (response.data.length === 0);
                    lo_comp.group = ( lo_comp.noresult ? null : response.data[0] );
                });
        },
        // add a member in group
        f_add_member: function () {
            var lo_comp=this;
            console.log('@f_add_member');
            lo_comp.new_member.group_id=lo_comp.group.id;
            var ls_url="http://localhost:8080/api/member";
            console.log("-url=" + ls_url);
            axios.post(ls_url,lo_comp.new_member)
            .then(
                function (response) {
                    console.log("-response.status="+response.status)
                    lo_comp.f_load(); // refresh group data
                }
            )
            .catch(function (error) {
                if (error.response) {
                    lo_comp.add_error=error.response.data;
                }
                console.log("-error="+error.message);
              });
        }
    },
    created :
    function () {
        console.log('@created'); 
        this.f_load();
    }
})
const group_list =  {
    template: `
<div>
    <div class="form-group">
        <label for= "go_filter" > filtre</label>
        <input id="go_filter" class="form-control" v-model="filter" v-on:change="f_filter" placeholder="année, niveau, jour ...">
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
            <th>jour/heure</th>
            <th>niveau/année</th>
            <th>effectif</th>
        </thead>
        <tbody>
        <tr v-for="group in groups" v-bind:key="group.id" v-on:click="f_open_group(group.id)">
            <td>
                {{ group.day }} {{ group.hour }}h
            </td>
            <td>
                <span v-bind:class="'class-level-'+group.level">{{ group.year }}</span>
            </td>
            <td>
                <span v-bind:class="{'class-isnotfree' : !group.isfree, 'class-isfree' : group.isfree}">{{ group.member.length }}/{{ group.size }}</span>
            </td>
        </tr>
    </tbody >
    </table>
</div>`,
    data:
        function () {
            return {
                filter: '',
                groups: [],
                isfree: true,
                noresult: false
            }
        },
    methods: {
        f_filter: function () {
            var lo_data = this;
            console.log("@f_filter");
            var ls_url = "http://localhost:8080/api/group?";
            var lb_filtered = false;

            if ((!lb_filtered) && lo_data.filter.match('[12][0-9][0-9[0-9]')) {
                ls_url = ls_url + "year=" + lo_data.filter;
                lb_filtered = true;
            }
            if ((!lb_filtered) && (lo_data.filter.match('lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche'))) {
                ls_url = ls_url + "day=" + lo_data.filter;
                lb_filtered = true;
            }
            if ((!lb_filtered) && (lo_data.filter.match('vert|orange|violet'))) {
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
            console.log("-url=" + ls_url);


            axios.get(ls_url).then(
                function (response) {
                    console.log("-rowcount=" + response.data.length);
                    lo_data.noresult = (response.data.length === 0);
                    lo_data.groups = response.data;

                }); //TODO error handling


        },
        f_open_group: function (ps_group_id) {
            console.log('@f_open group ' + ps_group_id);
            router.push('/group/'+ps_group_id)
        }

    },
    created :
    function () {
        console.log('created'); 
        this.f_filter();
    }

};

const router = new VueRouter({
    routes:
        [
            { path: '/', component: group_list },
            { path: '/group/:id', component: group_detail, props: true },
        ]

});

const app = new Vue({
   el: '#go_vue_app',
   router: router
})
