import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { generateQRCodeDataURL, createPrintableQRTag } from "@/lib/qr-utils";
import { useToast } from "@/hooks/use-toast";
import { Printer, Download } from "lucide-react";

interface QRCodeGeneratorProps {
  animalId: string;
  qrText: string;
}

export default function QRCodeGenerator({ animalId, qrText }: QRCodeGeneratorProps) {
  const [qrDataURL, setQrDataURL] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const generateQR = async () => {
      setIsGenerating(true);
      try {
        const dataURL = await generateQRCodeDataURL(qrText);
        setQrDataURL(dataURL);
      } catch (error) {
        console.error("Failed to generate QR code:", error);
      } finally {
        setIsGenerating(false);
      }
    };
    
    generateQR();
  }, [qrText]);

  const handlePrint = () => {
    if (!qrDataURL) {
      toast({
        title: "Print Failed",
        description: "QR code is still being generated. Please wait.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      createPrintableQRTag(animalId, qrDataURL);
      toast({
        title: "Print Started",
        description: "QR tag print dialog has been opened.",
      });
    } catch (error) {
      toast({
        title: "Print Failed",
        description: "Unable to open print dialog. Please check if popups are blocked.",
        variant: "destructive",
      });
    }
  };

  const handleDownload = () => {
    if (!qrDataURL) {
      toast({
        title: "Download Failed",
        description: "QR code is still being generated. Please wait.",
        variant: "destructive",
      });
      return;
    }
    
    try {
      const link = document.createElement('a');
      link.href = qrDataURL;
      link.download = `qr-tag-${animalId}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast({
        title: "Download Started",
        description: `QR tag saved as qr-tag-${animalId}.png`,
      });
    } catch (error) {
      toast({
        title: "Download Failed",
        description: "Unable to download QR code. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <Card className="w-full max-w-sm">
      <CardContent className="p-6 text-center">
        <div className="mb-4">
          {isGenerating ? (
            <div className="w-32 h-32 mx-auto border rounded-lg bg-gray-100 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <img 
              src={qrDataURL} 
              alt={`QR Code for ${animalId}`}
              className="w-32 h-32 mx-auto border rounded-lg"
            />
          )}
        </div>
        <div className="text-sm font-medium text-gray-900 mb-4">
          {animalId}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrint}
            disabled={isGenerating || !qrDataURL}
            className="flex-1"
          >
            <Printer className="h-4 w-4 mr-1" />
            Print
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleDownload}
            disabled={isGenerating || !qrDataURL}
            className="flex-1"
          >
            <Download className="h-4 w-4 mr-1" />
            Download
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
