import { useState, useRef, DragEvent, ChangeEvent } from "react";

interface FileUploadProps {
  file: File | null;
  onFileChange: (file: File | null) => void;
  accept?: string;
  label?: string;
}

export function FileUpload({
  file,
  onFileChange,
  accept = ".tgz",
  label = "Plugin Archive (.tgz)",
}: FileUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragEnter = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      onFileChange(files[0]);
    }
  };

  const handleFileInput = (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFileChange(files[0]);
    }
    // Очищаємо input для можливості вибрати той самий файл знову
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    onFileChange(null);
    // Очищаємо input при видаленні файлу
    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-slate-700">
        {label}
      </label>

      <div
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={[
          "relative flex flex-col items-center justify-center rounded-lg border-2 px-6 py-8 text-center transition-colors",
          file
            ? "border-slate-300 bg-slate-50"
            : isDragging
              ? "border-sky-400 bg-sky-50"
              : "border-dashed border-slate-300 bg-slate-50 hover:border-slate-400",
        ].join(" ")}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          onChange={handleFileInput}
          className="absolute inset-0 cursor-pointer opacity-0"
        />

        {file ? (
          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-200"></div>
              <div className="flex flex-col items-start">
                <span className="text-sm font-medium text-slate-900">
                  {file.name}
                </span>
                <span className="text-xs text-slate-500">
                  {(file.size / 1024).toFixed(1)} KB
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleRemove();
              }}
              className="flex h-7 w-7 items-center justify-center rounded-full text-slate-400 hover:bg-slate-200 hover:text-slate-900"
            >
              ✕
            </button>
          </div>
        ) : (
          <div className="pointer-events-none">
            <p className="text-sm font-medium text-slate-900">
              Drop file here or click to browse
            </p>
            <p className="mt-1 text-xs text-slate-500">Supports .tgz files</p>
          </div>
        )}
      </div>
    </div>
  );
}
