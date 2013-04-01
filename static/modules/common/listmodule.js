define(function(require){

	var qpf = require("qpf"),
		Module = require("../module"),
		List = require("./list.js"),
		xml = require("text!./listmodule.xml"),
		ko = qpf.use("knockout"),
		TextField = qpf.use("components/meta/textfield"),
		Modal = require("../common/modal");

	var ListModule = Module.derive(function(){
		
		var self = this;

		return {
			
			xml : xml,

			addItemUrl : function(){},
			fetchListUrl : function(){},
			fetchDetailUrl : function(){},

			makeItemHref : function(item){},
			icon : "",
			isSelected : function(item){},

			add : function(){
				var textField = new TextField({
					attributes : {
						width : 300,
					},
					temporary : true
				});
				Modal.popup("新建", textField, function(next){
					$.post( self.addItemUrl(), {
						title : textField.text()
					}, function( data ){
						self.list.push( self._preProcessData(data) );
						next();
					});
				}, function(next){
					next();
				})
			},

			//--------------view models
			list : ko.observableArray(),
			id : ko.observable(""),
			title : ko.observable("")
		}
	}, {
		initialize : function(){
			
			var self = this;

			ko.computed(function(){
				
				this.loadingStart();
				this.list([]);
				this.title(".....");

				var listUrl = self.fetchListUrl(),
					detailUrl = self.fetchDetailUrl();

				if( listUrl && detailUrl ){
					$.get(listUrl, function(data){
						self.loadingEnd();
						self.list( self._preProcessData(data) );
					})
					$.get(detailUrl, function(data){
						self.title(data.title);
					})
				}
			}, this);
		},
		_preProcessData : function(data){
			var self = this;
			if( data.constructor === Array ){
				var res = [];
				_.each(data, function(item, idx){
					res.push( self._preProcessData( item ) );					
				}, this)
				return res;
			}else{
				data.href = self.makeItemHref( data );
				data.icon = self.icon;
				if( self.isSelected(data) ){
					data.selected = true;
				}	
				return data;
			}
		}
	});

	return ListModule;
})