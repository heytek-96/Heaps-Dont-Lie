/*jslint es5:true, indent: 2 */
/*global sharedVueStuff, Vue, socket */
'use strict';

Vue.component('order-item-to-prepare', {
    props: ['uiLabels', 'order', 'orderId', 'lang'],
    template: '<tr :class="orderId">\
        <td>\
        <input :id="id" type="checkbox" @change="checkboxEvent(this.checkboxstate)" :checked="checkboxstate" style="position: absolute;">\
        {{orderId}} </td>\
        <td> {{order.size}} </td>\
        <td><ol><li v-for="ingr in order.ingredients">\
            {{ingr.ingredient_en}}\
        </li></ol></td>\
        <td><button v-on:click="orderDone">\
            {{uiLabels.ready}}\
         </button></td>\
         <td><button v-on:click="cancelOrder">\
            {{uiLabels.cancel}}\
          </button></td></tr>',

    data: function () {
        return {
            checkboxstate: false,
            id: null

        }
    },
    mounted: function () {
        this.id = this._uid;
    },
    methods: {
        orderDone: function () {
            this.$emit('done');
        },
        cancelOrder: function () {
            this.$emit('cancel');
        },
        checkboxEvent: function () {
            if (this.checkboxstate) {
                this.checkboxstate = false;
                document.getElementsByClassName(this.orderId)[0].setAttribute("style", "background-color:aliceblue;");
                this.$emit('checkbox-untick');
            } else {
                this.checkboxstate = true;
                document.getElementsByClassName(this.orderId)[0].setAttribute("style", "background-color: #ee99acad;");
                this.$emit('checkbox-tick');
            }
        },
        unclick: function () { //Kör en klick, men bara om knappen är vald
            if (this.checkboxstate) {
                this.checkboxEvent();
            }
        }

    }
});


var vm = new Vue({
    el: '#orders',
    mixins: [sharedVueStuff], // include stuff that is used both in the ordering system and in the kitchen
    data: {
        waitingForOrder: false,
        showListofWaitingOrders: false,
        showListOfPreviousOrders: false,
        showNextOrder: false,
        currentRow: ""

    },
    created: function () {
        window.addEventListener("keydown", function (e) {

            if (e.key === "ArrowLeft") {
                this.showPreviousOrders();
            }
            if (e.key === "ArrowRight" && this.showListofWaitingOrders === false) {
                this.showWaitingOrders();
            }
            if (e.key === "Enter") {
                this.showOrderToPrepare();
            }
            if (this.showListofWaitingOrders && (typeof this.$refs.orderrow !== "undefined")) {
                if (e.key === "ArrowDown") {
                    this.traverseList('down');
                }
                if (e.key === "ArrowUp") {
                    this.traverseList('up');
                }
            } else if (typeof this.$refs.orderrow !== "undefined") {
                for (var i = 0; i < this.$refs.orderrow.length; i++) {
                    this.$refs.orderrow[i].unclick();
                }
            }
        }.bind(this));
    },

    //lägg till if-satser för olika sidor. knapptryck har olika innebörd på olika sidor.

    methods: {
        traverseList: function (dir) {
            var orderRows = this.$refs.orderrow;
            for (var i = 0; i < orderRows.length; i++) {
                if (orderRows[i].orderId === this.currentRow) {
                    if (dir === 'up' && i > 0) {
                        this.$refs.orderrow[i].checkboxEvent();
                        this.$refs.orderrow[i - 1].checkboxEvent();
                        this.currentRow = orderRows[i - 1].orderId;
                    }
                    if (dir === 'down' && i + 1 < orderRows.length) {
                        this.$refs.orderrow[i].checkboxEvent();
                        this.$refs.orderrow[i + 1].checkboxEvent();
                        this.currentRow = orderRows[i + 1].orderId;
                    }
                    break
                }
            }
        },
        markDone: function (orderid) {
            socket.emit("orderDone", orderid);
        },
        countOrders: function () {
            var counter = 0;
            for (var i in this.orders) {
                if (!this.orders[i].done) {
                    counter += 1;
                }
            }
            return counter;
        },
        nextOrderToPrepare: function () {
            for (var i in this.orders) {
                if (!this.orders[i].done) {
                    return {
                        orderId: i,
                        order: this.orders[i]
                    };

                }
            }
        },

        sendCancel: function (orderid) {
            socket.emit("cancelOrder", orderid);
        },

        selectFirstOrder: function () {
            if (Object.keys(this.waitingOrders).length > 0) {
                var firstOrder = this.waitingOrders[0].nr;
                var orderRows = this.$refs.orderrow;
                for (var i = 0; i < orderRows.length; i++) {
                    if (orderRows[i].orderId === firstOrder) {
                        this.$refs.orderrow[i].checkboxEvent();
                        this.currentRow = firstOrder;
                    }
                }



            }

        },

        showWaitingForOrderPage: function () {
            this.waitingForOrder = true;
            this.showListofWaitingOrders = false;
            this.showListOfPreviousOrders = false;
            this.showNextOrder = false;
        },
        showWaitingOrders: function () {
            this.selectFirstOrder();
            this.waitingForOrder = false;
            this.showListofWaitingOrders = true;
            this.showListOfPreviousOrders = false;
            this.showNextOrder = false;

        },
        showPreviousOrders: function () {
            this.waitingForOrder = false;
            this.showListofWaitingOrders = false;
            this.showListOfPreviousOrders = true;
            this.showNextOrder = false;
        },
        showOrderToPrepare: function () {
            this.waitingForOrder = false;
            this.showListofWaitingOrders = false;
            this.showListOfPreviousOrders = false;
            this.showNextOrder = true;
        }

    }
});

/*
var slider = document.getElementById('slider-color');

noUiSlider.create(slider, {
	start: [ 4000, 8000, 12000, 16000 ],
	connect: [false, true, true, true, true],
	range: {
		'min': [  2000 ],
		'max': [ 20000 ]
	}
});

var connect = slider.querySelectorAll('.noUi-connect');
var classes = ['c-1-color', 'c-2-color', 'c-3-color', 'c-4-color', 'c-5-color'];

for ( var i = 0; i < connect.length; i++ ) {
    connect[i].classList.add(classes[i]);
}
*/
