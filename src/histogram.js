define(function(require){

    var qtek = require("qtek");
    var qtek3d = qtek["3d"];
    var Shader = qtek3d.Shader;

    var texParams = {
        height : 1,
        width : 256,
        minFilter : "NEAREST",
        magFilter : 'NEAREST',
        generateMipmaps : false
    }

    var canvas = document.createElement("canvas");
    var ctx = canvas.getContext("2d");

    Shader.import(require("text!shaders/histogram.essl"));

    var Histogram = function(image){

        this.downSample = 1/2;
        this.image = image;

        this.canvas = document.createElement("canvas");

        this.renderer = new qtek3d.Renderer({
            canvas : this.canvas
        });
        var _gl = this.renderer.gl;
        _gl.enableVertexAttribArray(0);

        this._framBuffer = new qtek3d.FrameBuffer();
        this._textureRed = new qtek3d.texture.Texture2D(texParams);
        this._textureBlue = new qtek3d.texture.Texture2D(texParams);
        this._textureGreen = new qtek3d.texture.Texture2D(texParams);
        this._textureLuminance = new qtek3d.texture.Texture2D(texParams);

        this._shaderRed = new qtek3d.Shader({
            vertex : Shader.source("emage.histogram_r.vertex"),
            fragment : Shader.source("emage.histogram.fragment")
        });
        this._shaderGreen = new qtek3d.Shader({
            vertex : Shader.source("emage.histogram_g.vertex"),
            fragment : Shader.source("emage.histogram.fragment")
        });
        this._shaderBlue = new qtek3d.Shader({
            vertex : Shader.source("emage.histogram_b.vertex"),
            fragment : Shader.source("emage.histogram.fragment")
        });
        this._shaderLuminance = new qtek3d.Shader({
            vertex : Shader.source("emage.histogram_l.vertex"),
            fragment : Shader.source("emage.histogram.fragment")
        });

        this._buffer = _gl.createBuffer();

        this._imageChanged = true;
    }

    Histogram.prototype.update = function(){

        var _gl = this.renderer.gl;

        var image = this.image;
        canvas.width = image.width * this.downSample;
        canvas.height = image.height * this.downSample;

        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        var imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);

        _gl.bindBuffer(_gl.ARRAY_BUFFER, this._buffer);
        _gl.bufferData(_gl.ARRAY_BUFFER, imgData.data, _gl.STATIC_DRAW);
        _gl.vertexAttribPointer(0, canvas.width * canvas.height, _gl.UNSIGNED_BYTE, false, 0, 0);

        // this._framBuffer.attach(this._textureRed);
        
    }

})