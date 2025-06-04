import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"
import { Camera, Wand2, Heart, Play } from "lucide-react"

export function Portfolio() {
  const { t } = useLanguage()

  const videoSections = [
    {
      id: "realistic",
      title: t("portfolio.realistic"),
      icon: Camera,
      color: "text-primary",
      videos: Array(4).fill(0).map((_, i) => ({
        id: i,
        title: `Realistic Video ${i + 1}`,
        description: "High-quality realistic AI video with stunning details"
      }))
    },
    {
      id: "animation",
      title: t("portfolio.animation"),
      icon: Wand2,
      color: "text-accent",
      videos: Array(4).fill(0).map((_, i) => ({
        id: i,
        title: `Animation ${i + 1}`,
        description: "Creative animation with dynamic characters and storytelling"
      }))
    },
    {
      id: "pixar",
      title: t("portfolio.pixar"),
      icon: Heart,
      color: "text-pink-500",
      videos: Array(4).fill(0).map((_, i) => ({
        id: i,
        title: `Pixar Style ${i + 1}`,
        description: "Charming Pixar-style video with lovable characters"
      }))
    }
  ]

  const VideoCard = ({ video, index }: { video: any, index: number }) => (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: index * 0.1 }}
      viewport={{ once: true }}
      className="flex-none w-80 group cursor-pointer"
      whileHover={{ scale: 1.05 }}
    >
      <div className="video-placeholder aspect-video rounded-xl mb-4 flex items-center justify-center relative overflow-hidden">
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
      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
        {video.title}
      </h4>
      <p className="text-gray-600 dark:text-gray-300 text-sm">
        {video.description}
      </p>
    </motion.div>
  )

  return (
    <section id="portfolio" className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
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
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                <section.icon className={`w-8 h-8 ${section.color} mr-3 rtl:ml-3 rtl:mr-0`} />
                {section.title}
              </h3>
            </div>
            
            <div className="carousel-container flex space-x-6 rtl:space-x-reverse overflow-x-auto pb-4">
              {section.videos.map((video, index) => (
                <VideoCard key={video.id} video={video} index={index} />
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
