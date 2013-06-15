// default list item component
define(function(require){

    var qpf = require("qpf");
    var Meta = qpf.use("meta/meta");
    var ko = require("knockout");
    var XMLParser = qpf.use("core/xmlparser");
    var _ = require("_");

    var NativeHtml = Meta.derive(function(){

        return {
            $el : $('<div data-bind="html:html"></div>'),
            html : ko.observable("ko")
        }
    }, {
        type : "NATIVEHTML",
        
        css : "native-html"
    })

    Meta.provideBinding("nativehtml", NativeHtml);

    XMLParser.provideParser("nativehtml", function(xmlNode){
        var children = XMLParser.util.getChildren(xmlNode);
        var html = "";
        _.each(children, function(child){
            // CDATA
            if(child.nodeType === 4){
                html += child.textContent;
            }
        });
        if( html ){
            return {
                html : html
            }
        }
    })

    return NativeHtml;
})