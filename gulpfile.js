var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var fs = require('fs');
var es = require('event-stream');
var pug = require('pug');
var MarkdonwIt = require('markdown-it');
var mkdirp = require('mkdirp');
var pngquant = require('imagemin-pngquant');
var browserSync = require('browser-sync').create();

/**
 * Convert figure tag.
 *
 * @param {String} html
 * @return {String}
 */
function replaceFigureTag(html){
  return html.replace(/<p><img([^>]*)alt="(.*?)"([^>]*)><\/p>/mg, '<figure><img$1$3><figcaption>$2</figcaption></figure>');
}

// Sass tasks
gulp.task('sass', function () {
  return es.merge(
    gulp.src(['./src/scss/print.scss'])
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
      .pipe(gulp.dest('./html/css')),
    gulp.src(['./src/scss/epub.scss'])
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
      .pipe(gulp.dest('./epub/contents/css'))
  );
});

// ePub task
gulp.task('epub', function () {
  var compiler = pug.compileFile('src/templates/chapter.pug');
  var md = new MarkdonwIt();
  var dl = require('markdown-it-deflist');
  md = md.use(dl);
  mkdirp.sync('epub/contents/documents');
    // Compile contents
    fs.readdir('./manuscripts', function (err, files) {
      var tocs = [];
      var contents = [];
      // Compile all html.
      files.filter(function (file) {
        return /^\d{2}_(.*)\.md$/.test(file);
      }).map(function (file) {
        var id = file.replace('.md', '');
        // Create HTML
        var content = fs.readFileSync('manuscripts/' + file).toString();
        var title = content.match(/^# (.*)$/m);
        //content = content.replace('../images', './images');
        content = md.render(content);
        content = replaceFigureTag(content);
        var html = compiler({
          id     : id,
          content: content,
          title  : title[1]
        });
        tocs.push({
          id: id,
          title: title[1],
          href: id + '.html'
        });
        fs.writeFile('epub/contents/documents/' + id + '.html', html, function (err) {
          if (err) {
            throw err;
          }
          console.log(id + ' is generated.');
        });
      });
      return gulp.src('src/templates/00_toc.pug')
        .pipe($.pug({
          locals: {
            title: '目次',
            toc  : tocs
          },
          pretty: true
        }))
        .pipe(gulp.dest('epub/contents/documents'));
    });
    // Generate title page.
    gulp.src('src/templates/00_title.pug')
      .pipe($.pug({
        locals: {
          title: 'WordPressで始める  Google Cloud Platform  本格入門'
        },
        pretty: true
      }))
      .pipe(gulp.dest('epub/contents/documents'))
});

// Pug task
gulp.task('pug', function () {
  var compiler = pug.compileFile('src/templates/index.pug');
  var md = new MarkdonwIt();
  var dl = require('markdown-it-deflist');
  md = md.use(dl);
  mkdirp.sync('html/manuscripts');
  fs.readdir('./manuscripts', function (err, files) {
    var tocs = [];
    var contents = [];
    // Compile all html.
    files.filter(function (file) {
      return /^\d{2}_(.*)\.md$/.test(file);
    }).map(function (file) {
      var id = file.replace('.md', '');
      // Create HTML
      var content = fs.readFileSync('manuscripts/' + file).toString();
      var title = content.match(/^# (.*)$/m);
      content = content.replace('../images', './images');
      content = md.render(content);
      content = replaceFigureTag(content);
      contents.push({
        id  : id,
        html: content
      });

      tocs.push({
        title: title[1]
      });
      console.log(id + ' rendered.');
    });
    // Save html
    var html = compiler({
      toc     : tocs,
      contents: contents
    });
    fs.writeFile('html/index.html', html, function (err) {
      if (err) {
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
    .pipe(gulp.dest('./html/images'))
    .pipe(gulp.dest('./epub/contents/images'));
});

// watch print
gulp.task('sync:print', function () {
  browserSync.init({
    files : ["html/**/*"],
    server: {
      baseDir: "./html",
      index  : "index.html"
    },
    reloadDelay: 2000
  });
});

// watch epub
gulp.task('sync:epub', function () {
  browserSync.init({
    files : ["epub/contents/**/*"],
    server: {
      baseDir: "./epub/contents",
      index  : "documents/00_toc.html"
    },
    reloadDelay: 2000
  });
});

gulp.task('reload', function () {
  browserSync.reload();
});

// watch
gulp.task('watch', function () {
  // Make SASS
  gulp.watch(['src/scss/**/*.scss'], ['sass']);
  // HTML
  gulp.watch('manuscripts/**/*.md', ['pug', 'epub']);
  gulp.watch('src/templates/**/*.pug', ['pug', 'epub']);
  // Minify Image
  gulp.watch('images/**/*', ['imagemin']);
  // Sync browser sync.
  gulp.watch([ 'html/**/*', 'epub/documents/**/*' ], ['reload']);

});

gulp.task('server:print', ['sync:print', 'watch']);
gulp.task('server:epub', ['sync:epub', 'watch']);

gulp.task('build', ['pug', 'epub', 'sass', 'imagemin']);
