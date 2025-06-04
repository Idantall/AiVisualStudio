import { useState } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"
import { Camera, Wand2, Heart, Play, ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { YouTubeModal } from "./YouTubeModal"

export function Portfolio() {
  const { t } = useLanguage()
  const [modalVideo, setModalVideo] = useState<{videoId: string, title: string} | null>(null)

  const videoSections = [
    {
      id: "realistic",
      title: t("portfolio.realistic"),
      icon: Camera,
      color: "text-primary",
      videos: [
        {
          id: 0,
          title: "AI Portrait Animation",
          youtubeId: "3Uv9I_ArckI"
        },
        {
          id: 1,
          title: "Realistic Character Motion",
          youtubeId: "B-qw6dGhQUM"
        },
        {
          id: 2,
          title: "Realistic Video Style 2",
          youtubeId: "qORP8UOeJl4"
        },
        {
          id: 3,
          title: "Realistic Video Style 3",
          youtubeId: "yj4lfjVzzp8"
        }
      ]
    },
    {
      id: "animation",
      title: t("portfolio.animation"),
      icon: Wand2,
      color: "text-accent",
      videos: [
        {
          id: 0,
          title: "Animation Style 1",
          youtubeId: "8ZIl2y_b4wM"
        },
        {
          id: 1,
          title: "Animation Style 2",
          youtubeId: "m4SgAK3xd-s"
        },
        {
          id: 2,
          title: "Animation Style 3",
          youtubeId: "3fhbhWZr1JE"
        },
        {
          id: 3,
          title: "Animation Style 4",
          youtubeId: "BvmsMg8fSYE"
        }
      ]
    },
    {
      id: "pixar",
      title: t("portfolio.pixar"),
      icon: Heart,
      color: "text-pink-500",
      videos: [
        {
          id: 0,
          title: "Pixar Style Animation",
          youtubeId: "WVHfTMU1lsk"
        },
        {
          id: 1,
          title: "Animated Character Story",
          youtubeId: "J2v0Mlj0foQ"
        },
        {
          id: 2,
          title: "Pixar Style Sample 3"
        },
        {
          id: 3,
          title: "Pixar Style Sample 4"
        }
      ]
    }
  ]



  const VideoCard = ({ video, index }: { video: any, index: number }) => {
    const handleVideoClick = () => {
      if (video.youtubeId) {
        setModalVideo({ videoId: video.youtubeId, title: video.title })
      }
    }

    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: index * 0.1 }}
        viewport={{ once: true }}
        className="group cursor-pointer"
        whileHover={{ scale: 1.05 }}
        onClick={handleVideoClick}
      >
        <div className="aspect-video rounded-xl mb-4 relative overflow-hidden">
          {video.youtubeId ? (
            <div className="relative w-full h-full">
              <img
                src={`https://img.youtube.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                alt={video.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to high quality thumbnail if maxres doesn't exist
                  e.currentTarget.src = `https://img.youtube.com/vi/${video.youtubeId}/hqdefault.jpg`
                }}
              />
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.3 }}
              >
                <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center opacity-90 group-hover:opacity-100 transition-opacity">
                  <Play className="w-8 h-8 text-white ml-1" fill="white" />
                </div>
              </motion.div>
            </div>
          ) : (
            <div className="video-placeholder w-full h-full flex items-center justify-center relative">
              <div className="absolute inset-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800" />
              <motion.div
                className="relative z-10"
                whileHover={{ scale: 1.2 }}
                transition={{ duration: 0.3 }}
              >
                <Play className="w-12 h-12 text-gray-400 group-hover:text-primary transition-colors" />
              </motion.div>
              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <section id="portfolio" className="py-20 section-bg-1 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            {t("portfolio.title")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t("portfolio.subtitle")}
          </p>
        </motion.div>

        {videoSections.map((section, sectionIndex) => (
          <motion.div 
            key={section.id}
            className="mb-16"
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: sectionIndex * 0.2 }}
            viewport={{ once: true }}
          >
            <div className="mb-8">
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center mb-6">
                <section.icon className={`w-8 h-8 ${section.color} mr-3 rtl:ml-3 rtl:mr-0`} />
                {section.title}
              </h3>
            </div>
            
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex space-x-6 rtl:space-x-reverse pb-4">
                {section.videos.map((video, index) => (
                  <div key={video.id} className="w-80 flex-shrink-0">
                    <VideoCard video={video} index={index} />
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* YouTube Modal */}
      {modalVideo && (
        <YouTubeModal
          isOpen={true}
          onClose={() => setModalVideo(null)}
          videoId={modalVideo.videoId}
          title={modalVideo.title}
        />
      )}
    </section>
  )
}
