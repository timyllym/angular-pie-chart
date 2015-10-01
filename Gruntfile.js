'use strict';

module.exports = function (grunt) {

    // Load grunt tasks automatically
    require('load-grunt-tasks')(grunt);

    // Define the configuration for all the tasks
    grunt.initConfig({

        // Empties folders to start fresh
        clean: {
            dist: {
                files: [
                    {
                        dot: true,
                        src: [
                            'dist/*.*'
                        ]
                    }
                ]
            },
            server: '.tmp'
        },

        // The following *-min tasks produce minified files in the dist folder
        imagemin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/images',
                        src: '{,*/}*.{png,jpg,jpeg,gif}',
                        dest: 'dist/images'
                    }
                ]
            }
        },
        svgmin: {
            dist: {
                files: [
                    {
                        expand: true,
                        cwd: 'src/images',
                        src: '{,*/}*.svg',
                        dest: 'dist/images'
                    }
                ]
            }
        },

        // Copies remaining files to places other tasks can use
        copy: {
            dist: {
                files: [
                    {
                        expand: true,
                        dot: true,
                        cwd: 'src',
                        dest: 'dist',
                        src: [
                            '*.{ico,png,txt}',
                            '.htaccess',
                            'images/{,*/}*.{webp}',
                            'fonts/*'
                        ]
                    },
                    {
                        expand: true,
                        cwd: 'src',
                        src: ['*.js'],
                        dest: 'dist'
                    },
                    {
                        expand: true,
                        cwd: 'src/images',
                        src: ['**'],
                        dest: 'dist/images'
                    }
                ]
            },
            nomin_to_min: {
                files: [
                        {
                            expand: true,
                            cwd: 'src',
                            src: ['*.js'],
                            dest: 'dist',
                            rename: function(dest, src) {
                                if (src.indexOf('.min.js', this.length - '.min.js'.length) !== -1) {
                                    // Copying as is.
                                    return dest + "/" + src;
                                } else {
                                    // Copying as minified, because this file wasn't minified.
                                    return dest + "/" + src.substring(0, src.indexOf('.js')) + '.min.js';
                                }
                            }
                        }
                    ]
            }
        },

        // Run some tasks in parallel to speed up the build process
        concurrent: {
            lintandcompile: [
                'ts',
                'tslint',
                'jsonlint',
                'imagemin',
                'jade',
                'less',
                'svgmin'
            ],
            uglifyandprefix: [
                'uglify'
            ]
        },
        uglify: {
            options: {
                mangle: {
                    except: ['jQuery', 'Angular']
                },
                sourceMap: true,
                // Point to the .ts -> .js source map
                sourceMapIn: function (source) {
                    return source + '.map';
                }
            },
            dist: {
                files: [
                    {
                        expand: true, // Dynamic expansion
                        src: [ 'src/*.js'],
                        dest: '',
                        ext: '.min.js'
                    }
                ]
            }
        },
        concat: { // Placeholder for concatenated files
            dist: {}
        },

        // Compile TypeScript
        ts: {
            frontend: {
                src: [
                      'src/*.ts',
                      '!src/*.d.ts',
                      'typedefinitions/**/*.d.ts'
                ],
                options: {
                    target: 'es6',
                    sourcemap: true,
                    declaration: true, // Generates .d.ts file
                    removeComments: false, // Do not remove comments to enable JSDoc documentation
                    suppressImplicitAnyIndexErrors: true,
                    // warn on an implied :any type
                    noImplicitAny: true
                }
            }
        },

        // TSLint static testing
        tslint: {
            options: {
                configuration: grunt.file.readJSON("tslint.json")
            },
            files: {
                src: ['src/*.ts',
                      '!src/*.d.ts']
            }
        },
        jsonlint: {
            frontend: {
                src: ['*.json', 'src/*.json']
            }
        },
        jade: {
            html: {
                cwd: 'src',
                src: ['*.jade'],
                dest: 'dist/',
                ext: '.html',
                expand: true,
                options: {
                    client: false,
                    data: {
                        headTemplateFiles: [],
                        tabs: []
                    }
                }
            }
        },
        less: {
            development: {
                files: {
                    'dist/angular-pie-chart.css': 'src/angular-pie-chart.less'
                }
            }
        }
    });

    grunt.registerTask('build', [
        'clean:dist',
        'concurrent:lintandcompile',
        'copy:dist'
    ]);

};
