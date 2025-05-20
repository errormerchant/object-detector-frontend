"use client"

import { useState, useRef } from "react"
import { Upload, ImageIcon, Loader2 } from "lucide-react"
import NextImage from "next/image"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { detectObjects } from "@/app/actions"

export default function Home() {
  const [image, setImage] = useState(null)
  const [file, setFile] = useState(null)
  const [detections, setDetections] = useState([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const fileInputRef = useRef()

  async function compressImage(file, maxWidth = 1024, quality = 0.7) {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement("canvas")
        const scaleFactor = maxWidth / img.width

        canvas.width = Math.min(maxWidth, img.width)
        canvas.height = img.height * scaleFactor

        const ctx = canvas.getContext("2d")
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        canvas.toBlob(
          (blob) => {
            if (!blob) return reject(new Error("Compression failed."))
            const compressedFile = new File([blob], file.name, { type: "image/jpeg" })
            resolve(compressedFile)
          },
          "image/jpeg",
          quality
        )
      }
      img.onerror = reject
      img.src = URL.createObjectURL(file)
    })
  }

  const handleFileChange = (e) => {
    const selectedFile = e.target.files?.[0]
    if (selectedFile) {
      setFile(selectedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result)
        setDetections([])
      }
      reader.readAsDataURL(selectedFile)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    const droppedFile = e.dataTransfer.files[0]
    if (droppedFile) {
      setFile(droppedFile)
      const reader = new FileReader()
      reader.onload = (e) => {
        setImage(e.target?.result)
        setDetections([])
      }
      reader.readAsDataURL(droppedFile)
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

const processImage = async () => {
  if (!file) return

  try {
    setIsProcessing(true)
    setError(null)

    let finalFile = file

    // Compress if over 1MB
    if (file.size > 1_000_000) {
      try {
        finalFile = await compressImage(file)
        console.log("Compressed image size:", (finalFile.size / 1024).toFixed(2), "KB")
      } catch (err) {
        setError("Image is too large and compression failed.")
        return
      }
    }

    setImage(URL.createObjectURL(finalFile))
    setFile(finalFile)

    // Create form data from the final (compressed or original) file
    const formData = new FormData()
    formData.append("file", finalFile)

    const result = await detectObjects(formData)
    setDetections(result)
  } catch (err) {
    setError(err.message || "Failed to process image. Please try again.")
  } finally {
    setIsProcessing(false)
  }
}

  return (
    <main className="min-h-screen bg-cover bg-center py-12 px-4 flex items-center justify-center" style={{backgroundImage: "url('/background.png')"}}>
      <div className="w-full max-w-5xl px-12 py-16 shadow-md bg-opacity-0 text-white space-y-6">
        <h1 className="text-3xl font-bold mb-8 text-center">Object Detection App</h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Upload Image</CardTitle>
              <CardDescription>Upload an image to detect objects</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className={cn(
                  "border-2 border-dashed rounded-lg p-12 flex flex-col items-center justify-center cursor-pointer hover:bg-muted/50 transition-colors",
                  image ? "border-muted" : "border-primary/20",
                )}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onClick={() => fileInputRef.current?.click()}
              >
                {image ? (
                  <div className="relative w-full aspect-video">
                    <NextImage src={image || "/placeholder.svg"} alt="Uploaded image" fill className="object-contain" />
                  </div>
                ) : (
                  <>
                    <Upload className="h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm text-muted-foreground mb-1">Drag and drop an image here or click to browse</p>
                    <p className="text-xs text-muted-foreground">Supports JPG, PNG and WEBP</p>
                  </>
                )}
                <input type="file" accept="image/*" className="hidden" id="image-upload" onChange={handleFileChange} ref={fileInputRef}/>
              </div>
              <Button className="w-full mt-4" onClick={() => fileInputRef.current?.click()}>
                <ImageIcon className="mr-2 h-4 w-4" />
                {image ? "Change Image" : "Select Image"}
              </Button>
            </CardContent>
            <CardFooter>
              <Button onClick={processImage} disabled={!image || isProcessing} className="w-full">
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Detect Objects"
                )}
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Detection Results</CardTitle>
              <CardDescription>Objects detected in the image</CardDescription>
            </CardHeader>
            <CardContent>
              {error && <div className="bg-destructive/10 text-destructive p-3 rounded-md mb-4 text-sm">{error}</div>}

              {image && detections.length > 0 && (
                <div className="relative w-full aspect-video mb-4">
                  <NextImage src={image || "/placeholder.svg"} alt="Processed image" fill className="object-contain" />
                  <DetectionOverlay detections={detections} imageUrl={image} />
                </div>
              )}

              {!image && !isProcessing && (
                <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                  <ImageIcon className="h-12 w-12 mb-4" />
                  <p>Upload an image to see detection results</p>
                </div>
              )}

              {isProcessing && (
                <div className="flex flex-col items-center justify-center h-[200px]">
                  <Loader2 className="h-12 w-12 animate-spin text-primary mb-4" />
                  <p className="text-muted-foreground">Processing your image...</p>
                </div>
              )}

              {detections.length > 0 && (
                <div className="mt-4">
                  <h3 className="font-medium mb-2">Detected Objects:</h3>
                  <ul className="space-y-2">
                    {detections.map((detection, index) => (
                      <li key={index} className="flex justify-between items-center p-2 bg-muted/50 rounded-md">
                        <span className="font-medium">{detection.label}</span>
                        <span className="text-sm bg-primary/10 text-primary px-2 py-1 rounded-full">
                          {Math.round(detection.score * 100)}%
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}

function DetectionOverlay({ detections, imageUrl }) {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 })

  // Load the image to get its dimensions
  useState(() => {
    const img = new Image()
    img.src = imageUrl
    img.crossOrigin = "anonymous"
    img.onload = () => {
      setDimensions({
        width: img.width,
        height: img.height,
      })
    }
  })

  if (dimensions.width === 0) return null

  // Generate random colors for each unique label
  const labelColors = {}
  detections.forEach((detection) => {
    if (!labelColors[detection.label]) {
      const hue = Math.floor(Math.random() * 360)
      labelColors[detection.label] = `hsl(${hue}, 70%, 50%)`
    }
  })

  return (
    <svg
      className="absolute inset-0 w-full h-full"
      viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
      preserveAspectRatio="xMidYMid meet"
    >
      {detections.map((detection, index) => {
        const [x, y, x1, y1] = detection.bbox || [0, 0, 0, 0]
        const width = x1 - x
        const height = y1 - y
        const color = labelColors[detection.label]

        return (
          <g key={index}>
            <rect x={x} y={y} width={width} height={height} stroke={color} strokeWidth="3" fill="none" />
            <rect x={x} y={y - 20} width={Math.max(detection.label.length * 8, 50)} height="20" fill={color} />
            <text x={x + 5} y={y - 5} fill="white" fontSize="12" fontWeight="bold">
              {detection.label}
            </text>
          </g>
        )
      })}
    </svg>
  )
}