# kkRows

## ToDo / TaDa
- Customizable style
+ Show number of rows
+ JSON return value for callback
+ Minimized to a single JS file (also brotli compressed)

## Idea
Display 1 million rows in the browser with search.

There is also another repository "hyperlist" which does similar.

Difference is that here workers are used and it's event based instead rAF.

The million rows with 26 cols eat up about 745MB inside the worker. Keep that in mind.

## License
MIT
