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
- `<kk-rows sel="123">` does the same, so it also works from HTML
- `myTbl.random()` picks a random row, jumps to it, marks it and calls the `cb` callback, the callback object has `ev:'RNG'` and `idx`
- the old `{msg:'rng'}` postMessage stays as it was, add `jump:true` to make it jump and mark too
- if the marked row is filtered away the mark is kept, it shows up again as soon as it matches the filter
- style of the marked row: `css="..."` attribute with `:host{--kk-sel:#F004}`

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
