/*	App module, DOM access is here
	How to display a million rows in browser with a lot of columns

	<kk-rows data="abc|def|ghi" src="./_test/packs.csv" head="Col 1 Head|Col 2 Head|Col 3 Head"></kk-rows>
*/

//import {kkRows} from '../_src/kk-rows_dev.js'
import {kkRows} from '../js/kk-rows.min.js'

// generate demo CSV data
let data = []
console.time('generate data')
for (let i = 0; i < 1000000; i++) {
	const h = i.toString(16).padStart(5, '0')
	const row = []
	for (let j = 0; j < 26; j++) { // ASCII: A..Z
		const ltr = String.fromCharCode(j + 65)
		row[j] = ltr + h // integer is much faster than row[ltr]
	}
	data.push( row.join('|') )
}
data = data.join('\n')
console.timeEnd('generate data')

// object stylish
let webComp = document.createElement('kk-rows')	// construct
webComp.id = 'kk1'
webComp.setAttribute('cb', `clickCallback`)		// click handler
//webComp.setAttribute('hide', `0`)				// do not show specified columns, they are still present in clicked object
document.body.appendChild(webComp)				// add to DOM
webComp.setAttribute('data', data) // can be CSV(|,\n), JSON
// alternative use: webComp.setAttribute('src', location.origin +'/kkRows/_test/songs.json')// url(full path) to json or csv
//webComp.setAttribute('head', 'csv')	// use first line as headers

// HTML stylish
document.body.insertAdjacentHTML('beforeEnd', `<br/>
<kk-rows id="kk2" cb="clickCallback" src="${location.origin}/kkRows/testdata/songs.json" hide="0" head="Archive|Author|Title"></kk-rows>
<kk-rows id="kk3" src="${location.origin}/kkRows/testdata/songs.json" hide="0"></kk-rows>`)

window.clickCallback = (o) => {
	console.log('clickCallback', o)
}
