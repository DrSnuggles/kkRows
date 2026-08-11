# kkRows

## ToDo
- Fix that thead and tbody have different childLength, thats unnice for CSS and brain
- Displays a line too much if header is present, could not find anymore...
- Too wide when no whitespace to break.. ellipsis (example search in player "mega man x2 cham" with 3 visible cols)

## TaDa
- Random entry: myTbl.worker.postMessage({msg:'rng', callback: 'myRngCallback'})

## Goto and mark a row
Every row knows its index inside the data, it survives filtering and comes back with every callback as `idx`.

- `myTbl.goto(idx)` scrolls the row into the middle of the view and marks it, `myTbl.goto(idx, false)` puts it on top
- `myTbl.mark(idx)` marks without scrolling
- `<kk-rows sel="123">` jumps and marks like goto, so it also works from HTML
- `myTbl.random()` picks a random row, jumps to it, marks it and calls the `cb` callback, the callback object has `ev:'RNG'` and `idx`
- the old `{msg:'rng'}` postMessage jumps and marks now as well, use `jump:false` for the old behaviour
- clicking a row marks it, the view stays where it is
- if the marked row is filtered away the mark is kept, it shows up again as soon as it matches the filter
- style of the marked row: `css="..."` attribute with `:host{--kk-sel:#F004}`, `transparent` switches it off

## Events
Rows have no inline handlers anymore, the module listens on the table container. Beside the `cb` attribute every row event is also a `kk-rows` CustomEvent with the same object in `detail`:
```js
myTbl.addEventListener('kk-rows', (e) => console.log(e.detail.ev, e.detail.idx, e.detail.sel))
```

Round trip, click a row and come back to it later:
```js
let last
myTbl.setAttribute('cb', 'myClick')
window.myClick = (o) => last = o.idx
// ...
myTbl.goto(last)
```

## Idea
Display 1 million rows in the browser with search.

There is also another repository "hyperlist" which does similar.

Difference is that here workers are used and it's event based instead rAF.

Memory consumption: A table with one million rows and 26 columns eats up about 745MB inside the worker. Keep that in mind.

## License
MIT
