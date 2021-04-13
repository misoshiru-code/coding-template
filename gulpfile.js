const gulp = require("gulp");//本体
const del = require('del');//削除

const plumber = require("gulp-plumber");//エラーで強制終了の無効
//ejs
const rename = require("gulp-rename");//名前変更
const ejs = require("gulp-ejs");//ejsコンパイル
const replace = require("gulp-replace");//不要スペースの削除
//sass
const sass = require('gulp-sass');//sassコンパイル
const browserSync = require('browser-sync');//ブラウザリロード
const autoprefixer = require('gulp-autoprefixer');//ベンダープレフィックス自動付与
const postcss = require("gulp-postcss");//css-mqpackerを使うために必要
const mqpacker = require('css-mqpacker');//メディアクエリをまとめる
//画像圧縮
const imagemin = require('gulp-imagemin');
const mozjpeg = require('imagemin-mozjpeg');
const pngquant = require('imagemin-pngquant');


// ファイルパス：コンパイル前
const srcJsonFiles = './src/json/**/*.json';
const srcDataJson = './src/json/data.json';
const srcEjsFiles = './src/ejs/**/*.ejs';
const srcEjsPartial = '!./src/ejs/**/_*.ejs';
const srcScssFiles = './src/scss/**/*.scss';
const srcTsFiles = './src/ts/**/*.ts';
const srcImgFiles = './src/img/**/*'
const srcImgFileType = '{jpg,jpeg,png,gif,svg}';

// ファイルパス：コンパイル後
const destDir = './dest/';
const destHtmlFiles = './dest/*.html';
const destIndexHtml = 'index.html';
const destCssDir = './dest/css';
const destCssFiles = './dest/css/*.css';
const destJsDir = './dest/js';
const destJSFiles = './dest/js/*.js';
const destImgDir = './dest/img';
const destImgFiles = './dest/img/*';
const destFiles = './dest/**/*';


// EJSコンパイル
const compileEjs = (done) => {
    gulp.src([srcEjsFiles, srcEjsPartial])
        .pipe(plumber())
        .pipe(ejs())
        .pipe(ejs({}, {}, { ext: '.html' }))
        .pipe(rename({ extname: '.html' }))
        .pipe(replace(/^[ \t]*\n/gmi, ''))
        .pipe(gulp.dest(destDir));
    done();
};

// sassコンパイル
const compileSass = (done) => {
    gulp.src(srcScssFiles)
        .pipe(sass({outputStyle: 'expanded'}))//圧縮せずにcss出力
        .pipe(autoprefixer(TARGET_BROWSERS))// ベンダープレフィックス自動付与
        .pipe(postcss([mqpacker()])) // メディアクエリをまとめる
        .on('error', sass.logError)
        .pipe(gulp.dest(destCssDir));
    done();
};

//ベンダープレフィックスを付与する条件
const TARGET_BROWSERS = [
    'last 2 versions',//各ブラウザの2世代前までのバージョンを担保
    'ie >= 11'//IE11を担保
];

// リロードするhtml
const reloadFile = (done) => {
    browserSync.init({
        server: {
            baseDir: destDir,
            index: destIndexHtml,
        },
    });
    done();
};

// リロード設定
const reloadBrowser = (done) => {
    browserSync.reload();
    done();
};

// 画像圧縮
const minifyImage = (done) => {
    gulp.src(srcImgFiles + srcImgFileType)
        .pipe(imagemin(
            [
                pngquant({ quality: '65-80', speed: 1 }),
                mozjpeg({ quality: 80 }),
                imagemin.svgo(),
                imagemin.gifsicle()
            ]
        ))
        .pipe(gulp.dest(destImgDir));
    done();
};

// destフォルダのファイル削除
const clean = (done) => {
    del([destFiles, '!' + destCssDir, '!' + destJsDir, '!' + destImgDir]);
    done();
};

// HTMLファイル削除
const htmlClean = (done) => {
    del([destHtmlFiles]);
    done();
};

// 画像ファイル削除
const imgClean = (done) => {
    del([destImgFiles]);
    done();
};

// タスク化
exports.compileEjs = compileEjs;
exports.compileSass = compileSass;
exports.reloadFile = reloadFile;
exports.reloadBrowser = reloadBrowser;
exports.minifyImage = minifyImage;
exports.clean = clean;
exports.htmlClean = htmlClean;
exports.imgClean = imgClean;

// 監視ファイル
const watchFiles = (done) => {
    gulp.watch([srcEjsFiles, srcJsonFiles], gulp.series(htmlClean, compileEjs));
    gulp.watch(destHtmlFiles, reloadBrowser);
    gulp.watch(srcScssFiles, compileSass);
    gulp.watch(destCssFiles, reloadBrowser);
    gulp.watch(destJSFiles, reloadBrowser);
    gulp.watch(srcImgFiles, gulp.series(imgClean, minifyImage));
    gulp.watch(destImgFiles, reloadBrowser);
    done();
};

// タスク実行
exports.default = gulp.series(
    clean, watchFiles, reloadFile, compileEjs, compileSass, minifyImage
);