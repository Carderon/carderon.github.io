let mix = require('laravel-mix');

mix.js("resources/js/script.js", "assets/js/script.min.js")
   .stylus("resources/stylus/main.styl", "assets/css/main.min.css")
   .options(
       {
           processCssUrls: false,
           postCss: [
               require("cssnano")({
                   preset: "default",
               }),
           ],
       }
   )
   .browserSync('localhost:8000');