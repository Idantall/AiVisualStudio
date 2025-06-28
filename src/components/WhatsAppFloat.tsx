import { motion } from "framer-motion"
import { useLanguage } from "@/hooks/use-language"
import { MessageCircle } from "lucide-react"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

export function WhatsAppFloat() {
  const { t } = useLanguage()

  const handleClick = () => {
    window.open("https://wa.me/972539320564", "_blank")
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          onClick={handleClick}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-green-500 hover:bg-green-600 text-white rounded-full flex items-center justify-center whatsapp-glow transition-all duration-300"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          animate={{ 
            y: [0, -5, 0],
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity, 
            ease: "easeInOut" 
          }}
        >
          <MessageCircle className="w-8 h-8" />
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="left" className="mb-2">
        <p>{t("whatsapp.tooltip")}</p>
      </TooltipContent>
    </Tooltip>
  )
}
