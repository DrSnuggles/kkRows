const gulp = require('gulp')
const concat = require('gulp-concat')
const cleanCSS = require('gulp-clean-css')
const terser = require('gulp-terser')
const brotli = require('gulp-brotli')
const watch = require('gulp-watch')

gulp.task('worker', () => {
	return gulp.src('_src/worker.js')
	.pipe(terser())
	.pipe(gulp.dest('_tmp'))
})

gulp.task('css', () => {
	return gulp.src('_src/*.css')
	.pipe(cleanCSS())
	.pipe(gulp.dest('_tmp'))
})

gulp.task('js', () => {
	return gulp.src([
		'_src/kk-rows.js1',
		'_tmp/kk-rows.css',
		'_src/kk-rows.js2',
		'_tmp/worker.js',
		'_src/kk-rows.js3'
	])
	.pipe(concat('kk-rows.min.js'))
	.pipe(terser())
    .pipe(gulp.dest('js'))
})

gulp.task('brotli', () => {
	return gulp.src(['js/kk-rows.min.js'])
	.pipe(brotli.compress({
		quality: 11,
	}))
    .pipe(gulp.dest('js'))
})

gulp.task('watch', () => {
	watch(['/work/_src/*'], ['build'])
})

gulp.task('default', gulp.series('worker','css','js','brotli',/*'watch'*/))
