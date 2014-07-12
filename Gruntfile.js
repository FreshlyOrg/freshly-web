module.exports = function(grunt) {

  // Project configuration.
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    watch: {
      build: {
        files: [
          'public/app/**/*',
          'public/styles/*'
        ],
        tasks: ['build']
      }
    },
    uglify: {
      build: {
        options: {
          mangle: false
        },
        files: {
          'public/dist/app.min.js': [
            'public/app/factories/factories.js',
            'public/app/activities/activities.js',
            'public/app/app.js',
          ]
        }
      }
    },
    less: {
      build: {
        files: {
          'public/dist/style.css': [
            'public/styles/style.less'
          ]
        }
      }
    }
  });

  // Load the plugin that provides the "uglify" task.
  grunt.loadNpmTasks('grunt-contrib-uglify');
  grunt.loadNpmTasks('grunt-contrib-less');
  grunt.loadNpmTasks('grunt-contrib-watch');

  grunt.registerTask('build', [
    'uglify',
    'less'
  ])

  // Default task(s).
  grunt.registerTask('default', [
  ]);

};