// default list item component
define(function(require){

    var qpf = require("qpf");
    var Meta = qpf.use("components/meta/meta");
    var ko = require("knockout");

    var Toggle = Meta.derive(function(){

        return {
            enable : ko.observable(false)
        }
    }, {
        type : "TOGGLE",
        
        css : "toggle",

        initialize : function(){
            this.$el.mousedown(function(e){
                e.preventDefault();
            })

            var self = this;
            this.$el.click(function(){
                self.enable( ! self.enable() );
            })
        },

        template : '<input type="checkbox" value="None" name="check" data-bind="checked:enable" />\
                     <label></label>'
    })

    Meta.provideBinding("toggle", Toggle);
    return Toggle;
})