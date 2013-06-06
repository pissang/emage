//=============================================
// Constructor of module
// module can be inited from xml,
// and it will only get the first component as a 
// container, 
//=============================================
define(function(require){

    var qpf = require("qpf");
    var Base = qpf.use("components/base");
    var ko = require("knockout");
    var XMLParser = qpf.use("core/xmlparser");
    var Derive = qpf.use("core/mixin/derive");
    var Event = qpf.use("core/mixin/event");

    var clazz = new Function();
    _.extend(clazz, Derive);
    _.extend(clazz.prototype, Event);

    var Module = clazz.derive(function(){
        return {
            name : "",
            $el : $("<div style='position:relative'></div>"),
            xml : "",
            context : {},

            mainComponent : null
        }
    }, {
        start : function( ){
            if( this.xml ){
                this.applyXML(this.xml);
            };

            this.trigger("start");
            return this.$el;
        },

        enable : function(next){
            this.$el.show();

            this.trigger("enable")

            next && next();
        },

        disable : function(next){
            this.$el.hide();

            this.trigger("disable")
            next && next();
        },

        setContext : function(context){
            // save default context
            if( ! this._defaultContext){
                this._defaultContext = {};
                _.each(this.context, function(value, name){
                    this._defaultContext[name] = value();
                }, this)
            }
            for(var name in this.context){
                if( typeof(context[name]) !== "undefined" ){
                    this.context[name]( context[name] );
                }else{
                    this.context[name]( this._defaultContext[name] );
                }
            }
            Base.prototype._mappingAttributes.call(this.context, context, true);
        },

        dispose : function(){
            Base.disposeByDom(this.$el[0]);
            this.$el.remove();
        },

        loadingStart : function(){
            if( this._$mask){
                this._$mask.addClass("loading").show();
            }
        },

        loadingEnd : function(){
            if(this._$mask){
                this._$mask.removeClass("loading").hide();
            }
        },

        applyXML : function(xml){
            XMLParser.parse(xml, this.$el[0] );
            ko.applyBindings(this, this.$el[0]);

            var firstChild = this.$el[0].firstChild;
            if( firstChild ){
                this.mainComponent = Base.getByDom(firstChild);
            }
        }
    })
    return Module;
})