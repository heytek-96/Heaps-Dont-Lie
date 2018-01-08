/*jslint es5:true, indent: 2 */
/*global io, Vue */
/*exported sharedVueStuff */
'use strict';

var socket = io();

Vue.component('order-item', {
    props: ['uiLabels', 'order', 'orderId', 'lang'],
    template: '<div>{{orderId}}  {{uiLabels.ingredients}}: {{ order.ingredients.map(item=>item["ingredient_"+ lang]).join(", ") }} </div>'
});

// Stuff that is used both in the ordering system and in the kitchen
var sharedVueStuff = {
    data: {
        orders: {},
        uiLabels: {},
        ingredients: {},
        lang: "en",
        noneleft: {}, //används i ordering
        waitingOrders: {}, //används i köket
        previousOrders: {}
    },
    created: function () {
        socket.on('initialize', function (data) {
            this.orders = data.orders;
            this.uiLabels = data.uiLabels;
            this.ingredients = data.ingredients;
            this.noneleft = this.ingredients.filter(function (obj) {
                return obj.stock < 1;
            });
            this.adjustOrderLists();
        }.bind(this));

        socket.on('switchLang', function (data) {
            this.uiLabels = data;
        }.bind(this));

        socket.on('currentQueue', function (data) {
            this.orders = data.orders;
            if (typeof data.ingredients !== 'undefined') {
                this.ingredients = data.ingredients;
                this.noneleft = {};
                this.noneleft = this.ingredients.filter(function (obj) {
                    return obj.stock < 1;
                });
            }
            this.adjustOrderLists();
        }.bind(this));
    },
    methods: {
        switchLang: function () {
            if (this.lang === "en") {
                this.lang = "sv";
            } else {
                this.lang = "en";
            }
            socket.emit('switchLang', this.lang);
        },
        getSize: function (){
          var chosenSize = this.size;
          if (this.lang === "sv"){
            if(this.size === "small"){
              chosenSize = "liten"
            }
            if(this.size === "medium"){
              chosenSize = "mellan"
            }
            if(this.size ==="large"){
              chosenSize = "stor"
            }
            }
          return chosenSize
        },
        adjustOrderLists: function () {
            this.waitingOrders = {};
            this.previousOrders = {};
            if (Object.keys(this.orders).length > 0) {
                var orderKeys = Object.keys(this.orders);
                var j = 0;
                var k = 0;
                for (var i = 0; i < orderKeys.length; i++) {
                    if (this.orders[orderKeys[i]].done === false) {
                        this.orders[orderKeys[i]].nr = orderKeys[i];
                        this.waitingOrders[j] = this.orders[orderKeys[i]];
                        j++;
                    }else if(this.orders[orderKeys[i]].done === true){
                        this.orders[orderKeys[i]].nr = orderKeys[i];
                        this.previousOrders[k] = this.orders[orderKeys[i]];
                        k++;
                    }
                }
            }
        }
    }
};
