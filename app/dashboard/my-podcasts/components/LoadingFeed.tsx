export function LoadingFeed() {
  return (
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
  );
} 