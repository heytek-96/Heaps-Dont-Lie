/*jslint es5:true, indent: 2 */
/*global sharedVueStuff, Vue, socket */
'use strict';

//Två listor, ungefär som det ser ut.
var priceList = {small: 35,
                medium: 40,
                large: 45};
var maxIngredList = {small: 2,
                    medium: 3,
                    large: 4};

// Det här var lite slitigt att få till men det är alltså labelelementet som är klickbart. Och customid är unikt för varje ingrediens, men det finns exempel i funktioner längre ner hur det går att komma åt specefika element. /P
Vue.component('ingredient', {
    props: ['item', 'type', 'customid'],
    template: '<div class=ingred>\
  <label :class="customid" :for="id" style="display: block;">\
  <input :class="customid" :id="id" type="checkbox" @change="checkboxEvent(this.checkboxstate)" :checked="checkboxstate">\
  <p>{{item["ingredient_en"]}}</p>\
  </label>\
  </div>',
    data: function () {
        return {
            checkboxstate: false,
            id: null
        }
    },
    mounted: function () {
        this.id = this._uid; //Krävs för att slippa ange idn själv.
    },
    methods: {
        checkboxEvent: function () { //Om ni lägger till något här som inte funkar kan det vara ordningen som är fel. /P
            /* Varje gång den osynliga checkboxen ändras sker detta. Det går också att köra funktionen rakt av. */
            if (this.checkboxstate) {
                this.checkboxstate = false;
                document.getElementsByClassName(this.customid)[0].setAttribute("style", "background-color:aliceblue;");
                //Verkar som att eventuell styling bör ske innan emit. 
                this.$emit('checkbox-untick');
            } else {
                this.checkboxstate = true;
                document.getElementsByClassName(this.customid)[0].setAttribute("style", "background-color: #ee99acad;");
                
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
        chosenFruitGreens: [],
        chosenBase: "",
        chosenTopping: "",
        chosenBoost: "",
        maxIngred: 0,
        volume: 0,
        price: 0,
        priceTot: 0,
        size: "",
        startShown: true,
        sizeShown: false,
        ingredientsShown: false,
        customizeShown: false,
        customizeHasBeenShown: false,
        extrasShown: false,
        extraHasBeenShown: false,
        overviewShown: false,
        overviewHasBeenShown: false,
        payShown: false
    },
    methods: {

        selectSize: function(size){
            /*   Justerar antagligen inte priset på rätt sätt om en boost/topping är vald.   */
            this.size = size;
            var newMaxIngred = maxIngredList[size];
            if (newMaxIngred < this.chosenFruitGreens.length){
                this.resetIngredientSelection();
                alert("Your order did not fit the new size, please choose ingredients again.");
            }
            this.maxIngred = newMaxIngred;
            if (this.extraHasBeenShown === false){
                this.priceTot = priceList[size]; 
            }
            
            this.showIngredients();
            
        },
        
        newSinglechoiceSelected: function (item, type) { 
            /* Tar först bort det gamla valet och lägger sedan till det nya i listan. Uppdelat i två funktioner för att spara plats */
            if (!((type === "base" && this.chosenBase === "") || (type === "topping" && this.chosenTopping === "") || (type === "boost" && this.chosenBoost === ""))) {
                this.replaceChoice(type);
            }
            this.addToOrder(item, type);
        },

        replaceChoice: function (type) {
            //* Tar bort det gamla valet. Själva ersättandet sker dock först när nästa item läggs till i funktionen ovan. 
            var oldChoice;
            var chosenOld;
            if (type === "base") {
                chosenOld = this.chosenBase;
            } else if (type === "topping") {
                chosenOld = this.chosenTopping;
            } else if (type === "boost") {
                chosenOld = this.chosenBoost;
            }
            for (var i = 0; i < this.chosenIngredients.length; i++) {
                if (chosenOld === this.chosenIngredients[i].ingredient_en) {
                    oldChoice = this.chosenIngredients[i];
                }
            }
            var box = document.getElementsByClassName(type + oldChoice.ingredient_en)[1].id;
            this.$refs.ingredient[box - 1].checkboxEvent();
        },

        newFruitGreenSelected: function(item, type){
            /*Lägger till frukt/grönt om det finns plats. Denna och newSingleChoiceSelected anropas från html via vue. */
            if (this.chosenFruitGreens.length < this.maxIngred){
                this.addToOrder(item, type);
            } else {
                alert("Too many fruits/greens! Deselect first or change size");
                var box = document.getElementsByClassName(type + item.ingredient_en)[1].id;
                this.$refs.ingredient[box-1].unclick();
            }
            
        },


        removeFromOrder: function (item, type) {
            /* Gör som namnet antyder */
            var index = this.chosenIngredients.indexOf(item);
            if (index > -1) {
                this.chosenIngredients.splice(index, 1);

                if (type === "base") {
                    this.chosenBase = ""; 
                } else if (type === "boost") {
                    this.chosenBoost = "";
                    this.priceTot -= 7;
                } else if (type === "topping") {
                    this.chosenTopping = "";
                    this.priceTot -= 10;
                } else if (type === "fruit" || type === "green") {
                    var index = this.chosenFruitGreens.indexOf(item);
                    if (index > -1) {
                        this.chosenFruitGreens.splice(index, 1);
                    }
                }
            }
        },

        addToOrder: function (item, type) { //Tog bort allt tråk med volume, det känns ändå som att det är fel siffror. I övrigt är den ganska basic, men om vi ropar direkt på den kommer knappvalen inte att påverkas osv. /Patrik.
            
            this.chosenIngredients.push(item); 
            this.type = type;

            if (type === "fruit" || type === "green") {
                this.chosenFruitGreens.push(item);
            }
            else if (this.type === "base") {
                this.chosenBase = item.ingredient_en;
            } else if (type === "boost") {
                this.chosenBoost = item.ingredient_en;
                this.priceTot += 7;
            } else if (type === "topping") {
                this.chosenTopping = item.ingredient_en;
                this.priceTot += 10;
            }
        },
        placeOrder: function () { //Småfixar /P
            var order = {
                ingredients: this.chosenIngredients,
                volume: this.volume,
                type: this.type,
                price: this.price,
                priceTot: this.priceTot,
                size: this.size,
                chosenBase: this.chosenBase,
                chosenTopping: this.chosenTopping,
                chosenBoost: this.chosenBoost,
                chosenFruitGreens: this.chosenFruitGreens
            };
            // make use of socket.io's magic to send the stuff to the kitchen via the server (app.js)
            socket.emit('order', {
                orderId: getOrderNumber(),
                order: order
            });
            this.resetIngredientSelection(); //Har inte fixat så att den hamnar på rätt sida.
            this.showIngredients();
        },

        resetIngredientSelection: function () {
            /* Tror att denna ger samma resultat som att trycka på f5, trycka på start och välja samma size */
            for (var i = 0; i < this.$refs.ingredient.length; i++) {
                this.$refs.ingredient[i].unclick();
            }

            this.volume = 0;
            this.price = 0;
            this.priceTot = 0;
            this.type = '';
            this.chosenIngredients = [];
            this.chosenBase = '';
            this.chosenTopping = '';
            this.chosenBoost = '';
            this.chosenFruitGreens = [];
            
            this.extraHasBeenShown = false;
            this.customizeHasBeenShown = false;
            this.overviewHasBeenShown = false;
            
            //Notera avsaknad av size och maxIngred



        },

        showStart: function () {
            //Resettar förhoppningsvis fortfarande allting /Patrik
            
            this.resetIngredientSelection();
            this.size='';
            this.maxIngred=0;
          
            this.extraHasBeenShown = false;
            this.customizeHasBeenShown = false;
            this.overviewHasBeenShown = false;

            this.startShown = true;
            this.sizeShown = false;
            this.ingredientsShown = false;
            this.customizeShown = false;
            this.extrasShown = false;
            this.overviewShown = false;
            this.payShown = false;
        },

        showSize: function () {
            this.startShown = false;
            this.ingredientsShown = false;
            this.customizeShown = false;
            this.extrasShown = false;
            this.overviewShown = false;
            this.payShown = false;
            this.sizeShown = true;
        },
        showIngredients: function () { //Effekterna av size sker nu i selectSize istället /P
            this.startShown = false;
            this.customizeShown = false;
            this.extrasShown = false;
            this.overviewShown = false;
            this.payShown = false;
            this.sizeShown = false;
            this.ingredientsShown = true;
        },
        showCustomize: function () {
            this.startShown = false;
            this.extrasShown = false;
            this.overviewShown = false;
            this.payShown = false;
            this.sizeShown = false;
            this.ingredientsShown = false;
            this.customizeShown = true;
            this.customizeHasBeenShown = true;
        },
        showExtras: function () {
            this.startShown = false;
            this.overviewShown = false;
            this.payShown = false;
            this.sizeShown = false;
            this.ingredientsShown = false;
            this.customizeShown = false;
            this.extrasShown = true;
            this.extraHasBeenShown = true;
        },
        showOverview: function () {
            this.startShown = false;
            this.payShown = false;
            this.sizeShown = false;
            this.ingredientsShown = false;
            this.customizeShown = false;
            this.extrasShown = false;
            this.overviewShown = true;
            this.overviewHasBeenShown = true;
        },
        showPay: function () {
            this.startShown = false;
            this.sizeShown = false;
            this.ingredientsShown = false;
            this.customizeShown = false;
            this.extrasShown = false;
            this.overviewShown = false;
            this.payShown = true;
        },

        getUniqueId: function (key, magnitude) { //Löser problem med duplicate keys. Säg till om ni behöver använda detta så gör vi system.
            return key + (magnitude * 100);
        }

    }

});



var slider = document.getElementById('slider-color');

noUiSlider.create(slider, {
	start: [33, 66],
	connect: [true, true, true],
  orientation: 'vertical',
  margin: 20,
  direction: 'rtl',
  padding: 20,
	range: {
		'min': [  0 ],
		'max': [ 100 ]
	}
});

var connect = slider.querySelectorAll('.noUi-connect');
var classes = ['c-1-color', 'c-2-color', 'c-3-color', 'c-4-color', 'c-5-color'];

for ( var i = 0; i < connect.length; i++ ) {
    connect[i].classList.add(classes[i]);
}

console.log(slider.noUiSlider.get()); 

