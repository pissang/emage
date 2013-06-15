define(function(require){

    var qpf = require("qpf");
    var Clazz = qpf.use("core/clazz");
    var Window = qpf.use("container/window");
    var Container = qpf.use("container/container");
    var Inline = qpf.use("container/inline");
    var Button = qpf.use("meta/button");
    var ko = require("knockout");

    var wind = new Window({
            attributes : {
                class : "qpf-modal"
            }
        }),
        body = new Container,
        buttons = new Inline,
        applyButton = new Button({
            attributes : {
                text : "确 定"
            }
        }),
        cancelButton = new Button({
            attributes : {
                text : "取 消"
            }
        });
    wind.add(body);
    wind.add(buttons);
    buttons.add(applyButton);
    buttons.add(cancelButton);

    wind.render();
    document.body.appendChild(wind.$el[0]);
    var $mask = $('<div class="qpf-mask"></div>');
    document.body.appendChild($mask[0]);

    wind.$el.hide();
    $mask.hide();
    var Modal = Clazz.derive(function(){
        return {
            title : "",

            body : null,
            onApply : function(next){next()},
            onCancel : function(next){next()}
        }
    }, {
        show : function(){
            var self = this;
            wind.title( this.title);
            
            body.removeAll();
            this.body &&
                body.add(this.body);

            applyButton.off("click");
            cancelButton.off("click");
            applyButton.on("click", function(){
                self.onApply( self.hide )
            });
            cancelButton.on("click", function(){
                self.onCancel( self.hide );
            });

            wind.$el.show();
            $mask.show();

            wind.left( ( $(window).width() - wind.$el.width() )/2 )
            wind.top( ( $(window).height() - wind.$el.height() )/2-100 )
        },
        hide : function(){
            wind.$el.hide();
            $mask.hide();
        }
    })

    Modal.popup = function(title, body, onApply, onCancel){
        var modal = new Modal({
            title : title,
            body : body,
            onApply : onApply || function(next){next()},
            onCancel : onCancel || function(next){next()}
        });
        modal.body.render();
        modal.show();
    }

    Modal.confirm = function(title, text, onApply, onCancel){
        var modal = new Modal({
            title : title,
            //TODO: Implement a componennt like <p> ?
            body : new Label({
                attributes : {
                    text : text
                },
                temporary : true
            }),
            onApply : onApply || function(next){next()},
            onCancel : onCancel || function(next){next()}
        });
        modal.body.render();
        modal.show();
    }

    return Modal;
})