/*	Main worker, spawns other workers
*/

//
// Worker
//
const worker = new Worker('./worker.js', {type: 'module'})
worker.onmessage = (e) => {
	// received from worker
	switch (e.data.msg) {
		case 'rows':
			postMessage({tbl: makeTbl(e.data.data), actRow: e.data.actRow, len: e.data.len})
			break
		default:
			console.error('Unknown message from Worker:', e.data)
	}
}

worker.postMessage({msg:'getRows'})

function makeTbl(rows) {
	console.time('makeTbl')
	let html = []
	html.push('<table>')

	for (let i = 0, n = rows.length; i < n; i++) {
		html.push('<tr>')
			for (let c = 0, nn = 26; c < nn; c++) {
				html.push('<td>'+rows[i][c]+'</td>')
			}
		html.push('</tr>')
	}
	html.push('</table>')
	html = html.join('')
	console.timeEnd('makeTbl')

	return html
}

let mem = {
	used: 0,
	total: 0,
}

onmessage = (e) => {
	// most used on top
	// route to other worker
	// todo: check if this 2nd level makes it slower
	if (e.data.find) {
		worker.postMessage(e.data)
		return
	}

	if (e.data.mem) { // got memory info
		mem = e.data.mem
		return
	}

	if (e.data.scroll) { // got scroll event
		if (e.data.scroll.deltaY > 0)
			worker.postMessage({msg: 'getRows', dir: 1})
		if (e.data.scroll.deltaY < 0)
			worker.postMessage({msg: 'getRows', dir: -1})

		return
	}

	if (typeof e.data.scrollTo === 'number') { // got slider event
		worker.postMessage({msg: 'getRows', scrollTo: e.data.scrollTo})
		return
	}

	if (typeof e.data.filter === 'string' ) { // got filter event
		worker.postMessage({filter: e.data.filter.split(' ')}) // split by space
		return
	}

	if (e.data.resize) { // got resize event
		worker.postMessage(e.data) // just pass, todo: make others similar
		return
	}

	if (e.data.offscreen) {
		console.log('want to pass offscreen')
		const offscreen = e.data.offscreen
		renderer.postMessage({offscreen: offscreen}, [offscreen])

		return
	}

	// still here ?
	console.error('Main got unknown message:', e.data)
}

postMessage({init: true})
