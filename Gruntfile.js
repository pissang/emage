module.exports = function(grunt){

    grunt.initConfig({
        concat : {
            script : {
            }
        },
        uglify : {
            build : {
                files : {
                    "dist/emage.min.js" : ['dist/emage.js']
                }
            }
        },
        copy : {
            build : {
                files : [{
                    src : "dist/emage.js",
                    dest : "example/static/lib/emage.js"
                }]
            },
            example : {
                files : [{
                    src : "example/static-dist/index-dist.html",
                    dest : "example/static-dist/index.html"
                }]
            }
        },
        less : {
            example : {
                files : {
                    "example/static-dist/style/app.css" : "example/static-dist/style/app.less",
                    "example/static-dist/style/qpf/base.css" : "example/static-dist/style/qpf/base.less"
                }
            }
        },
        concat : {
            example : {
                src : ["example/static/lib/require.js", "example/static/lib/director.js"],
                dest : "example/static-dist/lib.js"
            }
        },
        clean : {
            example : ["example/static-dist/lib", 
                    "example/static-dist/boot.js",
                    "example/static-dist/index-dist.html"]
        },
        requirejs : {
            build : {
                options : {
                    baseUrl : "./",
                    paths : {
                        "text" : "src/text",
                        "shaders" : "src/buildin/shaders",
                        "qtek" : "thirdparty/qtek.image"
                    },
                    name : "build/almond",
                    include : ["src/emage"],
                    exclude : ['text'],
                    optimize : "none",
                    wrap : {
                        'startFile' : 'build/wrap/start.js',
                        'endFile' : 'build/wrap/end.js'
                    },
                    out : "dist/emage.js",
                    onBuildWrite : function(moduleName, path, content){
                        // Remove the text plugin and convert to a normal module
                        // Or the text plugin will have some problem when optimize the project based on qtek which also has a text plugin
                        // https://groups.google.com/forum/?fromgroups#!msg/requirejs/jiaDogbA1EQ/jKrHL0gs21UJ
                        // http://stackoverflow.com/questions/10196977/how-can-i-prevent-the-require-js-optimizer-from-including-the-text-plugin-in-opt
                        content = content.replace(/define\([\'\"]text\!(.*?)[\'\"]/g, "define('$1'");
                        // in dependencies
                        content = content.replace(/define\((.*?)\[(.*?)\]/g, function(str, moduleId, dependencies){
                            dependencies = dependencies.split(",");
                            for(var i = 0; i < dependencies.length; i++){
                                if(dependencies[i]){
                                    dependencies[i] = dependencies[i].replace(/[\'\"]text\!(.*?)[\'\"]/, "'$1'");
                                }
                            }
                            return "define(" + moduleId + "[" + dependencies.join(",") + "]";
                        })
                        content = content.replace(/require\([\'\"]text\!(.*?)[\'\"]\)/g, "require('$1')");
                        return content;
                    }
                }
            },
            example : {
                options : {
                    appDir : 'example/static',
                    baseUrl : "./",
                    dir : 'example/static-dist',
                    paths : {
                        async   : "lib/async",
                        qpf     : "lib/qpf",
                        emage  : "lib/emage",
                        knockout : "lib/knockout",
                        "$" : "lib/jquery",
                        "_" : "lib/underscore"
                    },
                    shim : {
                        '$' : {
                            exports : "$"
                        },
                        '_' : {
                            exports : "_"
                        },
                        "app" : ["modules/filters/index",
                                "modules/navigator/index",
                                "modules/viewport/index"]
                    },
                    // optimize : "none",
                    waitSeconds : 30,
                    modules : [{
                        name : "app"
                    }]
                }
            }
        }
    })

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-requirejs');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask("default", ["requirejs:build", "uglify:build", "copy:build"]);
    grunt.registerTask("example", ["requirejs:build", 
                                    "uglify:build", 
                                    "copy:build", 
                                    "requirejs:example",
                                    "concat:example",
                                    "copy:example",
                                    "less:example",
                                    "clean:example"]);
}