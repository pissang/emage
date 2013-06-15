define(function(require){

    var qpf = require("qpf");
    var Meta = qpf.use("meta/meta");
    var ko = require("knockout");

    var Viewport = Meta.derive(function(){
        return {
            tag : "canvas"
        }
    }, {
        type : 'VIEWPORT',
        css : "viewport"
    })

    Meta.provideBinding("viewport", Viewport);

    return Viewport;
})