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
let callback = false
let hide = []

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
	let stepSize = (dir == 1) ? dispCnt/2 : -dispCnt/2
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

function getRandom(callback, amount = 1, src = filtered) {
	// return random row(s)
	const rngRow = src[getRandomInt(0, src.length-1)]
	//console.log('getRandom', rngRow)
	postMessage( {rng: rngRow, callback: callback} )
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
		const oncli = (callback) ? ' onclick="kkRowsCallback(this, '+ callback +')"' : ''
		const colWidth = 100/(rows[0].length-hide.length)
		rows.forEach((row) => {
			//html.push('<tr'+ oncli +'>')
			html.push('<tr>')
			row.forEach((col, colInd) => {
				//if (hide.indexOf(c+'') !== -1) continue // do not show this column, no want to keep maybe for IDs
				const dispMe = (hide.indexOf(colInd+'') !== -1) ? ' class="hidden"' : ''
				html.push('<td'+ oncli +''+ dispMe +' width="'+ colWidth +'%" title="'+ col +'">'+ col +'</td>')
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
	filtered = [...data]
	console.timeEnd('parseCSV')
	actRow = 0
	sendRows()
	postMessage({resizeNeeded:true})
}

function parseJSON(j) {
	console.time('parseJSON')
	data = j
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
	if (e.data.cb) {
		callback = e.data.cb
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
		case 'getRandom':
			getRandom(e.data.callback)	// (cb, amount, source) source filtered = default
			break
		default:
			console.error('Unknown message from Module got: ', e.data)
	}
}
