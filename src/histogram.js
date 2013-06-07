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

        this.downSample = 1/8;
        this.image = image;

        this.canvas = document.createElement("canvas");

        this.renderer = new qtek3d.Renderer({
            canvas : this.canvas,
            // http://stackoverflow.com/questions/7156971/webgl-readpixels-is-always-returning-0-0-0-0
            preserveDrawingBuffer : true
        });

        this.channels = {
            red : new Uint8Array(256*4),
            green : new Uint8Array(256*4),
            blue : new Uint8Array(256*4),
            luminance : new Uint8Array(256*4)
        }

        var _gl = this.renderer.gl;
        _gl.enableVertexAttribArray(0);

        this._framBuffer = new qtek3d.FrameBuffer({
            depthBuffer : false
        });
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
        _gl.vertexAttribPointer(0, 4, _gl.UNSIGNED_BYTE, false, 0, 0);

        // this._framBuffer.attach(this._textureRed);

        _gl.clearColor(0.0, 0.0, 0.0, 0.0);
        _gl.clear(_gl.COLOR_BUFFER_BIT | _gl.DEPTH_BUFFER_BIT);
        _gl.blendEquation(_gl.FUNC_ADD);
        _gl.blendFunc(_gl.ONE, _gl.ONE);
        _gl.enable(_gl.BLEND);
        _gl.disable(_gl.DEPTH_TEST);

        var width = imgData.width,
            height = imgData.height,
            size = width * height;
        // Red Channel
        this._shaderRed.bind(_gl);
        this._framBuffer.attach(_gl, this._textureRed)
        this._framBuffer.bind(this.renderer);
        _gl.drawArrays( _gl.POINT, 0, size );
        // Read back
        _gl.readPixels(0, 0, 256, 1, _gl.RGBA, _gl.UNSIGNED_BYTE, this.channels.red);
        // Green Channel
        this._shaderGreen.bind(_gl);
        this._framBuffer.attach(_gl, this._textureGreen)
        this._framBuffer.bind(this.renderer);
        _gl.drawArrays( _gl.POINT, 0, size );
        _gl.readPixels(0, 0, 256, 1, _gl.RGBA, _gl.UNSIGNED_BYTE, this.channels.green);
        // Blue channel
        this._shaderBlue.bind(_gl);
        this._framBuffer.attach(_gl, this._textureBlue);
        this._framBuffer.bind(this.renderer);
        _gl.drawArrays( _gl.POINT, 0, size );
        _gl.readPixels(0, 0, 256, 1, _gl.RGBA, _gl.UNSIGNED_BYTE, this.channels.blue);
        // Luminance Channel
        this._shaderLuminance.bind(_gl);
        this._framBuffer.attach(_gl, this._textureLuminance);
        this._framBuffer.bind(this.renderer);
        _gl.drawArrays( _gl.POINT, 0, size );
        _gl.readPixels(0, 0, 256, 1, _gl.RGBA, _gl.UNSIGNED_BYTE, this.channels.luminance);

        _gl.disable(_gl.BLEND);
        _gl.enable(_gl.DEPTH_TEST);

        document.body.appendChild(this.canvas);
    }

    Histogram.prototype.draw = function(){

    }

    Histogram.prototype.get = function(){

    }

    return Histogram;
})