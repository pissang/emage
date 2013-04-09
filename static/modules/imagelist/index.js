define( function(require){

	var qpf = require("qpf"),
		ko = qpf.use("knockout"),
		Module = require("../module"),
		xml = require("text!./imagelist.xml"),

		List = require("../common/list"),
		ImageItem = require("./imageitem"),
		
		viewport = require("../viewport/index");

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

	imageList.$el.delegate(".qpf-ui-image-item", "click", function(){
		viewport.setImage( $(this).qpf('get')[0].url() );
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