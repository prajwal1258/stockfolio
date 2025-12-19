import { Button } from "@/components/ui/button";
import { TrendingUp, Shield, BarChart3 } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-hero">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-accent/10 rounded-full blur-3xl animate-float" style={{ animationDelay: '2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `linear-gradient(hsl(var(--border)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px)`,
          backgroundSize: '60px 60px'
        }}
      />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto text-center animate-slide-up">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass mb-8">
            <span className="w-2 h-2 bg-success rounded-full animate-pulse" />
            <span className="text-sm text-muted-foreground">Track your investments in real-time</span>
          </div>

          {/* Headline */}
          <h1 className="font-display text-5xl md:text-7xl font-bold mb-6 leading-tight">
            Master Your
            <span className="text-gradient"> Stock Portfolio</span>
          </h1>

          {/* Subheadline */}
          <p className="text-xl md:text-2xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed">
            Track, analyze, and optimize your investments with precision. 
            Buy and sell stocks while keeping your portfolio organized.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link to="/signup">
              <Button variant="hero" size="xl">
                Get Started Free
                <TrendingUp className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link to="/login">
              <Button variant="glass" size="xl">
                Sign In
              </Button>
            </Link>
          </div>

          {/* Feature Pills */}
          <div className="flex flex-wrap gap-4 justify-center">
            <FeaturePill icon={<BarChart3 className="w-4 h-4" />} text="Real-time Tracking" />
            <FeaturePill icon={<Shield className="w-4 h-4" />} text="Secure & Private" />
            <FeaturePill icon={<TrendingUp className="w-4 h-4" />} text="Smart Analytics" />
          </div>
        </div>
      </div>
    </section>
  );
};

const FeaturePill = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/50 border border-border/50">
    <span className="text-primary">{icon}</span>
    <span className="text-sm text-foreground">{text}</span>
  </div>
);

export default Hero;
