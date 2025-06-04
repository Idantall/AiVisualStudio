import { useState } from "react"
import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { MessageCircle, Mail, Clock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function Contact() {
  const { t } = useLanguage()
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    projectType: "",
    message: ""
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Create WhatsApp message
    const whatsappMessage = `היי! שמי ${formData.name}, אני מעוניין/ת בפרויקט ${formData.projectType}. ${formData.message}. אשמח לקבל פרטים נוספים.`
    const whatsappUrl = `https://wa.me/972539320564?text=${encodeURIComponent(whatsappMessage)}`
    
    // Open WhatsApp
    window.open(whatsappUrl, '_blank')
    
    // Reset form
    setFormData({
      name: "",
      email: "",
      projectType: "",
      message: ""
    })
    
    // Show success message
    toast({
      title: "תודה!",
      description: "נפתח עבורכם וואטסאפ עם הפרטים.",
    })
  }

  const contactInfo = [
    {
      icon: MessageCircle,
      title: t("contact.whatsapp"),
      value: "+972053-9320564",
      description: t("contact.whatsapp_desc"),
      gradient: "from-green-500 to-green-600"
    },
    {
      icon: Mail,
      title: t("contact.email"),
      value: "contact@aivideo.studio",
      description: t("contact.email_desc"),
      gradient: "from-primary to-accent"
    },
    {
      icon: Clock,
      title: t("contact.response"),
      value: t("contact.response_desc"),
      description: t("contact.available"),
      gradient: "from-accent to-secondary"
    }
  ]

  return (
    <section id="contact" className="py-20 section-bg-3 transition-colors duration-300">
      <div className="container mx-auto px-6">
        <motion.div 
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
        >
          <h2 className="text-4xl md:text-5xl font-bold mb-6 gradient-text">
            {t("contact.title")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto">
            {t("contact.subtitle")}
          </p>
        </motion.div>

        <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
          <motion.div 
            className="space-y-8"
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
          >
            {contactInfo.map((info, index) => (
              <motion.div
                key={index}
                className="glass-effect p-6 rounded-xl hover-3d"
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ scale: 1.02 }}
              >
                <div className="flex items-center mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${info.gradient} rounded-lg flex items-center justify-center mr-4 rtl:ml-4 rtl:mr-0`}>
                    <info.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {info.title}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300">
                      {info.value}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {info.description}
                </p>
              </motion.div>
            ))}
          </motion.div>

          <motion.div 
            className="glass-effect p-8 rounded-2xl hover-3d"
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
          >
            <h3 className="text-2xl font-bold mb-6 text-gray-900 dark:text-white">
              {t("contact.form_title")}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <Input
                  type="text"
                  placeholder={t("contact.name") as string}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Input
                  type="email"
                  placeholder={t("contact.email_address") as string}
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                  className="w-full"
                />
              </div>
              <div>
                <Select 
                  value={formData.projectType} 
                  onValueChange={(value) => setFormData({ ...formData, projectType: value })}
                  required
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder={t("contact.project_type") as string} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="realistic">{t("contact.realistic_option")}</SelectItem>
                    <SelectItem value="animation">{t("contact.animation_option")}</SelectItem>
                    <SelectItem value="pixar">{t("contact.pixar_option")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Textarea
                  placeholder={t("contact.message") as string}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  required
                  rows={4}
                  className="w-full resize-none"
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-accent text-white py-4 rounded-lg text-lg font-semibold hover:scale-105 transition-transform shadow-lg hover:shadow-xl"
              >
                {t("contact.send")}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </section>
  )
}
