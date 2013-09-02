
requirejs.config({
    'baseUrl' : "./",
    'paths' : {
        "qtek" : "../thirdparty/qtek.image",
        "text" : "../src/text",
        "shaders" : "../src/buildin/shaders"
    }
})

require(["../src/processor",
        "../src/layer"], function(Processor, Layer){

    var img = new Image();
    var processor = new Processor();
    processor.image = img;
    document.body.appendChild(processor.canvas);
    processor.canvas.style.width = 1000 + "px";
    var layer = new Layer("buildin.boxblur");
    processor.add(layer);
    // layer2.set("gamma", 2.0)

    img.onload = function(){
        processor.update();
    }
    img.src = "../example/file_upload/1.jpg";
})