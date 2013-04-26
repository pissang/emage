// default list item component
define(function(require){

    var qpf = require("qpf");
    var qtek = require('qtek');
    var qtek2d = qtek['2d'];
    var Meta = qpf.use("components/meta/meta");
    var ko = qpf.use("knockout");

    var Histogram = Meta.derive(function(){

        return {

            stage : null,
            scene : null,
            paths : {
                r : null,
                g : null,
                b : null
            },

            resizeCanvas : null,
            resizeContext : null,

            size : 128,
            sample : 2
        }
    }, {
        type : "HISTOGRAM",
        
        css : "histogram",

        initialize : function(){
            this.stage = new qtek2d.Renderer();
            this.scene = new qtek2d.Scene();
            // init path
            this.paths.r = new qtek2d.renderable.Path({
                stroke : false,
                style : new qtek2d.Style({
                    fill : "red",
                    globalAlpha : 0.5,
                    shadow : '0 -2 3 black'
                })
            });
            this.paths.g = new qtek2d.renderable.Path({
                stroke : false,
                style : new qtek2d.Style({
                    fill : "green",
                    globalAlpha : 0.5
                })
            });
            this.paths.b = new qtek2d.renderable.Path({
                stroke : false,
                style : new qtek2d.Style({
                    fill : "blue",
                    globalAlpha : 0.5
                })
            });
            this.scene.add( this.paths.r);
            this.scene.add( this.paths.g);
            this.scene.add( this.paths.b);

            // resize the image
            var resizeCanvas = document.createElement('canvas');
            resizeCanvas.width = this.size;
            resizeCanvas.height = this.size;

            this.resizeCanvas = resizeCanvas;
            this.resizeContext = resizeCanvas.getContext('2d');
        },

        template : '',

        setImage : function( image ){
            this.resizeContext.drawImage( image, 0, 0, this.size, this.size);
            this.refresh();
        },

        refresh : function(){
            var histogram = this.computeHistogram();
            histogram.r = this.normalizeHistogram(histogram.r);
            histogram.g = this.normalizeHistogram(histogram.g);
            histogram.b = this.normalizeHistogram(histogram.b);

            this.updatePath('r', histogram.r);
            this.updatePath('g', histogram.g);
            this.updatePath('b', histogram.b);

            this.stage.render( this.scene );
        },

        initPath : function( field ){
            var path = this.paths[field],
                height = this.height(),
                unit = this.width()/256*this.sample;
            path.segments = [{
                point : [0, height]
            }];
            var offset = 0;
            for(var i =0; i < 256; i+=this.sample){
                path.segments.push({
                    point : [offset, 0]
                })
                offset += unit;
            }
            path.pushPoints([
                [this.width(), height],
                [0, height],
            ])
        },

        updatePath : function(field, histogram){
            var path = this.paths[field],
                height = this.height();
            for( var i = this.sample; i < 257; i+=this.sample){
                path.segments[i/this.sample].point[1] = (1-histogram[i-1])*height
            }
            // path.smooth( 0.1 )
        },

        computeHistogram : function(){

            var imageData = this.resizeContext.getImageData(0, 0, this.size, this.size),
                data = imageData.data,
                histogram = {
                    r : [],
                    g : [],
                    b : []
                };
            for(var i = 0; i < 256; i++){
                histogram.r[i] = 0;
                histogram.g[i] = 0;
                histogram.b[i] = 0;
            }
            for(var i = 0; i < this.size*this.size*4; i+=4){
                var r = data[i], g = data[i+1], b = data[i+2];
                histogram.r[r]++;
                histogram.g[g]++;
                histogram.b[b]++;
            }
            return histogram;
        },

        normalizeHistogram : function(arr){
            var max = Math.max.apply( Math, arr);
            var result = [];
            for(var i = 0; i < arr.length; i++){
                result.push( (max == 0 || isNaN(max) ) ? 0 : arr[i]/max );
            }
            return result;
        },

        afterRender : function(){
            this.$el[0].appendChild( this.stage.canvas );
        },

        afterResize : function(){
            this.stage.resize( this.width(), this.height() );
            this.initPath('r');
            this.initPath('g');
            this.initPath('b');
            this.refresh();
        }
    })

    Meta.provideBinding("histogram", Histogram);
    return Histogram;
})