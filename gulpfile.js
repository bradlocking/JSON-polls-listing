// Include gulp
var gulp = require('gulp');

// Include other required plugins
var sass 		= require('gulp-sass'),
	sourcemaps  = require('gulp-sourcemaps');
    webserver   = require('gulp-webserver');


// Local webserver setup with livereload.
gulp.task('webserver', function() {
    gulp.src('./')
    .pipe(webserver({
        livereload: true,
        open: true,
        port: 9000,
        host: '0.0.0.0'
    }));
});


// sass compiler for general main.css
gulp.task('sass', function () {
  return gulp.src([
  		'src/sass/main.scss',
    ])
	.pipe(sourcemaps.init())
        .pipe(sass({
            outputStyle: 'expanded',
        }))
    .on('error', sass.logError)
	.pipe(sourcemaps.write())
    .pipe(gulp.dest('./src/css'))
 });


// Watch Files For Changes and run
gulp.task('watch', function() {
    gulp.watch('src/sass/**/*.scss', ['sass']);
});


// Run webserver and watch tasks together
gulp.task('run', ['webserver', 'watch']);