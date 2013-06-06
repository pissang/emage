define(function(require){

    var Module = require("../module");
    var xml = require("text!./viewport.xml");
    var Viewport = require("./viewport");

    var qpf = require("qpf");
    var ko = require("knockout");
    var $ = require("$");
    var emage = require("emage");

    var _ = require("_");

    var viewport = new Module({
        name : "viewport",
        xml : xml,

        applyFilter : ko.observable(true),

        resize : function(){
            var img = this.processor.image;
            var ratio = img.height/img.width;

            if( viewport.mainComponent && 
                viewport.mainComponent.parent ){
                
                var main = viewport.mainComponent;
                var maxWidth = main.parent.width();
                var maxHeight = main.parent.height();
                // resize
                if( ratio < 1){
                    main.$el.css({
                        "margin-top" : (maxHeight - maxWidth*ratio)/2+"px",
                        "margin-left" : "0px"
                    } );
                    main.height( maxWidth*ratio );
                    main.width( maxWidth );
                }else{
                    main.$el.css({
                        "margin-left" : (maxWidth - maxHeight/ratio)/2,
                        "margin-top" : "0px"
                    });
                    main.width( maxHeight/ratio );
                    main.height( maxHeight );
                }
            }
        },

        setImage : function(img){
            this.processor.image = img;
            this.processor.update();
            this.resize();
        },
        update : _.throttle(function(){
            viewport.processor.update()
        }, 50),

        processor : null,

        colorAdjustLayer : null,
        filterLayer : null
    })

    viewport.on("start", function(){
        canvas = viewport.mainComponent.$el.find("canvas")[0];
        viewport.processor = new emage.Processor(canvas);

        var filterLayer = new emage.Layer("buildin.gaussian");
        viewport.processor.add(filterLayer);
        var colorAdjustLayer = new emage.Layer("buildin.coloradjust");
        viewport.processor.add(colorAdjustLayer);
        this.colorAdjustLayer = colorAdjustLayer;
        this.filterLayer = filterLayer;

        // viewport.setImage('../file_upload/thumb/1.jpg');
        var img = new Image;
        img.onload = function(){
            viewport.setImage( img );
        }
        img.src = '../file_upload/1.jpg';
    })


    return viewport;
})