define(["require","qpf","text!./layer.html"],function(e){var t=e("qpf"),n=t.use("components/widget/widget"),r=t.use("knockout"),i=e("text!./layer.html"),s=n.derive(function(){return{title:r.observable(""),parameters:r.observableArray()}},{type:"Layer",css:"layer",template:i,afterResize:function(){_.each(this.$el.find(".qpf-parameter-component").qpf("get"),function(e){e.afterResize()}),n.prototype.afterResize.call(this)}});return s});