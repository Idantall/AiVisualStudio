import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import { Play, ArrowLeft, ArrowRight } from "lucide-react"

export function Hero() {
  const { language, t } = useLanguage()

  const scrollToPortfolio = () => {
    const element = document.getElementById("portfolio")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  const scrollToContact = () => {
    const element = document.getElementById("contact")
    if (element) {
      element.scrollIntoView({ behavior: "smooth" })
    }
  }

  return (
    <section id="home" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      {/* Background Animation */}
      <div className="absolute inset-0 opacity-30">
        <motion.div 
          className="absolute top-20 left-10 w-20 h-20 bg-primary rounded-full blur-xl"
          animate={{ 
            y: [0, -20, 0],
            rotate: [0, 5, 0]
          }}
          transition={{ 
            duration: 6, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        />
        <motion.div 
          className="absolute top-40 right-20 w-32 h-32 bg-accent rounded-full blur-xl"
          animate={{ 
            y: [0, 15, 0],
            rotate: [0, -3, 0]
          }}
          transition={{ 
            duration: 8, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 2
          }}
        />
        <motion.div 
          className="absolute bottom-20 left-1/4 w-24 h-24 bg-secondary rounded-full blur-xl"
          animate={{ 
            y: [0, -10, 0],
            x: [0, 10, 0]
          }}
          transition={{ 
            duration: 7, 
            repeat: Infinity, 
            ease: "easeInOut",
            delay: 4
          }}
        />
      </div>

      <div className="container mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-4xl mx-auto"
        >
          <motion.h1 
            className="text-5xl md:text-7xl font-bold mb-6 leading-tight"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
          >
            <span className="gradient-text">{t("hero.title")}</span>
            <br />
            <span className="text-gray-900 dark:text-white">{t("hero.subtitle")}</span>
          </motion.h1>

          <motion.p 
            className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            {t("hero.description")}
          </motion.p>

          <motion.div 
            className="flex flex-col sm:flex-row gap-4 justify-center items-center"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <Button
              onClick={scrollToContact}
              size="lg"
              className="bg-gradient-to-r from-primary to-accent text-white px-8 py-4 rounded-xl text-lg font-semibold hover:scale-105 transition-transform shadow-lg hover:shadow-2xl animate-glow"
            >
              {t("hero.cta")}
              {language === "he" ? (
                <ArrowLeft className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
              ) : (
                <ArrowRight className="w-5 h-5 ml-2 rtl:mr-2 rtl:ml-0" />
              )}
            </Button>

            <Button
              variant="outline"
              onClick={scrollToPortfolio}
              size="lg"
              className="border-2 border-gray-300 dark:border-gray-600 px-8 py-4 rounded-xl text-lg font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 hover:scale-105 transition-all backdrop-blur-sm"
            >
              <Play className="w-5 h-5 mr-2 rtl:ml-2 rtl:mr-0" />
              {t("hero.portfolio")}
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  )
}
