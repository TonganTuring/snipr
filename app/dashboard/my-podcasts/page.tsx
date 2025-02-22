import Image from 'next/image';

interface PodcastCard {
  title: string;
  description: string;
  category: string;
  image: string;
  frequency?: string;
}

export default function MyPodcasts() {
  const featuredPodcasts: PodcastCard[] = [
    {
      title: "UNBELIEVABLY TRUE",
      description: "A woman turns the tables on a con man, exposing his lies.",
      category: "True Crime",
      image: "/placeholder-pink.jpg"
    }
  ];

  const newPodcasts: PodcastCard[] = [
    {
      title: "Baby Broker",
      description: "The BINGE Cases",
      category: "True Crime",
      frequency: "Weekly Series",
      image: "/placeholder1.jpg"
    },
    {
      title: "The White Lotus",
      description: "HBO Original Official Podcast",
      category: "TV & Film",
      frequency: "Weekly Series",
      image: "/placeholder2.jpg"
    },
    {
      title: "Crafty Chronicles",
      description: "DIY & Creativity",
      category: "Crafts",
      frequency: "Updated Weekly",
      image: "/placeholder3.jpg"
    },
    {
      title: "The Deadly Seven",
      description: "True Crime Stories",
      category: "True Crime",
      frequency: "Updated Weekly",
      image: "/placeholder4.jpg"
    }
  ];

  return (
    <div className="min-h-screen text-white p-8">
      <h1 className="text-4xl font-bold mb-8">My Podcasts</h1>
      {/* Featured Section */}
      <div className="mb-12">
        <div className="relative group cursor-pointer overflow-hidden rounded-xl">
          <div className="aspect-[16/9] relative">
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
            <Image
              src={featuredPodcasts[0].image}
              alt={featuredPodcasts[0].title}
              fill
              className="object-cover"
              priority={true}
            />
            <div className="absolute bottom-0 left-0 p-6 z-20">
              <p className="text-sm font-medium text-gray-300 mb-2">{featuredPodcasts[0].category}</p>
              <h2 className="text-2xl font-bold mb-2">{featuredPodcasts[0].title}</h2>
              <p className="text-gray-300">{featuredPodcasts[0].description}</p>
            </div>
          </div>
        </div>
      </div>

      {/* New & Noteworthy Section */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold mb-6">New & Noteworthy</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {newPodcasts.map((podcast, index) => (
            <div key={index} className="group cursor-pointer">
              <div className="aspect-square relative rounded-lg overflow-hidden mb-4">
                <Image
                  src={podcast.image}
                  alt={podcast.title}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-200"
                />
              </div>
              <div>
                <h3 className="font-semibold mb-1">{podcast.title}</h3>
                <p className="text-sm text-gray-400">{podcast.category}</p>
                <p className="text-sm text-gray-400">{podcast.frequency}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}