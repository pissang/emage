define(function(require){

    var qpf = require("qpf");
    var Button = qpf.use("meta/button");
    var Meta = qpf.use("meta/meta");
    var ko = require("knockout");

    var IconButton = Button.derive(function(){
        return {
            $el : $("<div></div>"),
            icon : ko.observable("")
        }
    }, {
        type : "ICONBUTTON",
        css : _.union("icon-button", Button.prototype.css),

        template : '<div class="qpf-icon" data-bind="css:icon"></div>',
    })

    Meta.provideBinding("iconbutton", IconButton);

    return IconButton;

})