import { Navigation } from "@/components/Navigation"
import { Hero } from "@/components/Hero"
import { About } from "@/components/About"
import { Portfolio } from "@/components/Portfolio"
import { Contact } from "@/components/Contact"
import { WhatsAppFloat } from "@/components/WhatsAppFloat"
import { AnimatedBackground } from "@/components/AnimatedBackground"
import { useLanguage } from "@/hooks/use-language"
import nehorLogo from "@assets/IMG_8249.png"

export default function Home() {
  const { t } = useLanguage()

  return (
    <div className="min-h-screen relative">
      <AnimatedBackground />
      <Navigation />
      <Hero />
      <About />
      <Portfolio />
      <Contact />
      
      {/* Footer */}
      <footer className="section-bg-2 text-foreground py-12">
        <div className="container mx-auto px-6">
          <div className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={nehorLogo} 
                alt="NEHORAI" 
                className="h-16 w-auto"
              />
            </div>
            <p className="text-gray-400 mb-6">
              {t("footer.subtitle")}
            </p>
            <div className="flex justify-center space-x-6 rtl:space-x-reverse mb-8">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-xl">
                <i className="fab fa-instagram"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-xl">
                <i className="fab fa-youtube"></i>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-xl">
                <i className="fab fa-linkedin"></i>
              </a>
              <a href="https://wa.me/972539320564" className="text-gray-400 hover:text-white transition-colors text-xl">
                <i className="fab fa-whatsapp"></i>
              </a>
            </div>
            <div className="border-t border-gray-800 pt-8">
              <p className="text-gray-500 text-sm">
                {t("footer.copyright")}
              </p>
            </div>
          </div>
        </div>
      </footer>

      <WhatsAppFloat />
    </div>
  )
}
