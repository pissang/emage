define(function(){

    var qpf = require("qpf");
    var Meta = qpf.use("components/meta/meta");
    var ko = qpf.use("knockout");

    var NavLink = Meta.derive(function(){

        return {
            icon : ko.observable(),
            title : ko.observable(""),
            href : ko.observable("")
        }
    }, {
        type : "NAVLINK",
        
        css : "navlink",

        initialize : function(){
            var self = this;
            this.$el.click(function(e){
                window.location.hash = '#/' + self.href()
            })
        },

        template : '<div class="icon" data-bind="css:icon"></div>\
                    <div class="title" data-bind="html:title"></div>'
    })

    Meta.provideBinding("navlink", NavLink);

    return NavLink;
})