define( function(require){

    var qpf = require("qpf");
    var ko = qpf.use("knockout");
    var Module = require("../module");
    var xml = require("text!./imagelist.xml");

    var List = require("../common/list");
    var ImageItem = require("./imageitem");
    
    var viewport = require("../viewport/index");

    var imageList = new Module({
        name : "imagelist",
        xml : xml,

        images : ko.observableArray(),
        ImageItem : ImageItem
    })
    var listData,
        page = 0,
        pageLength = 5,
        maxPage;
    $.get("../file_upload/list.json", function(data){
        listData = data;
        maxPage = Math.floor(listData.length / pageLength-0.00001);
        imageList.images( listData.slice(0, pageLength) );
    })

    var img;
    imageList.$el.delegate(".qpf-ui-image-item", "click", function(){
        var thumb = $(this).find("img")[0];
        viewport.setImage( thumb );
        
        img = new Image;
        img.onload = function(){
            viewport.setImage( img );
        }
        img.src = $(this).qpf('get')[0].url();
    })
    .delegate('.button-left', 'click', prevPage)
    .delegate('.button-right', 'click', nextPage);

    function prevPage(){
        page = Math.max(0, page-1);
        imageList.images( listData.slice( page*pageLength, Math.min(listData.length, (page+1)*pageLength) ) );
    }

    function nextPage(){
        page = Math.min( page+1, maxPage);
        imageList.images( listData.slice( page*pageLength, Math.min(listData.length, (page+1)*pageLength) ) );
    }

    return imageList
} )