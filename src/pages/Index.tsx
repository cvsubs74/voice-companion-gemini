
import { Card, CardContent } from "@/components/ui/card";
import VoiceAssistantApp from "@/components/VoiceAssistantApp";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-accent/20 flex flex-col">
      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <Card className="w-full max-w-3xl h-[600px] md:h-[700px] overflow-hidden shadow-lg border-primary/10">
          <CardContent className="p-0 h-full">
            <VoiceAssistantApp />
          </CardContent>
        </Card>
        
        <footer className="mt-6 text-center text-sm text-muted-foreground">
          <p>
            Voice Assistant is a simulated demo. In a production app, this would connect to Vertex AI.
          </p>
        </footer>
      </main>
    </div>
  );
};

export default Index;
