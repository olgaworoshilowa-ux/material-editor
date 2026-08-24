import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js'
import { OutlinePass } from 'three/examples/jsm/postprocessing/OutlinePass.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import type { ChairSlotId, MaterialItem, TextureSettings } from '../types'
import './Viewport.css'

type ViewportProps = {
  fabricMaterial: MaterialItem
  frameMaterial: MaterialItem
  fabricSettings: TextureSettings
  frameSettings: TextureSettings
  selectedSlot: ChairSlotId
  onSelectSlot: (slot: ChairSlotId) => void
}

type SlotMats = Record<ChairSlotId, THREE.MeshStandardMaterial>

type RoomScene = {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  composer: EffectComposer
  outlinePass: OutlinePass
  parts: Map<ChairSlotId, THREE.Object3D[]>
  slotMats: SlotMats
  applyGen: Record<ChairSlotId, number>
  chair: THREE.Group
  frameId: number
  disposed: boolean
  raycaster: THREE.Raycaster
  pointer: THREE.Vector2
}

function clamp(n: number) {
  return Math.max(0, Math.min(255, n))
}

function makeFabricTexture(base: string): THREE.CanvasTexture {
  const size = 256
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  for (let y = 0; y < size; y += 2) {
    for (let x = 0; x < size; x += 2) {
      const n = (Math.sin(x * 0.35) + Math.cos(y * 0.4)) * 0.5
      ctx.fillStyle = `rgba(0,0,0,${(14 + n * 8) / 255})`
      ctx.fillRect(x, y, 1, 1)
    }
  }

  const img = ctx.getImageData(0, 0, size, size)
  for (let i = 0; i < img.data.length; i += 4) {
    const d = (Math.random() - 0.5) * 14
    img.data[i] = clamp(img.data[i] + d)
    img.data[i + 1] = clamp(img.data[i + 1] + d)
    img.data[i + 2] = clamp(img.data[i + 2] + d)
  }
  ctx.putImageData(img, 0, 0)

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.colorSpace = THREE.SRGBColorSpace
  tex.anisotropy = 8
  return tex
}

function makeWoodFloorTexture(): THREE.CanvasTexture {
  const w = 512
  const h = 512
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')!
  const plankH = 64
  const colors = ['#d8c3a5', '#cfb896', '#e0c9ab', '#cbb08a', '#d6be9c']

  for (let y = 0, row = 0; y < h; y += plankH, row++) {
    let x = 0
    while (x < w) {
      const plankW = 90 + ((row * 17 + x) % 70)
      ctx.fillStyle = colors[(row + Math.floor(x / 40)) % colors.length]
      ctx.fillRect(x, y, plankW - 2, plankH - 2)
      ctx.strokeStyle = 'rgba(90,70,45,0.18)'
      ctx.strokeRect(x + 0.5, y + 0.5, plankW - 2, plankH - 2)
      x += plankW
    }
  }

  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.wrapT = THREE.RepeatWrapping
  tex.repeat.set(3, 3)
  tex.colorSpace = THREE.SRGBColorSpace
  return tex
}

function tag(mesh: THREE.Object3D, slot: ChairSlotId) {
  mesh.userData.slotId = slot
  mesh.traverse((child) => {
    child.userData.slotId = slot
  })
  return mesh
}

function softBox(
  w: number,
  h: number,
  d: number,
  mat: THREE.Material,
  radius = 0.04,
): THREE.Mesh {
  const geo = new THREE.BoxGeometry(w, h, d, 8, 6, 8)
  const pos = geo.attributes.position
  for (let i = 0; i < pos.count; i++) {
    let x = pos.getX(i)
    let y = pos.getY(i)
    let z = pos.getZ(i)
    const ax = Math.abs(x)
    const ay = Math.abs(y)
    const az = Math.abs(z)
    if (ax > w / 2 - radius && ay > h / 2 - radius) {
      const cx = Math.sign(x) * (w / 2 - radius)
      const cy = Math.sign(y) * (h / 2 - radius)
      const dx = x - cx
      const dy = y - cy
      const len = Math.hypot(dx, dy) || 1
      x = cx + (dx / len) * radius
      y = cy + (dy / len) * radius
    }
    if (Math.abs(x) > w / 2 - radius && az > d / 2 - radius) {
      const cx = Math.sign(x) * (w / 2 - radius)
      const cz = Math.sign(z) * (d / 2 - radius)
      const dx = x - cx
      const dz = z - cz
      const len = Math.hypot(dx, dz) || 1
      x = cx + (dx / len) * radius
      z = cz + (dz / len) * radius
    }
    pos.setXYZ(i, x, y, z)
  }
  pos.needsUpdate = true
  geo.computeVertexNormals()
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  return mesh
}

function buildArmchair(
  fabric: THREE.MeshStandardMaterial,
  frame: THREE.MeshStandardMaterial,
): { group: THREE.Group; parts: Map<ChairSlotId, THREE.Object3D[]> } {
  const group = new THREE.Group()

  const seat = softBox(0.72, 0.12, 0.7, fabric, 0.05)
  seat.position.set(0, 0.42, 0.02)
  tag(seat, 'fabric')

  const back = softBox(0.72, 0.55, 0.12, fabric, 0.055)
  back.position.set(0, 0.72, -0.3)
  back.rotation.x = -0.08
  tag(back, 'fabric')

  const armL = softBox(0.1, 0.28, 0.68, fabric, 0.04)
  armL.position.set(-0.36, 0.55, 0)
  tag(armL, 'fabric')

  const armR = softBox(0.1, 0.28, 0.68, fabric, 0.04)
  armR.position.set(0.36, 0.55, 0)
  tag(armR, 'fabric')

  group.add(seat, back, armL, armR)

  const frameParts: THREE.Object3D[] = []
  const legPos: Array<[number, number, number]> = [
    [-0.28, 0.18, 0.26],
    [0.28, 0.18, 0.26],
    [-0.28, 0.18, -0.26],
    [0.28, 0.18, -0.26],
  ]
  for (const [x, y, z] of legPos) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.028, 0.36, 12), frame)
    leg.position.set(x, y, z)
    leg.castShadow = true
    tag(leg, 'frame')
    group.add(leg)
    frameParts.push(leg)
  }

  const under = softBox(0.7, 0.06, 0.66, frame, 0.02)
  under.position.set(0, 0.34, 0.02)
  tag(under, 'frame')
  group.add(under)
  frameParts.push(under)

  return {
    group,
    parts: new Map([
      ['fabric', [seat, back, armL, armR]],
      ['frame', frameParts],
    ]),
  }
}

function createScene(canvas: HTMLCanvasElement): RoomScene {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: false,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setClearColor('#f2f2f2', 1)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.1

  const scene = new THREE.Scene()
  scene.background = new THREE.Color('#f2f2f2')

  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 50)

  const hemi = new THREE.HemisphereLight(0xffffff, 0xe8dfd2, 1)
  scene.add(hemi)

  const key = new THREE.DirectionalLight(0xfffaf3, 1.5)
  key.position.set(2.5, 4.5, 2)
  key.castShadow = true
  key.shadow.mapSize.set(1024, 1024)
  key.shadow.camera.near = 0.5
  key.shadow.camera.far = 12
  key.shadow.camera.left = -2.5
  key.shadow.camera.right = 2.5
  key.shadow.camera.top = 2.5
  key.shadow.camera.bottom = -2.5
  key.shadow.bias = -0.0003
  scene.add(key)

  const fill = new THREE.DirectionalLight(0xe8f0ff, 0.45)
  fill.position.set(-2, 2.5, 1.5)
  scene.add(fill)

  const floorMat = new THREE.MeshStandardMaterial({
    map: makeWoodFloorTexture(),
    roughness: 0.78,
    metalness: 0.02,
  })
  const wallMat = new THREE.MeshStandardMaterial({
    color: '#f7f7f7',
    roughness: 0.95,
    metalness: 0,
  })

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(5, 5), floorMat)
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const backWall = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.6), wallMat)
  backWall.position.set(0, 1.3, -1.4)
  backWall.receiveShadow = true
  scene.add(backWall)

  const sideWall = new THREE.Mesh(new THREE.PlaneGeometry(5, 2.6), wallMat)
  sideWall.position.set(-1.5, 1.3, 0)
  sideWall.rotation.y = Math.PI / 2
  sideWall.receiveShadow = true
  scene.add(sideWall)

  const fabricMat = new THREE.MeshStandardMaterial({
    color: '#b7a0c9',
    roughness: 0.85,
    metalness: 0,
  })
  const frameMat = new THREE.MeshStandardMaterial({
    color: '#2f241c',
    roughness: 0.5,
    metalness: 0.08,
  })

  const chair = buildArmchair(fabricMat, frameMat)
  chair.group.position.set(0, 0, 0)
  chair.group.rotation.y = -0.35
  scene.add(chair.group)

  const composer = new EffectComposer(renderer)
  composer.addPass(new RenderPass(scene, camera))

  const outlinePass = new OutlinePass(new THREE.Vector2(1, 1), scene, camera)
  outlinePass.edgeStrength = 8
  outlinePass.edgeGlow = 0.6
  outlinePass.edgeThickness = 2.5
  outlinePass.pulsePeriod = 0
  outlinePass.visibleEdgeColor.set('#34c759')
  outlinePass.hiddenEdgeColor.set('#34c759')
  composer.addPass(outlinePass)
  composer.addPass(new OutputPass())

  return {
    renderer,
    scene,
    camera,
    composer,
    outlinePass,
    parts: chair.parts,
    slotMats: { fabric: fabricMat, frame: frameMat },
    applyGen: { fabric: 0, frame: 0 },
    chair: chair.group,
    frameId: 0,
    disposed: false,
    raycaster: new THREE.Raycaster(),
    pointer: new THREE.Vector2(),
  }
}

function collectMeshes(objs: THREE.Object3D[]): THREE.Object3D[] {
  const meshes: THREE.Object3D[] = []
  for (const obj of objs) {
    obj.traverse((child) => {
      if (child instanceof THREE.Mesh) meshes.push(child)
    })
  }
  return meshes
}

function setOutline(state: RoomScene, slot: ChairSlotId) {
  const objs = state.parts.get(slot) ?? []
  state.outlinePass.selectedObjects = collectMeshes(objs)
}

function applySlotMaterial(
  state: RoomScene,
  slot: ChairSlotId,
  material: MaterialItem,
  settings: TextureSettings,
) {
  const mat = state.slotMats[slot]
  const gen = (state.applyGen[slot] += 1)

  if (mat.map) {
    mat.map.dispose()
    mat.map = null
  }

  if (settings.mode === 'solid') {
    mat.color.set(settings.solidColor)
    mat.needsUpdate = true
    return
  }

  const s = Math.max(0.25, settings.scale / 100)
  const rotation = (settings.rotation * Math.PI) / 180

  if (material.mapUrl) {
    const loader = new THREE.TextureLoader()
    loader.load(
      material.mapUrl,
      (tex) => {
        if (state.disposed || state.applyGen[slot] !== gen) {
          tex.dispose()
          return
        }
        if (mat.map) mat.map.dispose()
        tex.wrapS = THREE.RepeatWrapping
        tex.wrapT = THREE.RepeatWrapping
        tex.colorSpace = THREE.SRGBColorSpace
        tex.anisotropy = 8
        tex.repeat.set(s * 2.2, s * 2.2)
        tex.center.set(0.5, 0.5)
        tex.rotation = rotation
        mat.map = tex
        mat.color.set(settings.tint)
        mat.needsUpdate = true
      },
      undefined,
      () => {
        if (state.disposed || state.applyGen[slot] !== gen) return
        const fallback = makeFabricTexture(material.color)
        fallback.repeat.set(s * 2.2, s * 2.2)
        fallback.center.set(0.5, 0.5)
        fallback.rotation = rotation
        mat.map = fallback
        mat.color.set(settings.tint)
        mat.needsUpdate = true
      },
    )
    return
  }

  const map = makeFabricTexture(material.color)
  map.repeat.set(s * 2.2, s * 2.2)
  map.center.set(0.5, 0.5)
  map.rotation = rotation
  mat.map = map
  mat.color.set(settings.tint)
  mat.needsUpdate = true
}

function findSlotId(obj: THREE.Object3D | null): ChairSlotId | null {
  let cur: THREE.Object3D | null = obj
  while (cur) {
    if (cur.userData.slotId) return cur.userData.slotId as ChairSlotId
    cur = cur.parent
  }
  return null
}

export function Viewport({
  fabricMaterial,
  frameMaterial,
  fabricSettings,
  frameSettings,
  selectedSlot,
  onSelectSlot,
}: ViewportProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const wrapRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<RoomScene | null>(null)
  const selectedRef = useRef(selectedSlot)
  const onSelectRef = useRef(onSelectSlot)
  const dragRef = useRef({
    active: false,
    moved: false,
    x: 0,
    y: 0,
    yaw: 0.55,
    pitch: 0.12,
  })

  useEffect(() => {
    selectedRef.current = selectedSlot
  }, [selectedSlot])

  useEffect(() => {
    onSelectRef.current = onSelectSlot
  }, [onSelectSlot])

  useEffect(() => {
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return

    const state = createScene(canvas)
    sceneRef.current = state
    setOutline(state, selectedRef.current)

    const focusTarget = new THREE.Vector3(0, 0.5, 0)

    const orbit = () => {
      const { yaw, pitch } = dragRef.current
      const dist = 2.55
      state.camera.position.set(
        focusTarget.x + Math.sin(yaw) * Math.cos(pitch) * dist,
        focusTarget.y + Math.sin(pitch) * dist + 0.35,
        focusTarget.z + Math.cos(yaw) * Math.cos(pitch) * dist,
      )
      state.camera.lookAt(focusTarget)
    }

    const resize = () => {
      const w = Math.max(1, Math.floor(wrap.clientWidth))
      const h = Math.max(1, Math.floor(wrap.clientHeight))
      if (w < 2 || h < 2) return
      state.renderer.setSize(w, h, false)
      state.composer.setSize(w, h)
      state.outlinePass.setSize(w, h)
      state.outlinePass.resolution.set(w, h)
      state.camera.aspect = w / h
      state.camera.updateProjectionMatrix()
    }

    resize()
    orbit()
    requestAnimationFrame(() => {
      resize()
      setOutline(state, selectedRef.current)
    })

    const ro = new ResizeObserver(() => {
      resize()
    })
    ro.observe(wrap)

    const tick = () => {
      if (state.disposed) return
      state.frameId = requestAnimationFrame(tick)
      state.composer.render()
    }
    tick()

    const onDown = (e: PointerEvent) => {
      dragRef.current.active = true
      dragRef.current.moved = false
      dragRef.current.x = e.clientX
      dragRef.current.y = e.clientY
      canvas.setPointerCapture(e.pointerId)
    }

    const onMove = (e: PointerEvent) => {
      if (!dragRef.current.active) return
      const dx = e.clientX - dragRef.current.x
      const dy = e.clientY - dragRef.current.y
      if (Math.abs(dx) + Math.abs(dy) > 3) dragRef.current.moved = true
      dragRef.current.x = e.clientX
      dragRef.current.y = e.clientY
      dragRef.current.yaw -= dx * 0.005
      dragRef.current.pitch = THREE.MathUtils.clamp(
        dragRef.current.pitch + dy * 0.003,
        -0.2,
        0.55,
      )
      orbit()
    }

    const onUp = (e: PointerEvent) => {
      const wasDrag = dragRef.current.moved
      dragRef.current.active = false
      try {
        canvas.releasePointerCapture(e.pointerId)
      } catch {
        /* ignore */
      }
      if (wasDrag) return

      const rect = canvas.getBoundingClientRect()
      if (!rect.width || !rect.height) return
      state.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
      state.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1
      state.raycaster.setFromCamera(state.pointer, state.camera)

      const pickables: THREE.Object3D[] = []
      for (const objs of state.parts.values()) pickables.push(...objs)
      const hits = state.raycaster.intersectObjects(pickables, true)
      if (!hits.length) return
      const slot = findSlotId(hits[0].object)
      if (slot) onSelectRef.current(slot)
    }

    canvas.addEventListener('pointerdown', onDown)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerup', onUp)

    return () => {
      state.disposed = true
      cancelAnimationFrame(state.frameId)
      ro.disconnect()
      canvas.removeEventListener('pointerdown', onDown)
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerup', onUp)
      Object.values(state.slotMats).forEach((m) => {
        m.map?.dispose()
        m.dispose()
      })
      state.composer.dispose()
      state.renderer.dispose()
      sceneRef.current = null
    }
  }, [])

  useEffect(() => {
    const state = sceneRef.current
    if (!state) return
    setOutline(state, selectedSlot)
  }, [selectedSlot])

  useEffect(() => {
    const state = sceneRef.current
    if (!state) return
    applySlotMaterial(state, 'fabric', fabricMaterial, fabricSettings)
  }, [fabricMaterial, fabricSettings])

  useEffect(() => {
    const state = sceneRef.current
    if (!state) return
    applySlotMaterial(state, 'frame', frameMaterial, frameSettings)
  }, [frameMaterial, frameSettings])

  return (
    <main className="viewport">
      <div className="viewport__canvas-wrap" ref={wrapRef}>
        <canvas ref={canvasRef} className="viewport__canvas" />
      </div>
      <p className="viewport__hint">Click fabric or frame · drag to orbit</p>
    </main>
  )
}
