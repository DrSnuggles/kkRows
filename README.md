# kkRows

## ToDo
- Fix that thead and tbody have different childLength, thats unnice for CSS and brain
- Displays a line too much if header is present, could not find anymore...
- Too wide when no whitespace to break.. ellipsis (example search in player "mega man x2 cham" with 3 visible cols)

## TaDa
- Random entry: myTbl.worker.postMessage({msg:'rng', callback: 'myRngCallback'}) or myTbl.random()
- myTbl.goto(idx) mark and scrolls into middle
- myTbl.mark(idx) marks without scrolling
- <kk-rows sel="123"> jumps and marks like goto, so it also works from HTML

## Idea
Display 1 million rows in the browser with search.

There is also another repository "hyperlist" which does similar.

Difference is that here workers are used and it's event based instead rAF.

Memory consumption: A table with one million rows and 26 columns eats up about 745MB inside the worker. Keep that in mind.

## License
MIT
