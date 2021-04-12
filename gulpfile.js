const gulp = require('gulp');//gulp本体
const del = require('del');

//ejs
const rename = require('gulp-rename'); //名前変更
const ejs = require('gulp-ejs'); //ejsコンパイル
const replace = require("gulp-replace"); 

//scss
const sass = require('gulp-dart-sass');//Dart Sass はSass公式が推奨 @use構文などが使える
const plumber = require("gulp-plumber"); // エラーが発生しても強制終了させない
const notify = require("gulp-notify"); // エラー発生時のアラート出力
const browserSync = require("browser-sync"); //ブラウザリロード
const autoprefixer = require('gulp-autoprefixer');//ベンダープレフィックス自動付与
const postcss = require("gulp-postcss");//css-mqpackerを使うために必要
const mqpacker = require('css-mqpacker');//メディアクエリをまとめる


//画像圧縮
const imagemin = require("gulp-imagemin");
const imageminMozjpeg = require("imagemin-mozjpeg");
const imageminPngquant = require("imagemin-pngquant");
const imageminSvgo = require("imagemin-svgo");


// 入出力するフォルダを指定
const srcBase = './_static/src';
const distBase = './_static/dist';


const srcPath = {
  'html': srcBase + ["/ejs/**/*.ejs", "!" + "/ejs/**/_*.ejs"],
  'scss': srcBase + '/scss/**/*.scss',
  'img': srcBase + '/img/**/*'
};

const distPath = {
  'css': distBase + '/css/',
  'html': distBase + '/',
  'img': distBase + '/img/'
};

/**
 * clean
 */
const clean = () => {
  return del(distBase + '/**');
}

//ベンダープレフィックスを付与する条件
const TARGET_BROWSERS = [
  'last 2 versions',//各ブラウザの2世代前までのバージョンを担保
  'ie >= 11'//IE11を担保
];

/**
 * ejs
 *
 */

const htmlEjs = () => {
  return gulp.src(srcPath.html)
    .pipe(
      //エラーが出ても処理を止めない
      plumber({
        errorHandler: notify.onError('Error:<%= error.message %>')
      }))
      .pipe(ejs({}, {}, { ext: ".html" })) //ejsを纏める
      .pipe(rename({ extname: ".html" })) //拡張子をhtmlに
      .pipe(replace(/[\s\S]*?(<!DOCTYPE)/, "$1"))
    .pipe(gulp.dest(distPath.html))
};

console.log(srcPath.html);

/**
 * sass
 *
 */

const cssSass = () => {
  return gulp.src(srcPath.scss, {
    sourcemaps: true
  })
    .pipe(
      //エラーが出ても処理を止めない
      plumber({
        errorHandler: notify.onError('Error:<%= error.message %>')
      }))
    .pipe(sass({
      outputStyle: 'expanded'
    })) //指定できるキー expanded compressed
    .pipe(autoprefixer(TARGET_BROWSERS))// ベンダープレフィックス自動付与
    .pipe(postcss([mqpacker()])) // メディアクエリをまとめる
    .pipe(gulp.dest(distPath.css, {
      sourcemaps: './'
    })) //コンパイル先
    .pipe(browserSync.stream())
    .pipe(notify({
      message: 'Sassをコンパイルしました！',
      onLast: true
    }))
}

/**
 * 画像圧縮
 */
const imgImagemin = () => {
  return gulp.src(srcPath.img)
    .pipe(
      imagemin(
        [
          imageminMozjpeg({
            quality: 80
          }),
          imageminPngquant(),
          imageminSvgo({
            plugins: [{
              removeViewbox: false
            }]
          })
        ], {
        verbose: true
      }
      )
    )
    .pipe(gulp.dest(distPath.img))
}

/**
 * ローカルサーバー立ち上げ
 */
const browserSyncFunc = () => {
  browserSync.init(browserSyncOption);
}

const browserSyncOption = {
  server: "./_static/dist/"
}

/**
 * リロード
 */
const browserSyncReload = (done) => {
  browserSync.reload();
  done();
}

/**
 *
 * ファイル監視 ファイルの変更を検知したら、browserSyncReloadでreloadメソッドを呼び出す
 * series 順番に実行
 * watch('監視するファイル',処理)
 */
const watchFiles = () => {
  gulp.watch(srcPath.html, gulp.series(htmlEjs, browserSyncReload))
  gulp.watch(srcPath.scss, gulp.series(cssSass))
  gulp.watch(srcPath.img, gulp.series(imgImagemin, browserSyncReload))
}

/**
 * seriesは「順番」に実行
 * parallelは並列で実行
 * 
 * 一度cleanでdistフォルダ内を削除し、最新のものをdistする
 */
exports.default = gulp.series(
  clean,
  gulp.parallel(htmlEjs, cssSass, imgImagemin),
  gulp.parallel(watchFiles, browserSyncFunc)
);