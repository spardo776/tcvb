"use strict";


var app = new Vue({
    el: '#go_vue_app',
    data: {
        filter: '',
        groups: [],
        isfree: true,
        noresult: false,

    },
    computed: {

    },
    methods: {
        f_filter: function () {
            var lo_app_data = this;
            console.log("filter=" + lo_app_data.filter);
            var ls_url = "http://localhost:8080/api/group?";
            var lb_filtered = false;

            if ((!lb_filtered) && lo_app_data.filter.match('[12][0-9][0-9[0-9]')) {
                ls_url = ls_url + "year=" + lo_app_data.filter;
                lb_filtered = true;
            }
            if ((!lb_filtered) && (lo_app_data.filter.match('lundi|mardi|mercredi|jeudi|vendredi|samedi|dimanche'))) {
                ls_url = ls_url + "day=" + lo_app_data.filter;
                lb_filtered = true;
            }
            if ((!lb_filtered) && (lo_app_data.filter.match('vert|orange|violet'))) {
                ls_url = ls_url + "level=" + lo_app_data.filter;
                lb_filtered = true;
            }
            if (lo_app_data.isfree) {
                ls_url = ls_url + (lb_filtered ? "&isfree" : "isfree");
            }
            if (!lb_filtered) {
                //invalid filter - reset
                lo_app_data.filter="";
            }
            console.log("url=" + ls_url);


            axios.get(ls_url).then(
                function (response) {
                    console.log("rowcount=" + response.data.length);
                    lo_app_data.noresult = (response.data.length === 0);
                    lo_app_data.groups = response.data;

                }); //TODO error handling


        },
        f_open_group : function(ps_group_id){
            var lo_app_data = this;
            console.log('open group='+ps_group_id)
        }

    }
   
})
