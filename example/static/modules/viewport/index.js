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

            if( viewport.mainComponent && 
                viewport.mainComponent.parent &&
                this.processor.image ){
                
                var img = this.processor.image;
                var ratio = img.height/img.width;

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

        onResize : function(){
            viewport.resize();
        },

        setImage : function(img){
            this.processor.image = img;
            this.update();
            this.resize();
        },
        update : _.throttle(function(){
            // If the image is loaded;
            if(viewport.processor.image){
                viewport.processor.update();
                this.trigger("update");
            }
        }, 100),

        processor : new emage.Processor(),

        loadImageFromFile : loadImageFromFile,

        colorAdjustLayer : null,
        hueLayer : null,
        filterLayer : null
    });

    viewport.on("start", function(){
        viewport.mainComponent.$el.find("canvas").replaceWith(this.processor.canvas);

        var filterLayer = new emage.Layer();
        viewport.processor.add(filterLayer);
        var colorAdjustLayer = new emage.Layer("buildin.coloradjust");
        var hueLayer = new emage.Layer("buildin.hue");
        viewport.processor.add(colorAdjustLayer);
        viewport.processor.add(hueLayer);

        this.colorAdjustLayer = colorAdjustLayer;
        this.filterLayer = filterLayer;
        this.hueLayer = hueLayer;

        // viewport.setImage('../file_upload/thumb/1.jpg');
        var img = new Image();
        img.onload = function(){
            viewport.setImage( img );
        }
        img.src = '../file_upload/1.jpg';

    });

    document.body.addEventListener("dragover", function(e){
        e.stopPropagation();
        e.preventDefault();
    }, false);
    document.body.addEventListener("drop", handleDrop, false);

    var imageReader = new FileReader();
    function handleDrop(e){
        e.stopPropagation();
        e.preventDefault();
        var file = e.dataTransfer.files[0];
        if(file && file.type.match(/image/)){
            loadImageFromFile(file);
        }
    }

    function loadImageFromFile(file){
        imageReader.onload = function(e){
            var img = new Image();
            imageReader.onload = null;

            img.onload = function(){
                img.onload = null;
                viewport.setImage(img);

                // remove the hint
                viewport.mainComponent.$el.find(".draghint").remove();
            }
            img.src = e.target.result;
        }
        imageReader.readAsDataURL(file);
    }


    return viewport;
})