/*	Worker large array/object of million rows
	load from URL
	parse CSV
	use localStorage or service worker (sw for data and localStorage for filter/sort...)

	TRY TO AVOID `` i want to use inline later to save a request
*/

let data = []	// holds 1 million rows
let filtered = [] // filtered data, ToDo: rethink this because its doubling the data
let actRow = 0 //
let dispCnt = 1 // how many rows do we want to display (todo: determine by container height and rendered row height)
let head = []
let hide = []
let selIdx = -1 // marked row, index inside data (survives filtering)

function setIndex() {
	// remember the position inside data on every row, _i is ignored by join/forEach/slice
	// filtered holds the same row references, so the index stays valid while filtering
	data.forEach((r, i) => r._i = i)
	selIdx = -1
}

function gotoRow(idx, scroll = true) {
	// mark a row, idx is the index inside data, scroll it into the middle of the view
	if (isNaN(idx)) return
	selIdx = idx
	if (scroll) {
		const pos = filtered.findIndex((r) => r._i === idx)
		if (pos === -1) return // filtered out, mark is kept and shows up again when it matches
		actRow = pos - Math.floor(dispCnt/2)
	}
	sendRows(0)
}

function filter(wordStr) {
	console.time('Filter')
	const words = wordStr.split(' ')
	/* OR filter
	for (let w = 0; w < words.length; w++) {
		let findWord = words[w].toLowerCase()
		for (let i = 0; i < data.length; i++) {
			for (let k = 0; k < data[0].length; k++) {
				let haystack = data[i][k].toLowerCase()
				if (haystack.indexOf(findWord) > -1) {
					filtered.push(data[i])
					break // we just need a row once
				}
			}
		}
	}
	*/
	const firstWord = words[0]
	//console.log(firstWord)
	if (firstWord === '') {
		// NULL filter
		filtered = [...data]
	} else {
		// AND filter
		filtered = []
		// walk thru rows
		// all words have to be the row
		const wordCnt = words.length
		data.forEach((r) => {
			const haystack = r.join('|').toLowerCase()
			let foundWords = 0
			for (let w = 0; w < wordCnt; w++) {
				const needle = words[w].toLowerCase()
				if (haystack.indexOf(needle) > -1) {
					foundWords++
				} else {
					break // no need to search for other words
				}
			}
			if (foundWords === wordCnt) {
				filtered.push( r )
			}
		})
	}

	console.timeEnd('Filter')

	actRow = 0
	sendRows()
}

function sendRows(dir = -1, scrollTo) {
	// find how many rows to display
	const len = filtered.length
	let stepSize = (dir === 0) ? 0 : (dir == 1) ? dispCnt/2 : -dispCnt/2
	actRow += stepSize
	if (scrollTo == scrollTo*1) actRow = scrollTo * len
	actRow = Math.floor(actRow)
	if (actRow > len - dispCnt ) actRow = len - dispCnt
	if (actRow < 0 ) actRow = 0

	let endRow = actRow + dispCnt

	const dat = filtered.slice(actRow, endRow)

	//postMessage({tbl: makeTbl(dat), actRow: actRow, len: len, cols: dat[0]?.length})
	postMessage({tbl: makeTbl(dat), actRow: actRow, endRow: endRow, len: len})
}

function getRandom(cb) {
	// return a random row, jump to it and mark it
	if (filtered.length === 0) return
	const rngRow = filtered[getRandomInt(0, filtered.length-1)]
	//console.log('getRandom', rngRow)
	postMessage( {rng: rngRow, idx: rngRow._i, callback: cb} )
	gotoRow(rngRow._i)
}
function getRandomInt(min, max) {
	const byteArray = new Uint32Array(1)	// Uint16 = 0..65,535, Uint32 = 0..4,294,967,295
	crypto.getRandomValues(byteArray)
	const range = max - min + 1
	const max_range = 4294967295 //65536
	if (byteArray[0] >= Math.floor(max_range / range) * range) return getRandomInt(min, max)

	return min + (byteArray[0] % range)
}

function makeTbl(rows) {
	//console.time('makeTbl')
	let html = []
	html.push('<table>')

	if (head.length > 0) {
		html.push('<thead>')
		head.forEach(col => {
			html.push('<th width="'+ (100/head.length) +'%">'+ col +'</th>')
		})
		html.push('</thead>')
	}

	if (rows.length > 0) {
		// no inline handlers, the module listens on the table container (event delegation)
		const colWidth = 100/(rows[0].length-hide.length)
		rows.forEach((row) => {
			html.push('<tr data-idx="'+ row._i +'"'+ ((row._i === selIdx) ? ' class="sel"' : '') +'>')
			row.forEach((col, colInd) => {
				//if (hide.indexOf(c+'') !== -1) continue // do not show this column, no want to keep maybe for IDs
				const dispMe = (hide.indexOf(colInd+'') !== -1) ? ' class="hidden"' : ''
				html.push('<td'+ dispMe +' width="'+ colWidth +'%" title="'+ col +'">'+ col +'</td>')
			})
			html.push('</tr>')
		})
	}

	html.push('</table>')
	html = html.join('')
	//console.timeEnd('makeTbl')

	return html
}

function loadURL(url) {
	console.time('loadURL: '+ url)
	fetch(url)
	.then(r => r.text())
	.then(t => {
		console.timeEnd('loadURL: '+ url)
		JSONorCSV(t)
	})
	.catch(e => console.error(e))
}

function JSONorCSV(t) {
	try {
		const j = JSON.parse(t)
		parseJSON(j)
	} catch(e) {
		parseCSV(t)
	}
}

function parseCSV(t) {
	// use | as col sep. and LF as row sep.
	console.time('parseCSV')
	data = []
	const rows = t.split( String.fromCharCode(10) )
	rows.forEach((r) => {
		const cols = r.split('|')
		if (r != '') data.push( cols )
	})
	if (head == 'csv') {
		head = data[0]
		data.splice(0,1)
	}
	setIndex()
	filtered = [...data]
	console.timeEnd('parseCSV')
	actRow = 0
	sendRows()
	postMessage({resizeNeeded:true})
}

function parseJSON(j) {
	console.time('parseJSON')
	data = j
	setIndex()
	filtered = [...data]
	console.timeEnd('parseJSON')
	actRow = 0
	sendRows()
	postMessage({resizeNeeded:true})
}

onmessage = function(e) {
	// most used on top
	if (e.data.scroll) {
		if (e.data.scroll.deltaY > 0)
			sendRows(1)
		if (e.data.scroll.deltaY < 0)
			sendRows(-1)
		return
	}
	if (e.data.scrollTo == e.data.scrollTo*1) {
		sendRows(e.data.dir, e.data.scrollTo)
		return
	}
	if (typeof e.data.filter == 'string') {
		filter(e.data.filter)
		return
	}
	if (e.data.resize) {
		dispCnt = e.data.resize.rows
		if (head.length > 0) dispCnt--
		sendRows(-1, actRow/filtered.length)
		return
	}
	if (e.data.sel !== undefined && e.data.sel !== '') { // jump to and mark row, index inside data
		gotoRow(e.data.sel*1)
		return
	}
	if (e.data.mark !== undefined && e.data.mark !== '') { // mark only, do not scroll
		gotoRow(e.data.mark*1, false)
		return
	}
	if (e.data.src) {
		loadURL(e.data.src)
		return
	}
	if (e.data.data) {
		JSONorCSV(e.data.data)
		return
	}
	if (e.data.head) {
		head = e.data.head.split('|') 
		//console.log('head set to', head)
		return
	}
	if (e.data.hide) {
		hide = e.data.hide.split('|')
		return
	}
	switch (e.data.msg) {
		case 'getRows':
			sendRows(e.data.dir, e.data.scrollTo)
			break
		case 'rng':	// alias
		case 'getRandom':
			getRandom(e.data.callback)	// cb name is optional, defaults to the cb attribute
			break
		default:
			console.error('Unknown message from Module got: ', e.data)
	}
}
