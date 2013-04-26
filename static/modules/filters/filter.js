define(function(require){
    var qpf = require("qpf");
    var Widget = qpf.use("components/widget/widget");
    var ko = qpf.use("knockout");
    var filterHTML = require("text!./filter.html");
    var layers = require("../layers/index");

    var Filter = Widget.derive(function(){

        var viewModel = {
            title : ko.observable(""),
            preview: ko.observable(""),
            description : ko.observable(""),

            // filter name will be used in finding the fx file
            name : ko.observable(""),

            use : function(){
                layers.setFilter(this.name());
            }
        }

        viewModel._previewSrc = ko.computed(function(){
            if( viewModel.preview() ){
                return "fx/preview/" + viewModel.preview()
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