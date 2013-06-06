// default list item component
define(function(require){

    var qpf = require("qpf");
    var Meta = qpf.use("components/meta/meta");
    var ko = require("knockout");

    var ListItem = Meta.derive(function(){

        return {
            title : ko.observable(""),
            icon : ko.observable(""),
            href : ko.observable(""),
        }
    }, {
        type : "LISTITEM",
        
        css : "list-item",

        initialize : function(){
            this.$el.mousedown(function(e){
                e.preventDefault();
            })

            var self = this;
            this.$el.click(function(){
                var href = self.href();
                if(href && href.indexOf("#") == 0){
                    window.location.hash = href;
                }
            })
        },

        template : '<div class="icon" data-bind="css:icon"></div>\
                    <div class="title" data-bind="html:title"></div>'
    })

    return ListItem;
})