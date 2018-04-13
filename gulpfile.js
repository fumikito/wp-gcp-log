var gulp        = require('gulp');
var $           = require('gulp-load-plugins')();
var fs          = require('fs');
var es          = require('event-stream');
var pug         = require('pug');
var MarkdonwIt  = require('markdown-it');
var mkdirp      = require('mkdirp');
var pngquant    = require('imagemin-pngquant');
var browserSync = require('browser-sync').create();

// Sass tasks
gulp.task('sass', function () {
  return gulp.src(['./src/scss/**/*.scss'])
    .pipe($.plumber({
      errorHandler: $.notify.onError('<%= error.message %>')
    }))
    .pipe($.sass({
      errLogToConsole: true,
      outputStyle    : 'compressed',
      includePaths   : [
        './src/sass'
      ]
    }))
    .pipe($.autoprefixer({browsers: ['last 2 version', '> 5%']}))
    .pipe(gulp.dest('./html/css'));
});

// Pug task
gulp.task('pug', function(){
	var compiler = pug.compileFile('src/templates/template.pug');
	var md = new MarkdonwIt();
	mkdirp.sync('html/manuscripts');
	fs.readdir('./manuscripts', function(err, files){
		var tocs = [];
		// Compile all html.
		files.filter(function(file){
			return /^\d{2}_(.*)\.md$/.test(file);
		}).map(function(file){
			var dest = file.replace('.md', '.html');
			var content = fs.readFileSync('manuscripts/' + file).toString();
			var title   = content.match(/^# (.*)$/m);
			var html = compiler({
				title: title[1],
				content: md.render(content)
			});
			tocs.push({
				title: title[1],
				href: dest
			})
			fs.writeFile('html/manuscripts/' + dest, html, function(err){
				if(err){
					throw err;
				}
				console.log(file + " is saved.");
			});
		});
		// Save toc.
		var tocCompiler = pug.compileFile('src/templates/toc.pug');
		var tocHtml  = tocCompiler({
			toc: tocs
		});
		fs.writeFile('html/manuscripts/00_toc.html', tocHtml, function(err){
			if(err){
				throw err;
			}
			console.log("TOC is generated.");
		});
	});
});

// Imagemin
gulp.task('imagemin', function () {
  return gulp.src('images/**/*')
    .pipe($.imagemin({
      progressive: true,
      svgoPlugins: [{removeViewBox: false}],
      use        : [pngquant()]
    }))
    .pipe(gulp.dest('./html/images'));
});

// watch
gulp.task('sync', function(){
	 browserSync.init({
        files: ["html/**/*"],
        server: {
            baseDir: "./html"
        }
    });
});

gulp.task('reload', function(){
	browserSync.reload();
    done();
});

// watch
gulp.task('watch', function () {
  // Make SASS
  gulp.watch(['src/scss/**/*.scss'], ['sass']);
  // JS
  gulp.watch('manuscripts/**/*.md', ['pug']);
  // Minify Image
  gulp.watch('images/**/*', ['imagemin']);
  // Sync browser sync.
  gulp.watch('html/**/*', ['reload']);
});

gulp.task('server', ['sync', 'watch']);

gulp.task('build', ['html', 'sass', 'imagemin']);
