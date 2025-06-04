import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"
import { Brain, Palette, Rocket } from "lucide-react"
import spiderManImage from "@assets/68eef3cf-1615-41d1-940f-61cb2ac3656c.jpeg"

export function About() {
  const { t } = useLanguage()

  const features = [
    {
      icon: Brain,
      title: t("about.innovation"),
      description: t("about.innovation_desc"),
      gradient: "from-primary to-accent"
    },
    {
      icon: Palette,
      title: t("about.creative"),
      description: t("about.creative_desc"),
      gradient: "from-accent to-secondary"
    },
    {
      icon: Rocket,
      title: t("about.delivery"),
      description: t("about.delivery_desc"),
      gradient: "from-secondary to-primary"
    }
  ]

  const containerVariants = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" }
    }
  }

  return (
    <section id="about" className="py-20 section-bg-2 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            {t("about.title")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t("about.subtitle")}
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <motion.div 
            className="space-y-6"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="glass-effect p-6 rounded-2xl hover-3d"
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${feature.gradient} rounded-xl flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="relative"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            viewport={{ once: true }}
          >
            {/* Profile image with 3D effect */}
            <div className="relative mx-auto w-80 h-80 rounded-3xl hover-3d overflow-hidden">
              <img 
                src={spiderManImage}
                alt="AI Video Specialist"
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-4 left-4 right-4 glass-effect p-4 rounded-xl">
                <p className="text-sm text-center font-medium text-white">
                  אני נהוראי, נעים להכיר
                </p>
              </div>
            </div>

            {/* Floating decoration */}
            <motion.div 
              className="absolute -top-6 -right-6 w-24 h-24 bg-gradient-to-br from-accent to-secondary rounded-2xl rotate-12 opacity-80"
              animate={{ 
                y: [0, -10, 0],
                rotate: [12, 18, 12]
              }}
              transition={{ 
                duration: 4, 
                repeat: Infinity, 
                ease: "easeInOut" 
              }}
            />
            <motion.div 
              className="absolute -bottom-6 -left-6 w-16 h-16 bg-gradient-to-br from-primary to-accent rounded-full opacity-80"
              animate={{ 
                y: [0, 10, 0],
                x: [0, 5, 0]
              }}
              transition={{ 
                duration: 5, 
                repeat: Infinity, 
                ease: "easeInOut",
                delay: 2
              }}
            />
          </motion.div>
        </div>
      </div>
    </section>
  )
}
