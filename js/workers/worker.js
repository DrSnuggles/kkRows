/*	Worker large array/object of million rows */

const data = []	// holds 1 million rows
let filtered = [] // filtered data
let actRow = 0 //
let dispCnt = 20 // how many rows do we want to display (todo: determine ba container height and rendered row height)

//
// load data
//
// generate it
console.time('generate data')
for (let i = 0; i < 1000000; i++) {
	const h = i.toString(16).padStart(5, '0')
	const row = {}
	for (let j = 0; j < 26; j++) { // ASCII: A..Z
		const ltr = String.fromCharCode(j + 65)
		row[j] = ltr + h // integer is much faster
		//row[ltr] = ltr + h // than char
	}
	data.push( row )
}
console.timeEnd('generate data')

console.time('copy data')
// 16s deep copy !! filtered = JSON.parse( JSON.stringify(data) )	// default to unfiltered data
filtered = [...data] // 2ms, shallow copy
console.timeEnd('copy data')

function filter(words) {
	console.time('Filter')
	/* OR filter
	for (let w = 0; w < words.length; w++) {
		let findWord = words[w].toLowerCase()
		for (let i = 0; i < data.length; i++) {
			for (let k = 0; k < 26; k++) {
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
	if (firstWord === '') {
		// NULL filter
		filtered = [...data]
	} else {
		// AND filter
		filtered = []
		// walk thru rows
		// all words have to be in at least one col
		for (let i = 0; i < data.length; i++) {
			let foundWords = 0
			for (let w = 0; w < words.length; w++) {
				for (let k = 0; k < 26; k++) {
					let haystack = data[i][k].toLowerCase()
					if (haystack.indexOf(words[w]) > -1) {
						foundWords++
						break // just count a word once
					}
				}
			}
			if (foundWords === words.length) {
				filtered.push( data[i] )
			}
		}

	}


	console.timeEnd('Filter')

	actRow = 0
	sendRows()
}

function sendRows(dir = -1, scrollTo) {
	const dat = []

	const len = filtered.length

	let stepSize = (dir == 1) ? dispCnt/2 : -dispCnt/2
	actRow += stepSize
	if (scrollTo == scrollTo*1) actRow = scrollTo * len
	actRow = Math.floor(actRow)
	if (actRow < 0 ) actRow = 0
	if (actRow > len - dispCnt ) actRow = len - dispCnt
	
	for (let i = actRow; i < actRow + dispCnt; i++) {
		if (filtered[i])
			dat.push( filtered[i] )
	}

	postMessage({msg:'rows', data: dat, actRow: actRow, len: len})
}

onmessage = function(e) {
	// most used on top
	if (e.data.filter) {
		filter(e.data.filter)
		return
	}
	if (e.data.resize) {
		dispCnt = e.data.resize.rows
		sendRows(-1, actRow/filtered.length)
		return
	}

	switch (e.data.msg) {
		case 'getRows':
			sendRows(e.data.dir, e.data.scrollTo)
			break
		default:
			console.error('Unknown message from Module got: ', e.data)
	}
}
