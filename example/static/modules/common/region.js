// Application will have specificated layout
// And each part in the layout is called Region
// Region will manage how the modules under it is load and unload

define(function(require){
    
    var qpf = require("qpf");
    var Meta = qpf.use("meta/meta");
    var Base = qpf.use("base");
    var ko = require("knockout");
    var _ = require("_")

    var router = require("../router");

    var Region = Base.derive(function(){
        // Example of controller config
        //{
        //  "modules/moduleConfig/index" : {
        //      "url" : ""/methods/:page/:module:/config",
        //      "context" : ["page", "module"]
        //  }
        return {
            controller : {},

            _moduleCache : {},

            _currentModule : null
        }
    }, {

        type : "REGION",
        
        css : "region",

        initialize : function(){
            var self = this;
            _.each(this.controller, function(config, modulePath){
                var url = config.url,
                    context = config.context;
                if( url ==="*"){
                    self.enterModule(modulePath, {}, function(){});
                }else{
                    router.on("after", url, self.leaveModule.bind(self, modulePath) );
                    router.on( url, self.enterModule.bind(self, modulePath, context) ); 
                }
            })
            // router.on( "/", self._updateStatus.bind(self) );
        },

        _updateStatus : function(){
            var self = this;
            var next = Array.prototype.pop.call(arguments);
            // put it in next tick after the enter module event is executed;
            var cacheSize = 0;
            _.each(self._moduleCache, function(module){
                cacheSize++;
                if( module.__enable__ ){
                    module.enable( next );
                }else{
                    module.disable( next );
                }
            })
            if( ! cacheSize){
                next()
            }
        },

        leaveModule : function(modulePath){
            var module = this._moduleCache[modulePath];
            var next = Array.prototype.pop.call(arguments);
            
            if( module ){
                // mark as disable
                // real enable and disable will be executed
                // batchly in the _updateStatus
                // module.__enable__ = false;
                module.disable( next );
            }
        },

        enterModule : function(modulePath, contextFields){
            var context = {};
            var self = this;
            var next = Array.prototype.pop.call(arguments);

            var params = Array.prototype.slice.call(arguments, 2);

            if( contextFields ){
                _.each(params, function(param, idx){
                    var field = contextFields[idx];
                    if( field ){
                        context[field] = param;
                    }
                })  
            }
            var module = this._moduleCache[modulePath];

            if( ! module){
                require([modulePath], function(module){
                    if( module && module.start){
                        
                        var $el = module.start( );
                        if( $el ){
                            // Append after application resize finished
                            // In case the module is in cache and loaded immediately
                            // _.defer(function(){
                                self.$el.append( $el );
                            // })
                        }
                        module.mainComponent.parent = self;
                        // module.__enable__ = true;
                        module.enable( next )
                        module.setContext(context);

                        self._moduleCache[modulePath] = module;
                        self._currentModule = module;
                        self.onResize();
                    }
                })
            }else{
                // module.__enable__ = true;
                module.enable( next )
                module.setContext(context);

                this._currentModule = module;
                this.onResize();
            }

            next();
        },

        onResize : function(){
            if( this._currentModule && this._currentModule.mainComponent){
                this._currentModule.mainComponent.width( this.$el.width() );
                this._currentModule.mainComponent.height( this.$el.height() );
            }
            Base.prototype.onResize.call(this);

        }
    })

    Meta.provideBinding("region", Region);

    return Region;
})