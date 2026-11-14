import { readFile, writeFile } from "node:fs/promises"
import { brotliCompressSync, constants } from "node:zlib"

const minifyJs = contents => new Bun.Transpiler({
	loader: "js",
	minify: true
}).transformSync(contents)

const devFile = "js/kk-rows.js"
const [devSource, workerSource] = await Promise.all([
	readFile(devFile, "utf8"),
	readFile("js/worker.js", "utf8")
])

const stylesheet = devSource.match(/<link\s+rel=["']stylesheet["']\s+href=["']([^"']+)["']\s*\/?\s*>/i)
if (!stylesheet) throw new Error(`No stylesheet link found in ${devFile}`)

const cssPath = stylesheet[1].replace(/^\.\//, "")
const cssResult = await Bun.build({ entrypoints: [cssPath], write: false, minify: true })
if (!cssResult.success) {
	for (const message of cssResult.logs) console.error(message)
	throw new Error(`Bun failed to minify ${stylesheet[1]}`)
}

const escapeTemplate = text => text
	.replaceAll("\\", "\\\\")
	.replaceAll("`", "\\`")
	.replaceAll("${", "\\${")

const css = await cssResult.outputs[0].text()
let source = devSource.replace(stylesheet[0], `<style>${escapeTemplate(css)}</style>`)
const workerRef = "new URL('./worker.js', import.meta.url)"
if (!source.includes(workerRef)) throw new Error(`No worker reference found in ${devFile}`)

const worker = minifyJs(workerSource)
const workerBlob = `URL.createObjectURL(new Blob([${JSON.stringify(worker)}], {type: "text/javascript"}))`
source = source.replace(workerRef, workerBlob)

const bundle = minifyJs(source)
const compressed = brotliCompressSync(Buffer.from(bundle), {
	params: { [constants.BROTLI_PARAM_QUALITY]: 11 }
})

await Promise.all([
	writeFile("js/kk-rows.min.js", bundle),
	writeFile("js/kk-rows.min.js.br", compressed)
])
console.log(`Built js/kk-rows.min.js (${Buffer.byteLength(bundle)} bytes)`)
console.log(`Built js/kk-rows.min.js.br (${compressed.length} bytes)`)
