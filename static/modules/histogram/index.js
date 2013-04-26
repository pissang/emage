define(function(require){

    var Module = require("../module");
    var xml = require("text!./histogram.xml");
    var qpf = require("qpf");
    var layers = require("../layers/index");

    var ko = qpf.use('knockout');

    require('./histogram');

    var histogram;
    var module = new Module({
        name : "histogram",
        xml : xml,

        onResize : function(){
            var self = this;
            // after the module is started;
            setTimeout(function(){
                var $body = self.$el.find('.qpf-panel-body');
                histogram.resize( $body.width(), $body.height() );
            })
        },

        update : function(image){
            if( image ){
                setTimeout( function(){
                    histogram.setImage( image );
                } ) 
            }else{
                histogram.refresh();
            }
        },
        histogram : null
    })

    module.on('start', function(){
        histogram = module.$el.find('.qpf-ui-histogram').qpf("get")[0];
    })

    
    return module;
})