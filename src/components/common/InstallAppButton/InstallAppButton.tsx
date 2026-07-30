import { useState } from 'react'
import { Download, Share, Smartphone, X } from 'lucide-react'
import { Button, Modal } from '@/components/ui'
import { usePwaInstall } from '@/hooks/usePwaInstall'

export function InstallAppButton({ className }: { className?: string }) {
  const { canInstall, isInstalled, isIos, hasNativePrompt, install } = usePwaInstall()
  const [showIosGuide, setShowIosGuide] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  if (isInstalled || !canInstall) {
    return null
  }

  const handleClick = async () => {
    if (hasNativePrompt) {
      setIsInstalling(true)
      try {
        await install()
      } finally {
        setIsInstalling(false)
      }
      return
    }

    if (isIos) {
      setShowIosGuide(true)
    }
  }

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className={className}
        isLoading={isInstalling}
        onClick={handleClick}
      >
        <Download className="size-4" />
        <span className="hidden sm:inline">Instalar app</span>
        <span className="sm:hidden">Instalar</span>
      </Button>

      <Modal
        open={showIosGuide}
        onClose={() => {
          setShowIosGuide(false)
        }}
        title="Instalar no iPhone"
        size="sm"
      >
        <div className="space-y-4 text-sm text-muted-foreground">
          <p>Como no Suflex, você instala pelo Safari sem App Store:</p>
          <ol className="list-decimal space-y-2 pl-5">
            <li className="flex items-start gap-2">
              <Share className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>Toque em <strong className="text-foreground">Compartilhar</strong> (ícone na barra inferior)</span>
            </li>
            <li className="flex items-start gap-2">
              <Smartphone className="mt-0.5 size-4 shrink-0 text-accent" />
              <span>Escolha <strong className="text-foreground">Adicionar à Tela de Início</strong></span>
            </li>
            <li>Toque em <strong className="text-foreground">Adicionar</strong></li>
          </ol>
          <Button
            type="button"
            className="w-full"
            onClick={() => {
              setShowIosGuide(false)
            }}
          >
            <X className="size-4" />
            Entendi
          </Button>
        </div>
      </Modal>
    </>
  )
}
