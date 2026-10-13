import { useEffect, useRef, useState } from 'react'
import { parseMemberCode } from './memberUtils'
export default function MemberScanner({ onCode }) {
  const video = useRef(null), stream = useRef(null), timer = useRef(null), alive = useRef(true), starting = useRef(false)
  const [camera, setCamera] = useState(false), [busy, setBusy] = useState(false), [message, setMessage] = useState('')
  function stop() { clearInterval(timer.current); timer.current = null; stream.current?.getTracks().forEach(track => track.stop()); stream.current = null; if (video.current) video.current.srcObject = null; if (alive.current) setCamera(false) }
  useEffect(() => { alive.current = true; const hidden = () => { if (document.hidden) stop() }; document.addEventListener('visibilitychange', hidden); return () => { alive.current = false; stop(); document.removeEventListener('visibilitychange', hidden) } }, [])
  async function start() {
    if (starting.current || stream.current) return
    starting.current = true; setBusy(true); setMessage('')
    try {
      if (!navigator.mediaDevices?.getUserMedia) throw Error('Camera is unavailable. Use a QR image or enter the member code.')
      const decoder = (await import('jsqr')).default
      const media = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 640 } }, audio: false })
      if (!alive.current) { media.getTracks().forEach(track => track.stop()); return }
      stream.current = media; video.current.srcObject = media; await video.current.play(); setCamera(true)
      const canvas = document.createElement('canvas'), ctx = canvas.getContext('2d', { willReadFrequently: true })
      timer.current = setInterval(() => {
        if (!video.current?.videoWidth || document.hidden) return
        const scale = Math.min(1,640/video.current.videoWidth); canvas.width = Math.round(video.current.videoWidth*scale); canvas.height = Math.round(video.current.videoHeight*scale)
        ctx.drawImage(video.current,0,0,canvas.width,canvas.height)
        const pixels=ctx.getImageData(0,0,canvas.width,canvas.height), result=decoder(pixels.data,pixels.width,pixels.height)
        const code=result && parseMemberCode(result.data)
        if (code) { stop(); onCode(code); setMessage('Code captured. Verify the member before awarding points.') }
      },250)
    } catch { stop(); if (alive.current) setMessage('Camera access failed or was blocked. Try opening the preview in a new tab, upload a QR image, or enter the member code.') }
    finally { starting.current=false; if (alive.current) setBusy(false) }
  }
  async function scanFile(event) {
    const file=event.target.files?.[0];event.target.value='';if (!file) return
    stop();setBusy(true);setMessage('')
    try {
      if (file.size>5*1024*1024 || !['image/png','image/jpeg','image/webp'].includes(file.type)) throw Error('Choose a PNG, JPG or WebP QR image up to 5 MB.')
      const bitmap=await createImageBitmap(file)
      try {
        if (bitmap.width*bitmap.height>25000000) throw Error('Image dimensions are too large.')
        const scale=Math.min(1,1200/Math.max(bitmap.width,bitmap.height)),canvas=document.createElement('canvas');canvas.width=Math.round(bitmap.width*scale);canvas.height=Math.round(bitmap.height*scale)
        const ctx=canvas.getContext('2d');ctx.drawImage(bitmap,0,0,canvas.width,canvas.height);const image=ctx.getImageData(0,0,canvas.width,canvas.height)
        const decoder=(await import('jsqr')).default,result=decoder(image.data,image.width,image.height),code=result && parseMemberCode(result.data)
        if (!code) throw Error('No valid Aureatine member code was found in this image.')
        if (alive.current) { onCode(code);setMessage('Code captured. Verify the member before awarding points.') }
      } finally { bitmap.close() }
    } catch(error) { if(alive.current)setMessage(error.message || 'Could not read this QR image.') }
    finally { if(alive.current)setBusy(false) }
  }
  return <div className="member-scanner"><video ref={video} muted playsInline hidden={!camera} aria-label="Camera view for scanning a member QR"/><div className="scanner-buttons">{camera ? <button type="button" className="button outline" onClick={stop}>Stop camera</button> : <button type="button" className="button outline" onClick={start} disabled={busy}>Scan with camera</button>}<label className="photo-upload">Read QR image<input type="file" accept="image/png,image/jpeg,image/webp" disabled={busy || camera} onChange={scanFile}/></label></div><p className="member-helper">Camera frames and QR images are processed on this device, not uploaded.</p>{message && <p className="member-notice" role="status">{message}</p>}</div>
}
