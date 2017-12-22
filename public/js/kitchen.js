/*jslint es5:true, indent: 2 */
/*global sharedVueStuff, Vue, socket */
'use strict';

Vue.component('order-item-to-prepare', {
  props: ['uiLabels', 'order', 'orderId', 'lang'],
  template: '<div>\
          <order-item\
            :ui-labels="uiLabels"\
            :lang="lang"\
            :order-id="orderId"\
            :order="order">\
          </order-item>\
          <button v-on:click="orderDone">\
            {{uiLabels.ready}}\
          </button>\
          <button v-on:click="cancelOrder">\
            {{uiLabels.cancel}}\
          </button>\
         </div>',

  methods: {
    orderDone: function () {
      this.$emit('done');
    },
    cancelOrder: function () {
      this.$emit('cancel');
     } 
}
    
       
});


var vm = new Vue({
  el: '#orders',
  mixins: [sharedVueStuff], // include stuff that is used both in the ordering system and in the kitchen
  data: {      
  waitingForOrder: false,
  showListofWaitingOrders: false,
  showListOfPreviousOrders:false,
  showNextOrder: false     

  },
  created: function() {
      window.addEventListener("keydown", function(e) {
        
          if(e.key === "ArrowLeft")
              this.showPreviousOrders();
          if(e.key === "ArrowRight")
              this.showWaitingOrders();
          if(e.key === "Enter")
              this.showOrderToPrepare();
      }.bind(this));
  },
   
    //lägg till if-satser för olika sidor. knapptryck har olika innebörd på olika sidor.
  
  methods: {
    markDone: function (orderid) {
      socket.emit("orderDone", orderid);
    },
    countOrders: function () {
        var counter = 0;
        for (var i in this.orders) {
            if(!this.orders[i].done){
                counter+=1;
            }    
        }
        return counter;
    },
      nextOrderToPrepare: function(){
          for(var i in this.orders){
              if(!this.orders[i].done){
                  return {orderId: i, order: this.orders[i] };
                 
              }
          }
      },
    
    sendCancel: function (orderid) {
    socket.emit("cancelOrder", orderid);
    },
    showWaitingForOrderPage: function () {
      this.waitingForOrder = true;
      this.showListofWaitingOrders = false;
      this.showListOfPreviousOrders=false;
      this.showNextOrder= false;    
    },
    showWaitingOrders: function () {
      this.waitingForOrder = false;
      this.showListofWaitingOrders = true;
      this.showListOfPreviousOrders=false;
      this.showNextOrder= false;
        
    },
    showPreviousOrders: function(){
      this.waitingForOrder = false;
      this.showListofWaitingOrders = false;    
      this.showListOfPreviousOrders = true;
      this.showNextOrder= false;    
    },
    showOrderToPrepare: function(){
      this.waitingForOrder = false;
      this.showListofWaitingOrders = false;    
      this.showListOfPreviousOrders = false;
      this.showNextOrder= true;    
  }
     
  }
});

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

