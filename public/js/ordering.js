/*jslint es5:true, indent: 2 */
/*global sharedVueStuff, Vue, socket */
'use strict';

var priceList = {
    small: 35,
    medium: 40,
    large: 45
};

var maxIngredList = {
    small: 2,
    medium: 3,
    large: 4
};

Vue.component('ingredient', {
    props: ['item', 'type', 'customid'],
    template: '<div class=ingred v-show="anyleft">\
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
    computed: {
        anyleft: function () { //Ingredienser försvinner om dom är slut /P
            if (typeof vm === 'undefined') {
                return true;
            } else {
                return (vm.ingredients[vm.ingredients.indexOf(this.item)].stock > 0)
            }
        },
        amountleft: function () {
            return vm.ingredients[vm.ingredients.indexOf(this.item)].stock;
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
                document.getElementsByClassName(this.customid)[0].setAttribute("style", "background-color: white;");
                //Verkar som att eventuell styling bör ske innan emit.
                this.$emit('checkbox-untick');
            } else {
                this.checkboxstate = true;
                document.getElementsByClassName(this.customid)[0].setAttribute("style", "background-color: #f5ba51;");
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

//Help buttons
function helpSize() {
    var popup = document.getElementById("helpSize");
    popup.classList.toggle("show");
}

function helpIngred() {
    var popup = document.getElementById("helpIngred");
    popup.classList.toggle("show");
}

function helpCustomize() {
    var popup = document.getElementById("helpCustomize");
    popup.classList.toggle("show");
}

function helpExtras() {
    var popup = document.getElementById("helpExtras");
    popup.classList.toggle("show");
}

function helpOverview() {
    var popup = document.getElementById("helpOverview");
    popup.classList.toggle("show");
}

function adjustSelectedIngredType() {
    var buttons = document.getElementsByName('ingredienttype');
    for (var i = 0; i < buttons.length; i++) {
        if (buttons[i].checked) {
            var button = buttons[i];
            break
        }
    }
    if (button.value === 'base') {
        vm.showingBase = true;
        vm.showingFruit = false;
        vm.showingGreens = false;
    } else if (button.value === 'fruit') {
        vm.showingBase = false;
        vm.showingFruit = true;
        vm.showingGreens = false;
    } else if (button.value === 'greens') {
        vm.showingBase = false;
        vm.showingFruit = false;
        vm.showingGreens = true;
    }
    for (var i = 0; i < buttons.length; i++) {
        buttons[i].parentElement.setAttribute('style', 'border-color: lightgrey;');
    }
    button.parentElement.setAttribute('style', 'border-color: pink;');
}

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
        showingBase: true,
        showingFruit: false,
        showingGreens: false,
        customizeShown: false,
        customizeHasBeenShown: false,
        extrasShown: false,
        extraHasBeenShown: false,
        overviewShown: false,
        overviewHasBeenShown: false,
        payShown: false,
        slider: "",
        sliderArray: [],
        fruitGreensInSlider: [],
        colors: [],
        overviewSlider: ""
    },
    methods: {

        customIndexOf: function (nameStr, ingArray) {
            for (var i = 0; i < ingArray.length; i++) {
                if (nameStr === ingArray[i].ingredient_en) {
                    return i;
                }
            }
            return -1;
        },
        languageSV: function(){
          var languageSV = false;
          if(this.lang==="sv"){
            languageSV = true;
          }
          return languageSV
        },
        languageEN: function(){
          var languageEN = false;
          if(this.lang==="en"){
            languageEN = true;
          }
          return languageEN
        },

        checkIngredientsLeft: function () {
            for (var i = 0; i < this.chosenIngredients.length; i++) {
                var itemName = this.chosenIngredients[i].ingredient_en;
                if (this.noneleft.find(function (obj) {
                        return obj.ingredient_en === itemName
                    })) {
                    return false;
                }
            }
            return true;
        },

        selectSize: function (size) {
            /*   Justerar antagligen inte priset på rätt sätt om en boost/topping är vald.   */
            this.size = size;
            var newMaxIngred = maxIngredList[size];
            if (newMaxIngred < this.chosenFruitGreens.length) {
                this.resetIngredientSelection();
                alert("Your order did not fit the new size, please choose ingredients again.");
            }
            this.maxIngred = newMaxIngred;
            if (this.extraHasBeenShown === false) {
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

        newFruitGreenSelected: function (item, type) {
            /*Lägger till frukt/grönt om det finns plats. Denna och newSingleChoiceSelected anropas från html via vue. */
            if (this.chosenFruitGreens.length < this.maxIngred) {
                this.addToOrder(item, type);
            } else {
                alert("Too many fruits/greens! Deselect first or change size");
                var box = document.getElementsByClassName(type + item.ingredient_en)[1].id;
                this.$refs.ingredient[box - 1].unclick();
            }
        },

        removeFromOrder: function (item, type) {
            /* Gör som namnet antyder */
            var index = this.customIndexOf(item.ingredient_en, this.chosenIngredients);
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
                    var index = this.customIndexOf(item.ingredient_en, this.chosenFruitGreens);
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
            } else if (this.type === "base") {
                this.chosenBase = item.ingredient_en;
            } else if (type === "boost") {
                this.chosenBoost = item.ingredient_en;
                this.priceTot += 7;
            } else if (type === "topping") {
                this.chosenTopping = item.ingredient_en;
                this.priceTot += 7;
            }
        },

        placeOrder: function () {
            if (this.chosenIngredients.length > 0) {
                var valid = this.checkIngredientsLeft();
                if (valid) { //Kollar att allt finns kvar. Kör den här för tillfället.
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
                        chosenFruitGreens: this.chosenFruitGreens,
                        changeArray: this.computeChange(),
                        sliderArray: this.sliderArray
                    };
                    // make use of socket.io's magic to send the stuff to the kitchen via the server (app.js)
                    socket.emit('order', {
                        orderId: getOrderNumber(),
                        order: order
                    });
                    this.resetIngredientSelection();
                    this.showIngredients();
                } else {
                    alert('We just ran out of some of your selected ingredients, please start over!');
                    this.showStart();
                }
            } else {
                alert('pls select something');
            }
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
            // this.chosenIngredients = []; Tror detta redan körs eftersom allt avmarkeras. Om ni får märkliga buggar med ingrediensvalen kan det vara värt att testa att köra dessa rader.
            // this.chosenBase = '';
            //  this.chosenTopping = '';
            //  this.chosenBoost = '';
            // this.chosenFruitGreens = [];
            this.extraHasBeenShown = false;
            this.customizeHasBeenShown = false;
            this.overviewHasBeenShown = false;
            //Notera avsaknad av size och maxIngred
        },

        showStart: function () {
            //Resettar förhoppningsvis fortfarande allting /Patrik
            this.resetIngredientSelection();
            this.size = '';
            this.maxIngred = 0;
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
            this.getCurrentSliderArray();
        },

        showIngredients: function () { //Effekterna av size sker nu i selectSize istället /P
            this.startShown = false;
            this.customizeShown = false;
            this.extrasShown = false;
            this.overviewShown = false;
            this.payShown = false;
            this.sizeShown = false;
            this.ingredientsShown = true;
            this.getCurrentSliderArray();
        },

        showCustomize: function () {
            this.getCurrentSliderArray();
            this.destroySlider();
            this.createSlider();
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
            this.getCurrentSliderArray();
            this.startShown = false;
            this.overviewShown = false;
            this.payShown = false;
            this.sizeShown = false;
            this.ingredientsShown = false;
            this.customizeShown = false;
            this.extrasShown = true;
            this.extraHasBeenShown = true;
            this.computeRatios();
            this.findBase();
        },

        showOverview: function () {
            this.getCurrentSliderArray();
            this.destroyOverviewSlider();
            this.createOverviewSlider();
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
            this.getCurrentSliderArray();
        },

        getUniqueId: function (key, magnitude) { //Löser problem med duplicate keys. Säg till om ni behöver använda detta så gör vi system.
            return key + (magnitude * 100);
        },

        createSlider: function () {
            var startArray = [];
            var connectArray = [];
            this.colors = [];
            for (var i = 1; i < this.chosenFruitGreens.length; i++) {
                startArray.push(100 * i / (this.chosenFruitGreens.length));

            }
            for (var i = 0; i < this.chosenFruitGreens.length; i++) {
                connectArray.push(true);
                this.colors.push(this.chosenFruitGreens[i].color);
            }
            this.slider = document.getElementById('slider-color');
          
            noUiSlider.create(this.slider, {
                start: startArray,
                connect: connectArray,
                orientation: 'vertical',
                margin: 10,
                direction: 'rtl',
                padding: 10,
                range: {
                    'min': [0],
                    'max': [100]
                }
            });
            var connect = this.slider.querySelectorAll('.noUi-connect');
            for (var i = 0; i < connect.length; i++) {
                //baklänges för att få färgerna i rätt ordning i koppen
                connect[i].style.background = this.colors[connect.length - i - 1];
            }
            if (this.compareArrays(this.fruitGreensInSlider, this.chosenFruitGreens)) {
                this.slider.noUiSlider.set(this.sliderArray);
            }
            this.getCurrentSliderArray();
            this.fruitGreensInSlider = this.chosenFruitGreens.slice();
        },

        createOverviewSlider: function () {
            var startArray = [];
            var connectArray = [];
            this.colors = [];
            for (var i = 1; i < this.chosenFruitGreens.length; i++) {
                startArray.push(100 * i / (this.chosenFruitGreens.length));
            }
            for (var i = 0; i < this.chosenFruitGreens.length; i++) {
                connectArray.push(true);
                this.colors.push(this.chosenFruitGreens[i].color);
            }
            this.overviewSlider = document.getElementById('overviewSlider');
            noUiSlider.create(this.overviewSlider, {
                start: startArray,
                connect: connectArray,
                orientation: 'vertical',
                margin: 10,
                direction: 'rtl',
                padding: 10,
                range: {
                    'min': [0],
                    'max': [100]
                }
            });

            var connect = this.overviewSlider.querySelectorAll('.noUi-connect');

            for (var i = 0; i < connect.length; i++) {
                //baklänges för att få färgerna i rätt ordning i koppen
                connect[i].style.background = this.colors[connect.length - i - 1];
            }

            this.overviewSlider.noUiSlider.set(this.sliderArray);
            //this.overviewSlider.setAttribute('disabled', true);

            var origins = this.overviewSlider.getElementsByClassName('noUi-origin');
            for (var i = 0; i < origins.length; i++) {
                origins[i].setAttribute('disabled', true);
            }
        },

        destroySlider: function () {
            if (this.slider !== "") {
                this.slider.noUiSlider.destroy();
                this.slider = "";
            }
        },

        destroyOverviewSlider: function () {
            if (this.overviewSlider !== "") {
                this.overviewSlider.noUiSlider.destroy();
                this.overviewSlider = "";
            }
        },

        getCurrentSliderArray: function () {
            if (this.slider !== "") {
                this.sliderArray = this.slider.noUiSlider.get().slice();
            }
        },

        findBaseString: function () {
            if (this.chosenBase !== "") { //Gå bara in när man har valt en bas
                var baseStr = "";
                for (var i = 0; i < this.chosenIngredients.length; i++) {
                    if (this.chosenBase === this.chosenIngredients[i].ingredient_en) {
                        var baseObj = this.chosenIngredients[i];
                    }
                }
                if (this.lang === "en") {
                    baseStr = baseObj.ingredient_en;
                }
                if (this.lang === "sv") {
                    baseStr = baseObj.ingredient_sv;
                }
                return baseStr
            }
        },

        findToppingString: function () {
            if (this.chosenTopping !== "") { //Gå bara in när man har valt en topping
                var toppingStr = "";
                for (var i = 0; i < this.chosenIngredients.length; i++) {
                    if (this.chosenTopping === this.chosenIngredients[i].ingredient_en) {
                        var toppingObj = this.chosenIngredients[i];
                    }
                }
                if (this.lang === "en") {
                    toppingStr = toppingObj.ingredient_en;
                }
                if (this.lang === "sv") {
                    toppingStr = toppingObj.ingredient_sv;
                }
                return toppingStr
            }
        },

        findBoostString: function () {
            if (this.chosenBoost !== "") { //Gå bara in när man har valt en boost
                var boostStr = "";
                for (var i = 0; i < this.chosenIngredients.length; i++) {
                    if (this.chosenBoost === this.chosenIngredients[i].ingredient_en) {
                        var boostObj = this.chosenIngredients[i];
                    }
                }
                if (this.lang === "en") {
                    boostStr = boostObj.ingredient_en;
                }
                if (this.lang === "sv") {
                    boostStr = boostObj.ingredient_sv;
                }
                return boostStr
            }
        },

        compareArrays: function (array1, array2) {
            if (array1.length !== array2.length) {
                return false;
            }
            for (var i = 0; i < array1.length; i++) {
                if (array1[i].ingredient_en !== array2[i].ingredient_en) {
                    return false;
                }
            }
            return true;
        },

        printArray: function () {
            for (var i = 0; i < this.chosenFruitGreens.length; i++) {
                console.log(i);
                console.log(this.chosenFruitGreens[i].ingredient_en);
            }
        },

        computeRatios: function () {
            var ratioArray = [];
            if (Array.isArray(this.sliderArray)) {
                ratioArray[0] = this.sliderArray[0];

                for (var i = 1; i < this.chosenFruitGreens.length - 1; i++) {
                    ratioArray[i] = this.sliderArray[i] - this.sliderArray[i - 1];
                }
                ratioArray[this.chosenFruitGreens.length - 1] = 100 - this.sliderArray[this.sliderArray.length - 1]
            } else {
                ratioArray[0] = this.sliderArray;
                ratioArray[1] = 100 - this.sliderArray;
            }
            return ratioArray.reverse();
        },

        findBase: function () {
            for (var i = 0; i < this.chosenIngredients.length; i++) {
                if (this.chosenBase === this.chosenIngredients[i].ingredient_en) {
                    return this.chosenIngredients[i]
                }
            }
        },

        findBaseIndex: function () {
            for (var i = 0; i < this.chosenIngredients.length; i++) {
                if (this.chosenBase === this.chosenIngredients[i].ingredient_en) {
                    return i
                }
            }
        },

        findToppingIndex: function () {
            for (var i = 0; i < this.chosenIngredients.length; i++) {
                if (this.chosenTopping === this.chosenIngredients[i].ingredient_en) {
                    return i
                }
            }
        },

        findBoostIndex: function () {
            for (var i = 0; i < this.chosenIngredients.length; i++) {
                if (this.chosenBoost === this.chosenIngredients[i].ingredient_en) {
                    return i
                }
            }
        },

        computeSliderVolumes: function () {
            var computedVolumes = []
            //i ml
            //säger att bas alltid är 1/3 av drycken
            if (this.size == "small") {
                computedVolumes = this.computeRatios().map(function (x) {
                    return x * (3 - 1)
                })
            }
            if (this.size == "medium") {
                computedVolumes = this.computeRatios().map(function (x) {
                    return x * (4 - 4 / 3)
                })
            }
            if (this.size == "large") {
                computedVolumes = this.computeRatios().map(function (x) {
                    return x * (5 - 5 / 3)
                })
            }
            return computedVolumes;
        },

        computeBaseVol: function () {
            if (this.size == "small") {
                return 300 / 3;
            } else if (this.size == "medium") {
                return 400 / 3;
            } else if (this.size == "large") {
                return 500 / 3;
            }
        },

        computeChange: function () {
            var changeArray = []
            var sliderIngredCounter = 0;
            for (var i = 0; i < this.chosenIngredients.length; i++) {
                if (i == this.findBaseIndex()) {
                    var baseVol = this.chosenIngredients[i].vol_smoothie;
                    var baseChange = 1;
                    while (baseVol < this.computeBaseVol()) {
                        baseVol = baseVol + this.chosenIngredients[i].vol_smoothie;
                        baseChange += 1;
                    }
                    changeArray.push(baseChange);
                } else if (i == this.findToppingIndex()) {
                    var toppingChange = 1;
                    changeArray.push(toppingChange);
                } else if (i == this.findBoostIndex()) {
                    var boostChange = 1;
                    changeArray.push(boostChange);
                } else {
                    var ingredChange = 1;
                    var vol = this.chosenIngredients[i].vol_smoothie;
                    while (vol < this.computeSliderVolumes()[sliderIngredCounter]) {
                        vol = vol + this.chosenIngredients[i].vol_smoothie;
                        ingredChange += 1;
                    }
                    changeArray.push(ingredChange);
                    sliderIngredCounter += 1;
                }
            }
            return changeArray;
        }
    }
});
