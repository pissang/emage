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
            }
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

            }
        }
    })

    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-contrib-requirejs');

    grunt.registerTask("default", ["requirejs:build", "uglify:build", "copy:build"]);
}