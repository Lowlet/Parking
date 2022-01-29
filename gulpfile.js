const gulp = require('gulp');
const uglify = require('gulp-uglify');
const babelify = require('babelify');
const browserify = require('browserify');
const source = require('vinyl-source-stream');
const buffer = require('vinyl-buffer');
const connect = require('gulp-connect');
const htmlmin = require('gulp-htmlmin');

gulp.task('copyStaticFiles', function ()
{
    return gulp.src('./src/mdl/*.*')
        .pipe(gulp.src('./src/img/*.*'))
        .pipe(gulp.dest('./dist/assets'));
});

gulp.task('html', function ()
{
    return gulp.src('src/**.html')
        .pipe(htmlmin({ collapseWhitespace: true }))
        .pipe(gulp.dest('dist'))
});

gulp.task('build', function ()
{
    return browserify({ debug: true })
        .add('./src/js/index.js')
        .transform(babelify, { global: true, presets: ["@babel/preset-env"], plugins: ['@babel/plugin-transform-runtime'] })
        .bundle()
        .pipe(source('bundle.js'))
        .pipe(buffer())
        //.pipe(uglify())
        .pipe(gulp.dest('./dist'));
});

gulp.task('startServer', function ()
{
    connect.server({
        root: './dist',
        livereload: true,
        port: 8000
    });
});

gulp.task('default', gulp.series('copyStaticFiles', 'html', 'build', 'startServer'));