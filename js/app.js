/*	App module, DOM access is here
	How to display a million rows in browser with a lot of columns
*/

//
// Main worker
//
const main = new Worker('./js/workers/main.js', {type: 'module'})
main.onmessage = (e) => {
	//console.log('From main', e.data)
	if (e.data.tbl) {
		//document.body.insertAdjacentHTML('beforeEnd', e.data.tbl)
		myTblScroll.value = e.data.actRow / e.data.len
		if (myTblDiv.childNodes.length === 0) {
			myTblDiv.innerHTML = e.data.tbl
			resizer()
		} else {
			myTblDiv.childNodes[0].remove() // important else garbage grows
			myTblDiv.innerHTML = e.data.tbl
		}
		return
	}
}

//
// html content
//
{
	document.body.innerHTML = `<input id="fInput" placeholder="Type search term"/>
	<input type="range" id="myTblScroll" min="0" max="1" step="0.0000001" value="0"/>
	<div id="myTblDiv"></div>
	<footer>
		<table width="100%" cellspacing="0" cellpadding="0">
			<tr>
				<td id="stat_dt" title="Time">&nbsp;</td>
				<td id="stat_mem" title="Mem">&nbsp;</td>
			</tr>
		</table>
	</footer>`
	// be kind and update only every second
	setInterval(()=>{
		stat_dt.innerText = new Date().toLocaleString('de-DE', {weekday: 'short', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit'} )
		stat_mem.innerText = formatBytes(performance.memory.usedJSHeapSize) +' / '+ formatBytes(performance.memory.jsHeapSizeLimit) +' = '+ (performance.memory.usedJSHeapSize/performance.memory.jsHeapSizeLimit * 100).toFixed(1) +'%'
	}, 1000)

	function formatBytes(bytes) {
		const kilobytes = bytes/1024
		const megabytes = kilobytes/1024
		const gigabytes = megabytes/1024
		if (gigabytes>=1) return gigabytes.toFixed(1) +'GiB'
		if (megabytes>=1) return megabytes.toFixed(1) +'MiB'
		if (kilobytes>=1) return kilobytes.toFixed(1) +'KiB'
		return bytes +'B'
	}

	//
	// Event handlers
	//
	onresize = resizer
	onwheel = (e) => { // scroll
		main.postMessage({scroll: {
			deltaX: e.deltaX,
			deltaY: e.deltaY,
		}})
	}
	myTblScroll.oninput = (e) => { // range slider
		main.postMessage({scrollTo: e.target.value*1})
	}

	// search input
	let keyTimer = null
	let lastInput = ''
	fInput.onkeyup = (e) => {
		const thisInput = e.target.value
		if (lastInput !== thisInput) {
			if (keyTimer) {
				clearTimeout(keyTimer)
				keyTimer = null
			}

			keyTimer = setTimeout(()=>{
				main.postMessage({filter: e.target.value})
			}, 500) // 500ms for next keyup event

			lastInput = thisInput
		}

	}

}
function resizer(e) {
	main.postMessage({resize: {
		width: myTblDiv.offsetWidth,
		height: myTblDiv.offsetHeight,
		rows: (myTblDiv.getElementsByTagName('tr')[0]) ? Math.floor(myTblDiv.offsetHeight / myTblDiv.getElementsByTagName('tr')[0].offsetHeight) : 10,
	}})
}
