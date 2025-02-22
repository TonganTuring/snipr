'use client';

export default function Dashboard() {
  return (
    <div className="w-full max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Add New Content</h1>
      {/* URL Input */}
      <div className="mb-6">
        <label htmlFor="url" className="block text-sm font-medium mb-2">
          Paste URL (YouTube or RSS feed)
        </label>
        <div className="flex gap-2">
          <input
            type="url"
            id="url"
            className="flex-1 bg-gray-800/50 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="https://"
          />
          <button className="btn-primary">
            Add
          </button>
        </div>
      </div>

      {/* File Upload */}
      <div>
        <label htmlFor="file" className="block text-sm font-medium mb-2">
          Upload EPUB
        </label>
        <div className="border-2 border-dashed border-gray-700 rounded-lg p-6 text-center">
          <input
            type="file"
            id="file"
            accept=".epub"
            className="hidden"
          />
          <label
            htmlFor="file"
            className="cursor-pointer inline-flex flex-col items-center gap-2"
          >
            <span className="text-sm text-gray-400">
              Drag and drop your EPUB file here, or click to browse
            </span>
            <button className="btn-primary">
              Choose File
            </button>
          </label>
        </div>
      </div>
      
    </div>
  );
} 