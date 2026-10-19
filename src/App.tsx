import { useRef, useState } from 'react'
import PdfWorkspace from './PdfWorkspace'
import { ArrowDownToLine, ArrowRight, Check, ChevronDown, FileImage, FileSearch, FileText, Files, Image, LockKeyhole, Menu, ScanText, ShieldCheck, Sparkles, Upload, X } from 'lucide-react'

type Tool = { id: string; title: string; description: string; icon: typeof FileText; tag?: string }
const tools: Tool[] = [
  { id: 'pdf-edit', title: 'Edit a PDF', description: 'Make everyday changes to a PDF document.', icon: FileText, tag: 'PDF' },
  { id: 'ocr', title: 'OCR text recognition', description: 'Extract searchable text from scans and images.', icon: ScanText, tag: 'OCR' },
  { id: 'convert', title: 'Convert files', description: 'Move between common document and image formats.', icon: Files, tag: 'CONVERT' },
  { id: 'image', title: 'Edit an image', description: 'Prepare, rotate, crop and export images.', icon: Image, tag: 'IMAGE' },
  { id: 'pdf-image', title: 'PDF to images', description: 'Turn PDF pages into image files.', icon: FileImage, tag: 'EXPORT' },
  { id: 'extract', title: 'Extract PDF text', description: 'Pull text from supported digital PDFs.', icon: FileSearch, tag: 'TEXT' },
]

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export default function App() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [activeTool, setActiveTool] = useState('')
  const [dragging, setDragging] = useState(false)
  const [mobileMenu, setMobileMenu] = useState(false)

  const acceptFiles = (files: FileList | null) => {
    const next = files?.[0]
    if (next) {
      setFile(next)
      setActiveTool('')
    }
  }

  const selectedTool = tools.find((tool) => tool.id === activeTool)

  return (
    <div className="app-shell">
      <header className="topbar">
        <a className="brand" href="#home" aria-label="MobiDocs home">
          <span className="brand-mark"><Files size={21} strokeWidth={2.2} /></span>
          <span className="brand-name">mobi<span>docs</span></span>
        </a>
        <nav className={mobileMenu ? 'nav-links nav-open' : 'nav-links'} aria-label="Main navigation">
          <a className="nav-active" href="#tools" onClick={() => setMobileMenu(false)}>Tools</a>
          <a href="#how-it-works" onClick={() => setMobileMenu(false)}>How it works</a>
          <a href="#privacy" onClick={() => setMobileMenu(false)}>Privacy</a>
        </nav>
        <div className="topbar-right">
          <span className="private-pill"><LockKeyhole size={13} /> Files stay on your device</span>
          <button className="mobile-menu" aria-label="Toggle navigation" onClick={() => setMobileMenu(!mobileMenu)}>{mobileMenu ? <X size={21} /> : <Menu size={21} />}</button>
        </div>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-copy">
            <div className="eyebrow"><span className="eyebrow-dot" /> YOUR DOCUMENT WORKSPACE</div>
            <h1>Documents,<br /><span>made workable.</span></h1>
            <p className="hero-subtitle">Edit PDFs, bring scanned pages to life, and convert files in one straightforward workspace.</p>
            <div className="hero-benefits">
              <span><Check size={15} /> No account needed</span>
              <span><Check size={15} /> Private by design</span>
              <span><Check size={15} /> Works in your browser</span>
            </div>
          </div>
          <div className="upload-panel" onDragOver={(event) => { event.preventDefault(); setDragging(true) }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); acceptFiles(event.dataTransfer.files) }}>
            <div className={dragging ? 'dropzone dropzone-active' : 'dropzone'}>
              <div className="upload-icon"><Upload size={24} /></div>
              <h2>{file ? 'Your file is ready' : 'Start with a file'}</h2>
              <p>{file ? 'Choose a tool below to get started.' : 'Drop a PDF or image here, or browse your device.'}</p>
              <input ref={inputRef} className="file-input" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,.txt,.docx" onChange={(event) => acceptFiles(event.target.files)} />
              <button className="primary-button" onClick={() => inputRef.current?.click()}>{file ? 'Choose another file' : 'Choose a file'} <ArrowRight size={16} /></button>
              <span className="file-hint">PDF, JPG, PNG, WEBP and more · Max size depends on your device</span>
            </div>
            {file && <div className="file-summary"><div className="file-type-icon"><FileText size={19} /></div><div className="file-details"><strong>{file.name}</strong><span>{formatBytes(file.size)} · {file.type || 'File type not identified'}</span></div><button className="icon-button" aria-label="Remove selected file" onClick={() => { setFile(null); setActiveTool('') }}><X size={17} /></button></div>}
            <div className="upload-footnote"><ShieldCheck size={16} /><span>Your file is handled locally in this browser in the initial workflow. It is not uploaded to MobiDocs.</span></div>
          </div>
        </section>

        <section id="tools" className="tools-section">
          <div className="section-heading"><div><div className="eyebrow">GET THINGS DONE</div><h2>What would you like to do?</h2></div><span className="section-count">06 TOOLS</span></div>
          <div className="tools-grid">
            {tools.map((tool, index) => {
              const Icon = tool.icon
              return <button key={tool.id} className={`tool-card ${activeTool === tool.id ? 'tool-card-active' : ''}`} onClick={() => { setActiveTool(activeTool === tool.id ? '' : tool.id); if (!file) inputRef.current?.click() }}>
                <div className="tool-card-top"><span className="tool-icon"><Icon size={21} strokeWidth={1.8} /></span><span className="tool-tag">{tool.tag}</span></div>
                <h3>{tool.title}</h3><p>{tool.description}</p><span className="tool-action">Open tool <ArrowRight size={15} /></span><span className="tool-index">0{index + 1}</span>
              </button>
            })}
          </div>
          {selectedTool?.id === 'pdf-edit' && file && file.name.toLowerCase().endsWith('.pdf') && <PdfWorkspace file={file} onClose={() => setActiveTool('')} />}
          {selectedTool && !(selectedTool.id === 'pdf-edit' && file && file.name.toLowerCase().endsWith('.pdf')) && <div className="tool-notice"><div className="notice-icon"><Sparkles size={19} /></div><div><strong>{selectedTool.title}</strong><p>{!file ? 'Choose a file to continue.' : selectedTool.id === 'pdf-edit' ? 'This first editor workflow works with PDF files. Choose a PDF to view, rotate, remove pages and export.' : `Selected file: ${file.name}. The ${selectedTool.title.toLowerCase()} workflow is queued for the next implementation stage.`}</p></div><button className="icon-button" aria-label="Close tool notice" onClick={() => setActiveTool('')}><X size={17} /></button></div>}
        </section>

        <section id="how-it-works" className="how-section">
          <div className="how-intro"><div className="eyebrow">SIMPLE BY DESIGN</div><h2>Less file juggling.<br />More getting it done.</h2><p>Useful document tools, without the clutter or unnecessary steps.</p></div>
          <div className="steps-list"><div className="step"><span className="step-number">01</span><div><h3>Choose your file</h3><p>Open a document or image from your device.</p></div><ChevronDown size={17} className="step-chevron" /></div><div className="step"><span className="step-number">02</span><div><h3>Pick a tool</h3><p>Choose the action that matches your task.</p></div><ChevronDown size={17} className="step-chevron" /></div><div className="step"><span className="step-number">03</span><div><h3>Export your result</h3><p>Download the processed file directly to your device.</p></div><ArrowDownToLine size={17} className="step-chevron" /></div></div>
        </section>

        <section id="privacy" className="privacy-strip"><div className="privacy-symbol"><LockKeyhole size={22} /></div><div><h3>Your files are yours. Full stop.</h3><p>MobiDocs is being built around local browser processing. Your documents should not be uploaded or retained just to use everyday tools.</p></div><span className="privacy-label"><ShieldCheck size={14} /> PRIVACY FIRST</span></section>
      </main>

      <footer className="footer"><a className="brand footer-brand" href="#home"><span className="brand-mark"><Files size={18} /></span><span className="brand-name">mobi<span>docs</span></span></a><span>Documents, made workable.</span><span>© {new Date().getFullYear()} MobiWave Innovations</span></footer>
    </div>
  )
}
