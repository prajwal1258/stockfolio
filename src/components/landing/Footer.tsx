import { TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border bg-card/50">
      <div className="container mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <Link to="/" className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-display text-xl font-bold">StockFolio</span>
          </Link>
          
          <div className="flex items-center gap-8">
            <Link to="/login" className="text-muted-foreground hover:text-foreground transition-colors">
              Login
            </Link>
            <Link to="/signup" className="text-muted-foreground hover:text-foreground transition-colors">
              Sign Up
            </Link>
          </div>
          
          <p className="text-sm text-muted-foreground">
            © 2024 StockFolio. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
