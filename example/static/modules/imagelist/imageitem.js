// default list item component
define(function(require){

    var qpf = require("qpf");
    var Meta = qpf.use("components/meta/meta");
    var ko = require("knockout");

    var ListItem = Meta.derive(function(){

        return {
            title : ko.observable(""),
            thumb : ko.observable(""),
            url : ko.observable(),
        }
    }, {
        type : "IMAGEITEM",
        
        css : "image-item",

        initialize : function(){
            this.$el.mousedown(function(e){
                e.preventDefault();
            })
        },

        template : '<div class="qpf-image" data-bind="qpf_image:thumb"></div>'
    })


    ko.bindingHandlers["qpf_image"] = {
        init : function(element, valueAccessor){
            element.innerHTML = "";
            var image = ko.utils.unwrapObservable( valueAccessor() );
            if(typeof image === "string"){
                var img = document.createElement("img");
                img.src = image;
            }else{
                var img = image;
            }
            element.appendChild( img );
        }
    }
    return ListItem;
})