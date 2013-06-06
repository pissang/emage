define(function(require){

    var Module = require("../module");
    var xml = require("text!./filters.xml");
    var qpf = require("qpf");
    var FilterView = require("./filter");
    var dataSource = require("./source");
    var viewport = require("../viewport/index");
    var _ = require("_");

    var ko = require('knockout');

    var filters = new Module({
        name : "filters",
        xml : xml,

        filters : ko.observableArray( dataSource.filters ),
        FilterView : FilterView,

        seachKeyword : ko.observable(""),

        colorAdjust : {
            brightness : ko.observable(0),
            contrast : ko.observable(1),
            exposure : ko.observable(0),
            gamma : ko.observable(1),
            saturation : ko.observable(1),
        }
    })

    ko.computed(function(){
        viewport.colorAdjustLayer.set({
            "brightness" : filters.colorAdjust.brightness(),
            "contrast" : filters.colorAdjust.contrast(),
            "exposure" : filters.colorAdjust.exposure(),
            "gamma" : filters.colorAdjust.gamma(),
            "saturation" : filters.colorAdjust.saturation()
        });
        viewport.update();
    })

    filters.seachKeyword.subscribe(function(newValue){
        if( ! newValue ){
            filters.filters( dataSource.filters );
        }else{
            filters.filters( _.filter(filters.filters(), function(value){
                return value.name.indexOf( newValue.toLowerCase() ) >= 0 ||
                        value.title.indexOf( newValue )>=0;
            }) )
        }
    })

    return filters;
})