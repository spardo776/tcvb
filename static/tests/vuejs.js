// example of component (custom element) - will be used in the main component

Vue.component('activity', {
    props: ['name'], // parameters are element properties
    template: '<li>{{ name }}</li>' // the template = html rendering (ONE root element)
})

// button bar
Vue.component('navig_bar', {
    template: `
    <div>
    test pages :
    <router-link to="/">main</router-link>
    <router-link to="/navig">navig</router-link>
    </div>
    `
})



// main page component

const main = {
    /*
     template (!! one root element !!)
     mustach syntax
     v-bind
     v-for
     v-if
     v-model
     call component
     add a reactive object element
     */
    template: `
    <div v-bind:title="mytitle"> 

{{ name }}

<span v-for="firstname in firstnames" >
<!-- v-for : loop on a binded array-->
{{ firstname }}
</span>
<div v-if="age > 18">
category : adult
</div>
avis:
<input v-model="avis"> {{avis}}
<ul>
<!-- custom element : parameters passed with v-bind:property -->
<activity v-for="activity in activities" v-bind:name="activity.name" v-bind:key="activity.id"></activity>
</ul>
<div>
eyes and hair: {{details.eyes}} {{details.hair}}
<br> size : {{details.size}}
<br> react_size : {{details.react_size}}
<br>

</div>
<button v-on:click="f_grow()">grow</button>
<button v-on:click="f_grow_react()">grow react</button>
<br>
<navig_bar>
</div>`,
    data:
        // in a component, data has to be a function  
        function () {
            return ({
                // data storage
                name: "doe",
                firstnames: ["john", "theodore"], // use v-for for binding
                age: 33, // v-if example
                mytitle: "identity", // v-bind example
                avis: "", // input v-mode example
                details: { "eyes": "red", "hair": "brown" },
                activities: [{ id: 1, name: "foot" }, { id: 2, name: "basket" }] // component
            });
        },
    methods: {
        f_grow: function () {
            lo_comp = this;
            if (!lo_comp.details.size) { lo_comp.details.size = 165 }; // not reactive !!
            lo_comp.details.size = lo_comp.details.size + 1;
            console.log('not reactive', lo_comp.details);
        },
        f_grow_react: function () {
            lo_comp = this;
            if (!lo_comp.details.react_size) { Vue.set(lo_comp.details, 'react_size', 165) }; // reactive !!
            lo_comp.details.react_size = lo_comp.details.react_size + 1;
            console.log('reactive', lo_comp.details);
        },
    },
    created: function () {
        var lo_comp = this;
        console.log('main created');
    }
}

// component navig
const navig = {
    /*
    navig on the same page
    test "in components guards"  => not understood yet!
    => use [watch] for "within component" navig, and [created] for the initial navigation
    */
    template: `<div>
    id={{id}}
    <br>
    <button v-on:click="router.go(-1)">back</button>
    <button v-on:click="f_next()">next</button>
    <p>look at the console !</p>
    <navig_bar>
    </div>`,
    props: ['id'],
    methods: {
        f_back: function () { router.go(-1); },
        f_next: function () { var lo_comp = this; lo_comp.id = parseInt(lo_comp.id) + 1; router.push('/navig/' + lo_comp.id); }
    },
    created: function () {
        var lo_comp = this;
        console.log('navig created - id=' + lo_comp.id);
    },
    watch: {
        $route: function (to, from) {
            console.log('[navig] watch $route : path=', this.$route.path, 'id=', this.id);
            console.log('[navig] watch $route : route.query=', this.$route.query);
            console.log('[navig] watch $route : to=', to);
        }
    },
    beforeRouteUpdate (to, from, next) {
        console.log('[navig] beforeRouteUpdate this.$route.path=', this.$route.path, 'this.id=',this.id,'from.path=',from.path,'to.path=',to.path )
        next();
    },    
    beforeRouteEnter (to, from, next) {
        // this is not defined
        console.log('[navig] beforeRouteEnter ("this" is not defined) from.path=',from.path,'to.path=',to.path ,'')
        next();
    },    
    beforeRouteLeave (to, from, next) {
        console.log('[navig] beforeRouteLeave this.$route.path=', this.$route.path, 'this.id=',this.id,'from.path=',from.path,'to.path=',to.path )
        next();
    }    

}

// router
const router = new VueRouter({
    routes:
        [
            { path: '/', component: main },
            { path: '/navig', component: navig, props: { id: 0 } },
            { path: '/navig/:id', component: navig, props: true },
        ]

});

// app
const app = new Vue(
    {
        el: '#myid', //mapping to app element
        router: router
    }
);