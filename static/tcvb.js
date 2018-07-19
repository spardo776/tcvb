"use strict";
const group_detail = Vue.component('group-detail', 
{
    template :
    `group {{id}}
    <!--
    {{ group.day }} {{ group.hour }}h
    <table>
    <tr v-for="member in group.member" v-bind:key="member.id">
    <td>{{member.name}}</td>
    </tr>
    </table> -->
    `,
    props : [ 'id'],
    data:
    function (){
        return {
            group : {},
            noresult : true
        }
    },
    methods: {
        f_load: 
        function () {
            lo_data=this;
            console.log('load');
            var ls_url = "http://localhost:8080/api/group?id=" + lo_data.id;
            console.log("url=" + ls_url);
            axios.get(ls_url).then(
                function (response) {
                    console.log("rowcount=" + response.data.length);
                    lo_data.noresult = (response.data.length === 0);
                    lo_data.group = ( lo_data.noresult ? null : response.data[0] );
                });
        }
    },
    beforeRouteUpdate :
    function (to, from, next) {
        f_load();
        next;
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
            <th>niveau/age</th>
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
            console.log("filter=" + lo_data.filter);
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
            console.log("url=" + ls_url);


            axios.get(ls_url).then(
                function (response) {
                    console.log("rowcount=" + response.data.length);
                    lo_data.noresult = (response.data.length === 0);
                    lo_data.groups = response.data;

                }); //TODO error handling


        },
        f_open_group: function (ps_group_id) {
            console.log('open group=' + ps_group_id);
            router.push('/group/'+ps_group_id)
        }

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
