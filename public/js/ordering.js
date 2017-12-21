/*jslint es5:true, indent: 2 */
/*global sharedVueStuff, Vue, socket */
'use strict';

Vue.component('ingredient', {
  props: ['item', 'type', 'lang'],
  template: ' <div class="ingredient">\
  <label>\
  <button v-on:click="incrementCounter">{{ counter }}</button>\
  {{item["ingredient_"+ lang]}} ({{ (type=="fruit") ? item.vol_smoothie:item.vol_juice }} ml), {{item.selling_price}}:-, {{item.stock}} pcs\
  </label>\
  </div>',
  data: function () {
    return {
      counter: 0
    };
  },
  methods: {
    incrementCounter: function () {
      this.counter += 1;
      this.$emit('increment');
    },
    resetCounter: function () {
      this.counter = 0;
    }
  }
});

function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

function getOrderNumber() {
  // It's probably not a good idea to generate a random order number, client-side.
  // A better idea would be to let the server decide.
  return "#" + getRandomInt(1, 1000000);
}

var vm = new Vue({
  el: '#ordering',
  mixins: [sharedVueStuff], // include stuff that is used both in the ordering system and in the kitchen
  data: {
    type: '',
    chosenIngredients: [],
    volume: 0,
    price: 0,
    size: "medium",
    startShown: true,
    sizeShown: false,
    ingredientsShown: false,
    customizeShown:false,
    extrasShown: false,
    overviewShown:false,
    payShown: false
  },
  methods: {
    addToOrder: function (item, type) {
      this.chosenIngredients.push(item);
      this.type = type;
      if (type === "fruit") {
        this.volume += +item.vol_smoothie; // Det här är egentligen för om man har valt Smoothie/Juice. Det är därför det blir "0ml" bredvid ibland när vi kör. /Clara
      } else if (type === "green") {
        this.volume += +item.vol_juice;
      }
      else if (type === "base") {
        this.volume += +item.vol_juice;
      }
      else if (type === "boost") {
        this.volume += +item.vol_juice;
      }
      else if (type === "topping") {
        this.volume += +item.vol_juice;
      }
      this.price += +item.selling_price;
    },
    placeOrder: function () {
      var i,
      //Wrap the order in an object
      order = {
        ingredients: this.chosenIngredients,
        volume: this.volume,
        type: this.type,
        price: this.price,
      };
      // make use of socket.io's magic to send the stuff to the kitchen via the server (app.js)
      socket.emit('order', {orderId: getOrderNumber(), order: order});
      //set all counters to 0. Notice the use of $refs
      for (i = 0; i < this.$refs.ingredient.length; i += 1) {
        this.$refs.ingredient[i].resetCounter();
      }
      this.volume = 0;
      this.price = 0;
      this.type = '';
      this.chosenIngredients = [];

    },

    showStart: function (){
      this.startShown = true;
      this.sizeShown = false;
      this.ingredientsShown = false;
      this.customizeShown = false;
      this.extrasShown = false;
      this.overviewShown = false;
      this.payShown = false;
    },

    showSize: function (){
      this.startShown = false;
      this.ingredientsShown = false;
      this.customizeShown = false;
      this.extrasShown = false;
      this.overviewShown = false;
      this.payShown = false;
      this.sizeShown = true;
    },
    showIngredients: function (){
      this.startShown = false;
      this.customizeShown = false;
      this.extrasShown = false;
      this.overviewShown = false;
      this.payShown = false;
      this.sizeShown = false;
      this.ingredientsShown = true;
    },
    showCustomize: function(){
      this.startShown = false;
      this.extrasShown = false;
      this.overviewShown = false;
      this.payShown = false;
      this.sizeShown = false;
      this.ingredientsShown = false;
      this.customizeShown = true;
    },
    showExtras: function(){
      this.startShown = false;
      this.overviewShown = false;
      this.payShown = false;
      this.sizeShown = false;
      this.ingredientsShown = false;
      this.customizeShown = false;
      this.extrasShown = true;
    },
    showOverview: function(){
      this.startShown = false;
      this.payShown = false;
      this.sizeShown = false;
      this.ingredientsShown = false;
      this.customizeShown = false;
      this.extrasShown = false;
      this.overviewShown = true;
    },
    showPay: function(){
      this.startShown = false;
      this.sizeShown = false;
      this.ingredientsShown = false;
      this.customizeShown = false;
      this.extrasShown = false;
      this.overviewShown = false;
      this.payShown = true;
    }
  }
});
