import { useCallback, useEffect, useRef, useState } from 'react'
import { degrees, PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import { ArrowDownToLine, ChevronLeft, ChevronRight, LoaderCircle, RotateCcw, RotateCw, Trash2, X, ZoomIn, ZoomOut } from 'lucide-react'

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl

type PageInfo = { pageNumber: number; rotation: number; deleted: boolean }

type Props = { file: File; onClose: () => void }

export default function PdfWorkspace({ file, onClose }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const pdfRef = useRef<pdfjsLib.PDFDocumentProxy | null>(null)
  const [pages, setPages] = useState<PageInfo[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [zoom, setZoom] = useState(1)
  const [loading, setLoading] = useState(true)
  const [rendering, setRendering] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    let task: pdfjsLib.PDFDocumentLoadingTask | undefined
    setLoading(true)
    setError('')
    setMessage('')
    setPages([])
    setCurrentPage(1)

    file.arrayBuffer().then((buffer) => {
      if (cancelled) return
      task = pdfjsLib.getDocument({ data: new Uint8Array(buffer) })
      return task.promise
    }).then((pdf) => {
      if (!pdf || cancelled) return
      pdfRef.current = pdf
      setPages(Array.from({ length: pdf.numPages }, (_, index) => ({ pageNumber: index + 1, rotation: 0, deleted: false })))
    }).catch((cause: unknown) => {
      if (!cancelled) setError(cause instanceof Error ? cause.message : 'This PDF could not be opened.')
    }).finally(() => {
      if (!cancelled) setLoading(false)
    })

    return () => {
      cancelled = true
      pdfRef.current = null
      void task?.destroy()
    }
  }, [file])

  const renderPage = useCallback(async () => {
    const pdf = pdfRef.current
    const canvas = canvasRef.current
    const info = pages.find((page) => page.pageNumber === currentPage && !page.deleted)
    if (!pdf || !canvas || !info) return
    setRendering(true)
    try {
      const page = await pdf.getPage(info.pageNumber)
      const viewport = page.getViewport({ scale: zoom, rotation: info.rotation })
      const context = canvas.getContext('2d')
      if (!context) throw new Error('Canvas rendering is unavailable in this browser.')
      const ratio = Math.min(window.devicePixelRatio || 1, 2)
      canvas.width = Math.floor(viewport.width * ratio)
      canvas.height = Math.floor(viewport.height * ratio)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      await page.render({ canvasContext: context, viewport }).promise
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to render this page.')
    } finally {
      setRendering(false)
    }
  }, [currentPage, pages, zoom])

  useEffect(() => { void renderPage() }, [renderPage])

  const visiblePages = pages.filter((page) => !page.deleted)
  const currentInfo = pages.find((page) => page.pageNumber === currentPage)
  const setRotation = (amount: number) => {
    setPages((old) => old.map((page) => page.pageNumber === currentPage ? { ...page, rotation: (page.rotation + amount + 360) % 360 } : page))
    setMessage('')
  }
  const deleteCurrentPage = () => {
    if (visiblePages.length <= 1) {
      setError('A PDF must contain at least one page.')
      return
    }
    setPages((old) => old.map((page) => page.pageNumber === currentPage ? { ...page, deleted: true } : page))
    const next = visiblePages.find((page) => page.pageNumber > currentPage) ?? [...visiblePages].reverse().find((page) => page.pageNumber < currentPage)
    if (next) setCurrentPage(next.pageNumber)
    setMessage('')
    setError('')
  }

  const downloadPdf = async () => {
    if (!pdfRef.current) return
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const source = await file.arrayBuffer()
      const output = await PDFDocument.load(source)
      for (const page of pages.filter((item) => !item.deleted && item.rotation !== 0)) {
        const target = output.getPage(page.pageNumber - 1)
        const existing = target.getRotation().angle
        target.setRotation(degrees((existing + page.rotation) % 360))
      }
      const removeIndexes = pages.filter((page) => page.deleted).map((page) => page.pageNumber - 1).sort((a, b) => b - a)
      removeIndexes.forEach((index) => output.removePage(index))
      const bytes = await output.save()
      const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = file.name.replace(/\.pdf$/i, '') + '-edited.pdf'
      document.body.appendChild(link)
      link.click()
      link.remove()
      URL.revokeObjectURL(url)
      setMessage('Your edited PDF has been downloaded.')
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not export this PDF. It may be encrypted or unsupported.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="pdf-workspace" aria-label="PDF editor">
      <div className="pdf-workspace-header">
        <div className="pdf-workspace-heading"><button className="icon-button" onClick={onClose} aria-label="Close PDF editor"><X size={18} /></button><div><span className="eyebrow">PDF WORKSPACE</span><h2>{file.name}</h2><p>{visiblePages.length} of {pages.length || '…'} pages · Changes stay in this browser</p></div></div>
        <button className="primary-button" onClick={() => void downloadPdf()} disabled={loading || saving || !!error || visiblePages.length === 0}>{saving ? <LoaderCircle className="spin" size={16} /> : <ArrowDownToLine size={16} />}{saving ? 'Exporting…' : 'Download edited PDF'}</button>
      </div>
      <div className="pdf-toolbar">
        <div className="pdf-tool-group"><button className="pdf-tool-button" onClick={() => setRotation(-90)} disabled={!currentInfo || loading}><RotateCcw size={16} /> Rotate left</button><button className="pdf-tool-button" onClick={() => setRotation(90)} disabled={!currentInfo || loading}><RotateCw size={16} /> Rotate right</button><button className="pdf-tool-button pdf-delete-button" onClick={deleteCurrentPage} disabled={!currentInfo || loading || visiblePages.length <= 1}><Trash2 size={16} /> Delete page</button></div>
        <div className="pdf-tool-group"><button className="icon-button" aria-label="Zoom out" onClick={() => setZoom((value) => Math.max(.5, +(value - .15).toFixed(2)))} disabled={zoom <= .5}><ZoomOut size={17} /></button><span className="zoom-label">{Math.round(zoom * 100)}%</span><button className="icon-button" aria-label="Zoom in" onClick={() => setZoom((value) => Math.min(2, +(value + .15).toFixed(2)))} disabled={zoom >= 2}><ZoomIn size={17} /></button></div>
      </div>
      <div className="pdf-editor-body">
        <aside className="pdf-page-list" aria-label="PDF pages"><div className="pdf-page-list-title">PAGES</div>{pages.map((page) => <button key={page.pageNumber} className={`pdf-page-thumb ${currentPage === page.pageNumber ? 'pdf-page-thumb-active' : ''} ${page.deleted ? 'pdf-page-thumb-deleted' : ''}`} onClick={() => !page.deleted && setCurrentPage(page.pageNumber)} disabled={page.deleted}><span className="pdf-page-thumb-number">{page.deleted ? 'Removed' : `Page ${page.pageNumber}`}</span><span className="pdf-page-thumb-preview">{page.deleted ? <Trash2 size={20} /> : page.rotation ? <RotateCw size={20} /> : <span className="mini-page-lines" />}</span></button>)}</aside>
        <div className="pdf-page-stage">
          {loading && <div className="pdf-state"><LoaderCircle className="spin" size={25} /><span>Opening your PDF…</span></div>}
          {!loading && error && <div className="pdf-state pdf-state-error"><strong>Could not open this PDF</strong><span>{error}</span><button className="pdf-tool-button" onClick={() => { setError(''); setMessage('') }}>Dismiss</button></div>}
          {!loading && !error && <div className="pdf-canvas-wrap"><canvas ref={canvasRef} aria-label={`PDF page ${currentPage}`} />{rendering && <div className="pdf-rendering"><LoaderCircle className="spin" size={19} /></div>}</div>}
          <div className="pdf-stage-footer"><button className="icon-button" aria-label="Previous page" disabled={visiblePages.length === 0 || currentPage === visiblePages[0]?.pageNumber} onClick={() => { const index = visiblePages.findIndex((page) => page.pageNumber === currentPage); if (index > 0) setCurrentPage(visiblePages[index - 1].pageNumber) }}><ChevronLeft size={19} /></button><span>Page {Math.max(visiblePages.findIndex((page) => page.pageNumber === currentPage) + 1, 0)} of {visiblePages.length}</span><button className="icon-button" aria-label="Next page" disabled={visiblePages.length === 0 || currentPage === visiblePages[visiblePages.length - 1]?.pageNumber} onClick={() => { const index = visiblePages.findIndex((page) => page.pageNumber === currentPage); if (index >= 0 && index < visiblePages.length - 1) setCurrentPage(visiblePages[index + 1].pageNumber) }}><ChevronRight size={19} /></button></div>
        </div>
      </div>
      {message && <p className="pdf-success-message">{message}</p>}
      <p className="pdf-privacy-note">Your document is processed locally. No upload to a MobiDocs server is required. Text editing and OCR are separate tools and are not part of this first PDF editor release.</p>
    </section>
  )
}
