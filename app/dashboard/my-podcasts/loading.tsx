export default function Loading() {
  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-4xl font-bold mb-8">My Podcasts</h1>
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6">Personal Feed</h2>
        <div className="grid grid-cols-1 gap-4">
          {[...Array(3)].map((_, index) => (
            <div 
              key={index}
              className="bg-gray-800 rounded-lg p-4 animate-pulse"
            >
              <div className="h-6 bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/4 mb-2"></div>
              <div className="h-4 bg-gray-700 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 