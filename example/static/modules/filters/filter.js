define(function(require){
    var qpf = require("qpf");
    var Widget = qpf.use("widget/widget");
    var ko = require("knockout");
    var filterHTML = require("text!./filter.html");
    var viewport = require("../viewport/index");

    var Filter = Widget.derive(function(){

        var viewModel = {
            title : ko.observable(""),
            preview: ko.observable(""),
            description : ko.observable(""),

            // filter name will be used in finding the fx
            name : ko.observable(""),
            // parameters will be set in the filterLayer
            parameters : ko.observable({}),

            use : function(){
                viewport.filterLayer.use(this.name());
                var parameters = this.parameters();

                var deferredUpdate = false;
                if(parameters){
                    viewport.filterLayer.set(parameters);

                    var isLoading = 0;
                    for(var name in parameters){
                        if(parameters[name] instanceof Image){
                            var img = parameters[name];
                            if( ! img.complete){
                                deferredUpdate = true;
                                isLoading++;
                                img.onload = function(){
                                    isLoading--;
                                    if(isLoading == 0){
                                        viewport.update();
                                    }
                                }
                            }
                        }
                    }
                }
                if( ! deferredUpdate){
                    viewport.update();
                }
            }
        }

        viewModel._previewSrc = ko.computed(function(){
            if( viewModel.preview() ){
                return viewModel.preview()
            }
        })
        return viewModel;
    }, {

        type : "FILTER",
        css : "filter",

        template : filterHTML
    });

    return Filter;
})