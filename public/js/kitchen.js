/*jslint es5:true, indent: 2 */
/*global sharedVueStuff, Vue, socket */
'use strict';

/* Vue.component('order-to-display',{
props:
}), */

Vue.component('order-list-item', {
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
        isAtStart: true,
        isAtPrevious: false,
        isAtWaiting: false,
        showStart: true,
        showListOfWaitingOrders: false,
        showListOfPreviousOrders: false,
        showOrder: false,
        currentRow: "",
        orderBeingDisplayed: {}

    },
    created: function () {
        window.addEventListener("keydown", function (e) {

            if (e.key === "Escape") {
                this.goBack();
            }

            if (e.key === "ArrowLeft") {
                if ((this.isAtStart && this.showStart) && (typeof this.$refs.prevorder !== "undefined")) {
                    this.showPreviousOrders();
                    this.selectFirstOrder();
                } else if (this.isAtWaiting && this.showListOfWaitingOrders) {
                    this.showStartPage();
                }
            }
            if (e.key === "ArrowRight") {
                if ((this.isAtStart && this.showStart) && (typeof this.$refs.waitingorder !== "undefined")) {
                    this.showWaitingOrders();
                    this.selectFirstOrder();
                } else if (this.isAtPrevious && this.showListOfPreviousOrders) {
                    this.showStartPage();
                }
            }
            if (e.key === "Enter") {
                if (this.isAtStart && this.countOrders() > 0) {
                    this.showWaitingOrders();
                    this.selectFirstOrder();
                } else if (this.showListOfWaitingOrders || this.showListOfPreviousOrders) {
                    this.displayOrder();
                } else if (this.showOrder) {
                    //Om man är inne på en order
                }
            }

            if ((this.showListOfWaitingOrders && (typeof this.$refs.waitingorder !== "undefined")) || (this.showListOfPreviousOrders && (typeof this.$refs.prevorder !== "undefined"))) {
                if (e.key === "ArrowDown") {
                    this.traverseList('down');
                }
                if (e.key === "ArrowUp") {
                    this.traverseList('up');
                }
            }
        }.bind(this));
    },

    //lägg till if-satser för olika sidor. knapptryck har olika innebörd på olika sidor.

    methods: {
        traverseList: function (dir) {
            var orderRows;
            if (this.showListOfWaitingOrders) {
                orderRows = this.$refs.waitingorder;
            } else if (this.showListOfPreviousOrders) {
                orderRows = this.$refs.prevorder;
            }

            for (var i = 0; i < orderRows.length; i++) {
                if (orderRows[i].orderId === this.currentRow) {
                    if (dir === 'up' && i > 0) {
                        orderRows[i].checkboxEvent();
                        orderRows[i - 1].checkboxEvent();
                        this.currentRow = orderRows[i - 1].orderId;
                    }
                    if (dir === 'down' && i + 1 < orderRows.length) {
                        orderRows[i].checkboxEvent();
                        orderRows[i + 1].checkboxEvent();
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

        selectWaitingOrder: function () {
            var orderRows = this.$refs.waitingorder;
            for (var i = 0; i < orderRows.length; i++) {
                if (orderRows[i].checkboxstate) {
                    //this.showOrder(orderRows[i].orderId);
                }
            }
        },

        sendCancel: function (orderid) {
            socket.emit("cancelOrder", orderid);
        },

        selectFirstOrder: function () {
            var orderList;
            var orderRows;
            if (this.showListOfWaitingOrders) {
                orderList = this.waitingOrders;
                orderRows = this.$refs.waitingorder;
            } else if (this.showListOfPreviousOrders) {
                orderList = this.previousOrders;
                orderRows = this.$refs.prevorder;
            }
            if (Object.keys(orderList).length > 0) {
                var firstOrder = orderList[0].nr;
                for (var i = 0; i < orderRows.length; i++) {
                    if (orderRows[i].orderId === firstOrder) {
                        orderRows[i].checkboxEvent();
                        this.currentRow = firstOrder;
                    }
                }
            }

        },

        unclickAll: function () {
            if (typeof this.$refs.waitingorder !== "undefined") {
                for (var i = 0; i < this.$refs.waitingorder.length; i++) {
                    this.$refs.waitingorder[i].unclick();
                }
            }
            if (typeof this.$refs.prevorder !== "undefined") {
                for (var i = 0; i < this.$refs.prevorder.length; i++) {
                    this.$refs.prevorder[i].unclick();
                }
            }

        },

        showStartPage: function () {
            this.unclickAll();
            this.showStart = true;
            this.showListOfWaitingOrders = false;
            this.showListOfPreviousOrders = false;
            this.showOrder = false;
            this.isAtPrevious = false;
            this.isAtWaiting = false;
            this.isAtStart = true;
        },

        showWaitingOrders: function () {
            this.showStart = false;
            this.showListOfWaitingOrders = true;
            this.showListOfPreviousOrders = false;
            this.showOrder = false;
            this.isAtStart = false;
            this.isAtWaiting = true;

        },

        showPreviousOrders: function () {
            this.showStart = false;
            this.showListOfWaitingOrders = false;
            this.showListOfPreviousOrders = true;
            this.showOrder = false;
            this.isAtStart = false;
            this.isAtPrevious = true;
        },

        displayOrder: function () {
            if (this.showListOfWaitingOrders) {
                this.showListOfWaitingOrders = false;
                this.openOrder('waitingorder');
            }
            if (this.showListOfPreviousOrders) {
                this.showListOfPreviousOrders = false;
                this.openOrder('prevorder');
            }
            this.showOrder = true;
            console.log(this.orderBeingDisplayed.nr);
        },

        goBack: function () {
            if ((this.isAtPrevious && this.showListOfPreviousOrders) || (this.isAtWaiting && this.showListOfWaitingOrders)) {
                this.showStartPage();
            } else if (this.showOrder) {
                if (this.isAtWaiting) {
                    this.showListOfWaitingOrders = true;
                }
                if (this.isAtPrevious) {
                    this.showListOfPreviousOrders = true;
                }
                this.orderBeingDisplayed = {};
                this.showOrder = false;
            }
        },

        openOrder: function (reference) {
            var orderRows;
            if (reference === 'waitingorder') {
                orderRows = this.$refs.waitingorder;
            } else if (reference === 'prevorder') {
                orderRows = this.$refs.prevorder;
            }
            for (var i=0; i<orderRows.length; i++){
                if (orderRows[i].checkboxstate){
                    this.orderBeingDisplayed = orderRows[i].order;
                }
            }
        }

    }
});
