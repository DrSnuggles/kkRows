/*	kk-rows web component
	based on: https://www.section.io/engineering-education/how-to-create-a-web-component-with-vanilla-javascript/
	and: https://www.thinktecture.com/en/web-components/native-web-components-without-framework/
	and: https://www.hosteurope.de/blog/web-components-spass-auch-mal-ohne-frameworks/
	
	- Custom Elements
	- shadow DOM
	- HTML Templates
*/

const template = document.createElement('template')
template.innerHTML = `
<style>
:host {
	height: 100%; /* else no resize change */
	display: inline-block;
}
#kkOuter {
	position: relative;
	width: 100%;
	min-height: 100%;
}
#fInput {
	width: calc(100% - 10px);
	text-align: center;
}
	#fInput::placeholder {
		text-align: center;
	}
#fInput:focus,
#myTblScroll:focus
{
	outline: none;
}
#myTblDiv {
	height: calc(25vh - 39px);
	overflow-y: none;
	font: 80% sans-serif;
}
	#myTblDiv table {
		border-spacing: 0;
		width: calc(100% - 20px);
	}
		#myTblDiv table td,
		#myTblDiv table th {
			padding: 0;
			/*width: calc(100% / 26);*/
			overflow: hidden;
			text-overflow: ellipsis;
			display: inline-block;
			white-space: nowrap;
		}
		#myTblDiv table td {
			cursor: pointer;
		}
		#myTblDiv table th {
			background: #0001;
			text-align: left;
		}
#myTblScroll {
	position: absolute;
	margin: 0;
	margin-top: 22px;
	/*right: calc(-25vh + 39px);*/
	width: calc(25vh - 39px);
	transform-origin: 0 0;
	transform: rotate(90deg);
}
#myTblDiv table td.hidden {
	display: none;
}
</style>
<div id="kkOuter">
	<input id="fInput" placeholder="Type search term"/>
	<input type="range" id="myTblScroll" min="0" max="1" step="0.0000001" value="0"/>
	<div id="myTblDiv"></div>
</div>
`

export class kkRows extends HTMLElement {
	static get observedAttributes() {
		return ['data', 'src', 'head', 'cb', 'hide']
	}

	constructor() {
		super()
		this._shadowRoot = this.attachShadow({mode: 'closed'}) // with closed, a ShadowRoot reference needs to be stored
		//this.attachShadow({mode: 'open'}) // open or closed
		this._shadowRoot.appendChild(template.content.cloneNode(true))
		//this.shadowRoot.querySelector('h3').innerText = this.getAttribute('name')
		this.initWorker()
		this.initHandler()
	}

	initWorker() {
		const worker = new Worker(location.origin +'/kkRows/js/worker.js', {type: 'module'})

		// ToDo: inline worker would reduce another request, best pre tersered
		//const blob = new Blob([``], {type:'text/javascript'})
		//const worker = new Worker(URL.createObjectURL(blob))

		this.worker = worker	// store for later
		worker.onmessage = (e) => {
			//console.log('From worker', e.data)
			if (e.data.tbl) {
				//document.body.insertAdjacentHTML('beforeEnd', e.data.tbl)
				this._shadowRoot.getElementById('myTblScroll').value = e.data.actRow / e.data.len
				const myTblDiv = this._shadowRoot.getElementById('myTblDiv')
				if (myTblDiv.childNodes.length === 0) {
					myTblDiv.innerHTML = e.data.tbl
					this.resizer()
				} else {
					myTblDiv.childNodes[0].remove() // important else garbage grows
					myTblDiv.innerHTML = e.data.tbl
				}

				return
			}

			if (e.data.resizeNeeded) {
				this.resizer()
				return
			}

		}

		//worker.postMessage({msg:'getRows'})

	} // initWorker

	initHandler() {
		// resize
		const ro = new ResizeObserver(entries => {
			for (let entry of entries) {
			  const cr = entry.contentRect
			  //console.log('Element:', entry.target)
			  //console.log(`Element size: ${cr.width}px x ${cr.height}px`)
			  //console.log(`Element padding: ${cr.top}px ; ${cr.left}px`)
			  this.resizer()
			}
		  })
		  ro.observe( this._shadowRoot.host ) // Observe one or multiple elements

		// wheel
		this.addEventListener('wheel', (e) => { // scroll
			this.worker.postMessage({scroll: {
				deltaX: e.deltaX,
				deltaY: e.deltaY,
			}})
		}, {passive:true})
		this._shadowRoot.getElementById('myTblScroll').oninput = (e) => { // range slider
			this.worker.postMessage({scrollTo: e.target.value*1})
		}

		// search input
		this.keyTimer = null
		this.lastInput = ''
		this._shadowRoot.getElementById('fInput').onkeyup = (e) => {
			const thisInput = e.target.value
			if (this.lastInput !== thisInput) {
				if (this.keyTimer) {
					clearTimeout(this.keyTimer)
					this.keyTimer = null
				}

				this.keyTimer = setTimeout(()=>{
					this.worker.postMessage({filter: this._shadowRoot.getElementById('fInput').value})
				}, 500) // 500ms for next keyup event

				this.lastInput = thisInput
			}

		}
	} // initHandler

	resizer() {
		const myTblDiv = this._shadowRoot.getElementById('myTblDiv')
		const restHeight = this._shadowRoot.getElementById('kkOuter').offsetHeight - 21
		this._shadowRoot.getElementById('myTblScroll').style.width = restHeight +'px'
		this.worker.postMessage({resize: {
			//width: myTblDiv.offsetWidth,
			//height: myTblDiv.offsetHeight,
			//rows: (myTblDiv.getElementsByTagName('tr')[0]) ? Math.floor(myTblDiv.offsetHeight / myTblDiv.getElementsByTagName('tr')[0].offsetHeight) : 10,
			rows: (myTblDiv.getElementsByTagName('tr')[0]) ? Math.floor(restHeight / myTblDiv.getElementsByTagName('tr')[0].offsetHeight) : 1,
		}})
	}

	connectedCallback() {
		console.log('added to DOM')
		//this.h3 = this.getAttribute("name")
		//this.render()
	}

	disconnectedCallback() {
		console.log('removed from DOM')
	}

	adoptedCallback() {
		console.log('moved in DOM')
	}

	attributeChangedCallback(att, old, upd) {
		//console.log('attribute changed', att, old, upd)
		// just send to worker
		this.worker.postMessage({[att]: upd})
	}

	render() {
		//this.h3
	}

}

customElements.define('kk-rows', kkRows)
