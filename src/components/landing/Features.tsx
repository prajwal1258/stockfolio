import { PieChart, ArrowUpDown, Bell, Lock, Smartphone, Zap } from "lucide-react";

const features = [
  {
    icon: <PieChart className="w-6 h-6" />,
    title: "Portfolio Overview",
    description: "Get a complete view of your holdings with real-time valuations and performance metrics."
  },
  {
    icon: <ArrowUpDown className="w-6 h-6" />,
    title: "Buy & Sell Tracking",
    description: "Log every transaction to maintain an accurate record of your investment history."
  },
  {
    icon: <Bell className="w-6 h-6" />,
    title: "Price Alerts",
    description: "Set custom alerts to get notified when stocks hit your target prices."
  },
  {
    icon: <Lock className="w-6 h-6" />,
    title: "Secure Data",
    description: "Your financial data is encrypted and protected with enterprise-grade security."
  },
  {
    icon: <Smartphone className="w-6 h-6" />,
    title: "Mobile Friendly",
    description: "Access your portfolio anywhere, anytime with our responsive design."
  },
  {
    icon: <Zap className="w-6 h-6" />,
    title: "Fast & Reliable",
    description: "Lightning-fast performance ensures you never miss a market opportunity."
  }
];

const Features = () => {
  return (
    <section className="py-24 bg-background relative">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/5 to-transparent" />
      
      <div className="container mx-auto px-6 relative z-10">
        <div className="text-center mb-16 animate-fade-in">
          <h2 className="font-display text-4xl md:text-5xl font-bold mb-4">
            Everything You Need to
            <span className="text-gradient"> Succeed</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Powerful features designed to help you make smarter investment decisions.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureCard key={index} {...feature} delay={index * 100} />
          ))}
        </div>
      </div>
    </section>
  );
};

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  delay 
}: { 
  icon: React.ReactNode; 
  title: string; 
  description: string;
  delay: number;
}) => (
  <div 
    className="group p-6 rounded-2xl glass hover:bg-card/90 transition-all duration-300 hover:shadow-glow hover:-translate-y-1"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-12 h-12 rounded-xl bg-gradient-primary flex items-center justify-center text-primary-foreground mb-4 group-hover:scale-110 transition-transform duration-300">
      {icon}
    </div>
    <h3 className="font-display text-xl font-semibold mb-2">{title}</h3>
    <p className="text-muted-foreground leading-relaxed">{description}</p>
  </div>
);

export default Features;
