import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Upload, X } from "lucide-react"

const FileUpload = React.forwardRef(({ 
  className, 
  onFileSelect, 
  accept = "*", 
  multiple = false, 
  maxSize,
  ...props 
}, ref) => {
  const [dragActive, setDragActive] = React.useState(false)
  const [files, setFiles] = React.useState([])
  const inputRef = React.useRef(null)

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleChange = (e) => {
    e.preventDefault()
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files)
    }
  }

  const handleFiles = (fileList) => {
    const fileArray = Array.from(fileList)
    
    if (maxSize) {
      const validFiles = fileArray.filter(file => file.size <= maxSize)
      if (validFiles.length !== fileArray.length) {
        console.warn('Some files exceed the maximum size limit')
      }
      setFiles(validFiles)
      onFileSelect?.(validFiles)
    } else {
      setFiles(fileArray)
      onFileSelect?.(fileArray)
    }
  }

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index)
    setFiles(newFiles)
    onFileSelect?.(newFiles)
  }

  const onButtonClick = () => {
    inputRef.current?.click()
  }

  return (
    <div className={cn("w-full", className)} ref={ref} {...props}>
      <div
        className={cn(
          "relative border-2 border-dashed rounded-lg p-6 transition-colors",
          dragActive ? "border-primary bg-primary/10" : "border-muted-foreground/25",
          "hover:border-primary hover:bg-primary/5"
        )}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={multiple}
          onChange={handleChange}
        />
        
        <div className="flex flex-col items-center justify-center space-y-2 text-center">
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            <Button
              type="button"
              variant="ghost"
              className="p-0 h-auto font-semibold text-primary hover:text-primary/80"
              onClick={onButtonClick}
            >
              Click to upload
            </Button>
            {" or drag and drop"}
          </div>
          {maxSize && (
            <p className="text-xs text-muted-foreground">
              Maximum file size: {(maxSize / 1024 / 1024).toFixed(1)}MB
            </p>
          )}
        </div>
      </div>

      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          {files.map((file, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-2 border rounded-md"
            >
              <span className="text-sm truncate">{file.name}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => removeFile(index)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  )
})

FileUpload.displayName = "FileUpload"

export { FileUpload }