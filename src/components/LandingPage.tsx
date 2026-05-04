import React from "react";
import { Film, Play } from "lucide-react";
import { motion } from "motion/react";

interface LandingPageProps {
  onLogin: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
  return (
    <div className="min-h-screen bg-[#0A0A0A] flex items-center justify-center p-6 sm:p-12 relative overflow-hidden">
      {/* Background purely aesthetic */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-[#C5A059] blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-[#C5A059] blur-[120px]" />
      </div>

      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-12 items-center relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8 }}
        >
          <div className="flex items-center gap-2 mb-8">
            <div className="bg-[#C5A059] p-2">
              <Film className="text-black w-6 h-6" />
            </div>
            <h1 className="editorial-title text-4xl text-[#C5A059]">CineAI</h1>
          </div>

          <h2 className="editorial-title text-6xl sm:text-7xl font-normal leading-[0.9] text-white mb-8">
            The Art of <br />
            <span className="italic">Discovery</span>
          </h2>

          <p className="text-[#AAA] text-lg mb-10 leading-relaxed font-light max-w-sm">
            A curated experience powered by intelligence. Discover cinema that moves you, based on your unique atmosphere.
          </p>

          <div className="space-y-4">
            <button
              onClick={onLogin}
              className="group relative inline-flex items-center gap-3 bg-[#C5A059] hover:bg-[#B38D45] text-black font-semibold px-10 py-5 text-sm uppercase tracking-[0.2em] transition-all"
            >
              Connect with Google
              <Play className="w-3 h-3 fill-current transition-transform group-hover:translate-x-1" />
            </button>
            
            <div className="pt-4 flex items-center gap-4 text-[#444] text-[10px] uppercase tracking-[0.2em]">
              <span>Search History</span>
              <span>•</span>
              <span>Predictive Curation</span>
              <span>•</span>
              <span>Archives</span>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
          className="relative aspect-[3/4] overflow-hidden"
        >
          <img
            src="https://images.unsplash.com/photo-1536440136628-849c177e76a1?auto=format&fit=crop&q=80&w=1025&ixlib=rb-4.0.3"
            alt="Cinematic mood"
            className="w-full h-full object-cover grayscale brightness-50"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 border border-white/5" />
          <div className="absolute bottom-6 right-6 text-[10px] text-[#C5A059]/50 italic">
            Visual Curation v3.1
          </div>
        </motion.div>
      </div>
      
      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-8 opacity-20">
        <span className="label-caps text-[8px]">Intelligence</span>
        <span className="label-caps text-[8px]">Cinematic Architecture</span>
        <span className="label-caps text-[8px]">Machine Art</span>
      </div>
    </div>
  );
};
