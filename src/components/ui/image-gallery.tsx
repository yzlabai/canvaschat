"use client"

import * as React from "react"
import { ChevronLeft, ChevronRight, X, ZoomIn, ZoomOut } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog"

interface ImageGalleryProps {
  srcs: string[]
  alt?: string
  className?: string
  showThumbnails?: boolean
  autoPlay?: boolean
  autoPlayInterval?: number
}

const ImageGallery = React.forwardRef<HTMLDivElement, ImageGalleryProps>(
  ({ 
    srcs, 
    alt = "Gallery image", 
    className,
    showThumbnails = false,
    autoPlay = false,
    autoPlayInterval = 3000,
    ...props 
  }, ref) => {
    const [currentIndex, setCurrentIndex] = React.useState(0)
    const [isOpen, setIsOpen] = React.useState(false)
    const [isZoomed, setIsZoomed] = React.useState(false)
    const [imageLoaded, setImageLoaded] = React.useState<boolean[]>(
      new Array(srcs.length).fill(false)
    )

    // Auto-play functionality
    React.useEffect(() => {
      if (!autoPlay || srcs.length <= 1) return

      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % srcs.length)
      }, autoPlayInterval)

      return () => clearInterval(interval)
    }, [autoPlay, autoPlayInterval, srcs.length])

    const goToPrevious = React.useCallback(() => {
      setCurrentIndex((prev) => (prev - 1 + srcs.length) % srcs.length)
    }, [srcs.length])

    const goToNext = React.useCallback(() => {
      setCurrentIndex((prev) => (prev + 1) % srcs.length)
    }, [srcs.length])

    const goToSlide = React.useCallback((index: number) => {
      setCurrentIndex(index)
    }, [])

    const handleImageLoad = React.useCallback((index: number) => {
      setImageLoaded((prev) => {
        const newState = [...prev]
        newState[index] = true
        return newState
      })
    }, [])

    const handleKeyDown = React.useCallback((event: KeyboardEvent) => {
      if (!isOpen) return
      
      switch (event.key) {
        case "ArrowLeft":
          event.preventDefault()
          goToPrevious()
          break
        case "ArrowRight":
          event.preventDefault()
          goToNext()
          break
        case "Escape":
          event.preventDefault()
          setIsOpen(false)
          break
      }
    }, [isOpen, goToPrevious, goToNext])

    React.useEffect(() => {
      document.addEventListener("keydown", handleKeyDown)
      return () => document.removeEventListener("keydown", handleKeyDown)
    }, [handleKeyDown])

    if (!srcs || srcs.length === 0) {
      return (
        <div className="flex items-center justify-center h-48 bg-muted rounded-lg">
          <span className="text-muted-foreground">No images to display</span>
        </div>
      )
    }

    // Single image display
    if (srcs.length === 1) {
      return (
        <div ref={ref} className={cn("relative group", className)} {...props}>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <div className="relative cursor-pointer overflow-hidden rounded-lg">
                <img
                  src={srcs[0]}
                  alt={alt}
                  className={cn(
                    "w-full h-auto object-cover transition-all duration-300",
                    "group-hover:scale-105"
                  )}
                  onLoad={() => handleImageLoad(0)}
                />
                {!imageLoaded[0] && (
                  <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
                )}
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                  <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            </DialogTrigger>
            <DialogContent className="max-w-4xl w-full p-0">
              <div className="relative">
                <img
                  src={srcs[0]}
                  alt={alt}
                  className={cn(
                    "w-full h-auto max-h-[80vh] object-contain transition-transform duration-300",
                    isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                  )}
                  onClick={() => setIsZoomed(!isZoomed)}
                />
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-4 right-4"
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      )
    }

    // Gallery display for multiple images
    return (
      <div ref={ref} className={cn("relative group", className)} {...props}>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <div className="relative cursor-pointer overflow-hidden rounded-lg">
              <img
                src={srcs[currentIndex]}
                alt={`${alt} ${currentIndex + 1} of ${srcs.length}`}
                className={cn(
                  "w-full h-auto object-cover transition-all duration-300",
                  "group-hover:scale-105"
                )}
                onLoad={() => handleImageLoad(currentIndex)}
              />
              {!imageLoaded[currentIndex] && (
                <div className="absolute inset-0 bg-muted animate-pulse rounded-lg" />
              )}
              
              {/* Gallery indicators */}
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {srcs.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "w-2 h-2 rounded-full transition-colors duration-300",
                      currentIndex === index ? "bg-white" : "bg-white/50"
                    )}
                  />
                ))}
              </div>

              {/* Navigation arrows */}
              {srcs.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      goToPrevious()
                    }}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onClick={(e) => {
                      e.stopPropagation()
                      goToNext()
                    }}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Gallery count badge */}
              <div className="absolute top-4 right-4 bg-black/70 text-white px-2 py-1 rounded-md text-sm">
                {currentIndex + 1} / {srcs.length}
              </div>

              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors duration-300 flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            </div>
          </DialogTrigger>

          <DialogContent className="max-w-6xl w-full p-0">
            <div className="relative">
              <img
                src={srcs[currentIndex]}
                alt={`${alt} ${currentIndex + 1} of ${srcs.length}`}
                className={cn(
                  "w-full h-auto max-h-[80vh] object-contain transition-transform duration-300",
                  isZoomed ? "scale-150 cursor-zoom-out" : "cursor-zoom-in"
                )}
                onClick={() => setIsZoomed(!isZoomed)}
              />

              {/* Modal navigation */}
              {srcs.length > 1 && (
                <>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute left-4 top-1/2 transform -translate-y-1/2"
                    onClick={goToPrevious}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="absolute right-4 top-1/2 transform -translate-y-1/2"
                    onClick={goToNext}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </>
              )}

              {/* Modal controls */}
              <div className="absolute top-4 right-4 flex space-x-2">
                <Button
                  variant="secondary"
                  size="icon"
                  onClick={() => setIsZoomed(!isZoomed)}
                >
                  {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
                </Button>
              </div>

              {/* Modal indicators */}
              {srcs.length > 1 && (
                <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {srcs.map((_, index) => (
                    <button
                      key={index}
                      className={cn(
                        "w-3 h-3 rounded-full transition-colors duration-300",
                        currentIndex === index ? "bg-white" : "bg-white/50"
                      )}
                      onClick={() => goToSlide(index)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {showThumbnails && srcs.length > 1 && (
              <div className="p-4 bg-background border-t">
                <div className="flex space-x-2 overflow-x-auto">
                  {srcs.map((src, index) => (
                    <button
                      key={index}
                      className={cn(
                        "flex-shrink-0 w-16 h-16 rounded-md overflow-hidden border-2 transition-colors",
                        currentIndex === index ? "border-primary" : "border-transparent"
                      )}
                      onClick={() => goToSlide(index)}
                    >
                      <img
                        src={src}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    )
  }
)

ImageGallery.displayName = "ImageGallery"

export { ImageGallery }
export type { ImageGalleryProps }
