// default list item component
define(function(require){

    var qpf = require("qpf");
    var emage = require("emage");
    var ko = require("knockout");
    var qtek2d = emage.qtek["2d"];
    var Meta = qpf.use("meta/meta");

    var Histogram = Meta.derive(function(){

        return {

            image : null,

            _stage : new qtek2d.Renderer(),
            _scene : new qtek2d.Scene(),
            _paths : {
                red : new qtek2d.renderable.Path({
                    stroke : false,
                    style : new qtek2d.Style({
                        fill : "red",
                        globalAlpha : 0.4,
                        shadow : '0 -2 2 #333'
                    })
                }),
                green : new qtek2d.renderable.Path({
                    stroke : false,
                    style : new qtek2d.Style({
                        fill : "green",
                        globalAlpha : 0.4,
                        shadow : '0 -2 2 #333'
                    })
                }),
                blue : new qtek2d.renderable.Path({
                    stroke : false,
                    style : new qtek2d.Style({
                        fill : "blue",
                        globalAlpha : 0.4,
                        shadow : '0 -2 2 #333'
                    })
                }),

                redStroke : new qtek2d.renderable.Path({
                    fill : false,
                    style : new qtek2d.Style({
                        stroke : "#950000",
                        globalAlpha : 0.7
                    })
                }),
                greenStroke : new qtek2d.renderable.Path({
                    fill : false,
                    style : new qtek2d.Style({
                        stroke : "#009500",
                        globalAlpha : 0.7
                    })
                }),
                blueStroke : new qtek2d.renderable.Path({
                    fill : false,
                    style : new qtek2d.Style({
                        stroke : "#000095",
                        globalAlpha : 0.7
                    })
                })
            },

            size : 128,
            sample : ko.observable(2),

            _histogram : new emage.Histogram()
        }
    }, {
        type : "HISTOGRAM",
        
        css : "histogram",

        initialize : function(){

            this._scene.add( this._paths.red);
            this._scene.add( this._paths.green);
            this._scene.add( this._paths.blue);

            this._scene.add( this._paths.redStroke);
            this._scene.add( this._paths.greenStroke);
            this._scene.add( this._paths.blueStroke);

            this._histogram.downSample = 1/8;
        },

        template : '',

        update : function(){
            if( ! this.image){
                return;
            }
            this._histogram.image = this.image;
            this._histogram.update();
        },

        refresh : function(){
            if( ! this.image){
                return;
            }
            histogramArray = this.getNormalizedHistogram();

            this.updatePath('red', histogramArray.red);
            this.updatePath('green', histogramArray.green);
            this.updatePath('blue', histogramArray.blue);

            this._stage.render( this._scene );
        },

        initPath : function( field ){
            var path = this._paths[field],
                height = this.height(),
                sample = this.sample(),
                unit = this.$el.width()/256*sample;
            path.segments = [{
                point : [0, height]
            }];
            var offset = 0;
            for(var i =0; i < 256; i+=sample){
                path.segments.push({
                    point : [offset, 0]
                })
                offset += unit;
            }
            path.pushPoints([
                [this.$el.width(), height],
                [0, height],
            ])

            this._paths[field+"Stroke"].segments = path.segments;
        },

        updatePath : function(field, array){
            var path = this._paths[field],
                height = this.height(),
                sample = this.sample();
            for( var i = sample; i < 257; i+=sample){
                path.segments[i/sample].point[1] = (1-array[i-1])*height
            }
            path.smooth(1);
        },

        getNormalizedHistogram : function(){

            function normalize(arr){
                var result = [];
                for(var i = 0; i < arr.length; i++){
                    result.push( arr[i] / 256 );
                }
                return result;
            }

            var channels = this._histogram.channels;
            return {
                red : normalize(channels.red),
                green : normalize(channels.green),
                blue : normalize(channels.blue)
            }
        },

        afterRender : function(){
            this.$el[0].appendChild( this._stage.canvas );
        },

        onResize : function(){
            if(this._stage){
                this._stage.resize( this.$el.width(), this.$el.height() );
            }
            this.initPath('red');
            this.initPath('green');
            this.initPath('blue');
            this.refresh();
        }
    })

    Meta.provideBinding("histogram", Histogram);
    return Histogram;
})