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
	var compiler = pug.compileFile('src/templates/index.pug');
	var md = new MarkdonwIt();
	var dl = require('markdown-it-deflist');
	md = md.use(dl);
	mkdirp.sync('html/manuscripts');
	fs.readdir('./manuscripts', function(err, files){
		var tocs = [];
		var contents = [];
		// Compile all html.
		files.filter(function(file){
			return /^\d{2}_(.*)\.md$/.test(file);
		}).map(function(file){
			var id = file.replace('.md', '');
			// Create HTML
			var content = fs.readFileSync('manuscripts/' + file).toString();
			var title   = content.match(/^# (.*)$/m);
			content = content.replace('../images', './images');
			content = md.render(content);
			content = content.replace(/<p><img([^>]*)alt="(.*?)"([^>]*)><\/p>/mg, '<figure><img$1$3><figcaption>$2</figcaption></figure>');
			contents.push({
				id: id,
				html: content
			});
			
			tocs.push({
				title: title[1]
			});
			console.log(id + ' rendered.');
		});
		// Save html
		var html  = compiler({
			toc: tocs,
			contents: contents
		});
		fs.writeFile('html/index.html', html, function(err){
			if(err){
				throw err;
			}
			console.log("HTML is generated.");
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
            baseDir: "./html",
            index: "index.html"
        }
    });
});

gulp.task('reload', function(){
	browserSync.reload();
});

// watch
gulp.task('watch', function () {
  // Make SASS
  gulp.watch(['src/scss/**/*.scss'], ['sass']);
  // HTML
  gulp.watch('manuscripts/**/*.md', ['pug']);
  gulp.watch('src/templates/**/*.pug', ['pug']);
  // Minify Image
  gulp.watch('images/**/*', ['imagemin']);
  // Sync browser sync.
  gulp.watch('html/**/*', ['reload']);
});

gulp.task('server', ['sync', 'watch']);

gulp.task('build', ['html', 'sass', 'imagemin']);
