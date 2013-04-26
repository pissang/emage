define(function(require){
    
    var qpf = require("qpf");
    var Widget = qpf.use("components/widget/widget");
    var ko = qpf.use("knockout");
    var layerHTML = require("text!./layer.html");

    var Layer = Widget.derive(function(){

        return {
            title : ko.observable(""),
            parameters : ko.observableArray()
        }
    }, {

        type : "Layer",
        css : "layer",

        template : layerHTML,

        afterResize : function(){
            
            _.each(this.$el.find(".qpf-parameter-component").qpf("get"),function(item){
                item.afterResize();
            });
            Widget.prototype.afterResize.call(this);
        }
    });

    return Layer;
})