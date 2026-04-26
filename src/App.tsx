import React, { useState, useEffect } from "react";
import { 
  Search, 
  History, 
  User, 
  LogOut, 
  Film, 
  Star, 
  ChevronDown, 
  Loader2, 
  Check, 
  Plus,
  Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { auth, db, googleProvider } from "./lib/firebase";
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  User as FirebaseUser 
} from "firebase/auth";
import { 
  doc, 
  setDoc, 
  getDoc, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  limit, 
  getDocs,
  serverTimestamp 
} from "firebase/firestore";
import { getMovieRecommendations, MovieRecommendation } from "./services/geminiService";
import { cn } from "./lib/utils";

const GENRES = [
  "Action", "Comedy", "Drama", "Sci-Fi", "Horror", "Romance", 
  "Thriller", "Documentary", "Animation", "Fantasy", "Mystery"
];

const MOODS = ["Happy", "Dark", "Exciting", "Thought-provoking", "Romantic"];
const LANGUAGES = ["English", "Spanish", "French", "Japanese", "Korean", "Hindi"];

export default function App() {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [query_input, setQueryInput] = useState("");
  const [results, setResults] = useState<MovieRecommendation[]>([]);
  const [filters, setFilters] = useState({ genre: "", mood: "", language: "" });
  const [history, setHistory] = useState<any[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [trending, setTrending] = useState<any[]>([]);

  useEffect(() => {
    // Fetch trending from backend
    fetch("/api/trending")
      .then(res => res.json())
      .then(data => setTrending(data))
      .catch(err => console.error("Error fetching trending:", err));

    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u);
      setLoading(false);
      if (u) {
        await setDoc(doc(db, "users", u.uid), {
          email: u.email,
        }, { merge: true });
        fetchHistory(u.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
  };

  const logout = () => signOut(auth);

  const fetchHistory = async (uid: string) => {
    const q = query(
      collection(db, "users", uid, "interactions"), 
      orderBy("timestamp", "desc"), 
      limit(20)
    );
    const snap = await getDocs(q);
    setHistory(snap.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  const saveInteraction = async (type: string, data: any) => {
    if (!user) return;
    await addDoc(collection(db, "users", user.uid, "interactions"), {
      userId: user.uid,
      type,
      timestamp: serverTimestamp(),
      ...data
    });
    fetchHistory(user.uid);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!query_input.trim() && !filters.genre) return;

    setSearching(true);
    setResults([]);
    
    const preferencesData = history
      .filter(h => h.type === 'search')
      .map(h => h.query)
      .slice(0, 5)
      .join(", ");

    const recommendations = await getMovieRecommendations(
      query_input, 
      preferencesData, 
      filters
    );

    setResults(recommendations);
    setSearching(false);

    // Backend Connection: Log recommendations
    fetch("/api/log-recommendation", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        userId: user?.uid, 
        query: query_input, 
        resultsCount: recommendations.length 
      })
    }).catch(console.error);

    if (user && query_input.trim()) {
      saveInteraction('search', { query: query_input, filters });
      
      // Backend Connection: Save genre preference tracking
      if (filters.genre) {
        fetch("/api/save-preference", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: user.uid, genre: filters.genre, count: 1 })
        }).catch(console.error);
      }
    }
  };

  const handleMovieClick = (movie: MovieRecommendation) => {
    if (user) {
      saveInteraction('click', { 
        movieTitle: movie.title, 
        genres: [movie.genre] 
      });
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-full flex items-center justify-center bg-[#0A0A0A]">
        <Loader2 className="w-12 h-12 text-[#C5A059] animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-[#0A0A0A] text-[#E0E0E0] selection:bg-[#C5A059]/30">
      {/* Sidebar */}
      <aside className="w-[320px] border-right border-[#222] p-10 flex flex-col sticky top-0 h-screen">
        <div className="mb-12">
          <div className="editorial-title text-4xl text-[#C5A059] mb-8">
            CineAI
          </div>

          <div className="space-y-10">
            {/* Search */}
            <div>
              <span className="label-caps mb-3 block italic">Describe your mood</span>
              <input 
                type="text"
                placeholder="e.g. Neo-noir in rain..."
                className="query-input"
                value={query_input}
                onChange={(e) => setQueryInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            {/* Filters */}
            <div className="space-y-6">
              <div className="filter-item">
                <span className="label-caps mb-2 block">Genre</span>
                <select 
                  className="filter-select"
                  value={filters.genre}
                  onChange={(e) => setFilters({...filters, genre: e.target.value})}
                >
                  <option value="">Select Genre</option>
                  {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <span className="label-caps mb-2 block">Mood</span>
                <select 
                  className="filter-select"
                  value={filters.mood}
                  onChange={(e) => setFilters({...filters, mood: e.target.value})}
                >
                  <option value="">Select Mood</option>
                  {MOODS.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>

              <div className="filter-item">
                <span className="label-caps mb-2 block">Language</span>
                <select 
                  className="filter-select"
                  value={filters.language}
                  onChange={(e) => setFilters({...filters, language: e.target.value})}
                >
                  <option value="">Select Language</option>
                  {LANGUAGES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
            </div>

            <button 
              onClick={() => handleSearch()}
              disabled={searching}
              className="w-full bg-[#C5A059] hover:bg-[#B38D45] text-black font-semibold py-3 text-xs uppercase tracking-widest transition-all border-none cursor-pointer flex items-center justify-center gap-2"
            >
              {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-3 h-3 fill-current" />}
              {searching ? "Curation in progress..." : "Refresh Recommendations"}
            </button>
          </div>
        </div>

        {/* User Profile / Auth */}
        <div className="mt-auto pt-8 border-t border-[#222]">
          {user ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full overflow-hidden border border-[#C5A059]/50">
                  <img src={user.photoURL || ""} alt="Avatar" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                </div>
                <div>
                  <div className="text-[0.85rem] font-medium text-white truncate max-w-[140px]">{user.displayName}</div>
                  <div className="label-caps text-[9px]">Pro Member</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => setShowHistory(true)}
                  className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-white transition-colors"
                >
                  <History className="w-4 h-4" />
                </button>
                <button onClick={logout} className="p-1.5 hover:bg-white/5 rounded text-white/40 hover:text-red-500 transition-colors">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={login}
              className="w-full border border-[#C5A059] text-[#C5A059] py-3 text-xs uppercase tracking-widest font-semibold hover:bg-[#C5A059] hover:text-black transition-all"
            >
              Sign In to Personalize
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 lg:p-14 overflow-y-auto h-screen bg-gradient-to-br from-[#0A0A0A] to-[#111]">
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-baseline mb-12">
            <h2 className="editorial-title text-6xl font-normal leading-none text-white">
              Curated Picks
            </h2>
            <div className="font-serif italic text-[#666] text-sm">
              {results.length > 0 ? `Displaying ${results.length} results crafted for you` : "Discover the art of cinema"}
            </div>
          </div>

          {/* Results Grid */}
          <div className="movie-grid">
            <AnimatePresence mode="popLayout">
              {results.length > 0 ? (
                results.map((movie, idx) => (
                  <motion.div
                    key={movie.title + idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ delay: idx * 0.08 }}
                    className="movie-card"
                    onClick={() => handleMovieClick(movie)}
                  >
                    <div className="relative mb-6 group overflow-hidden">
                      <img 
                        src={`https://picsum.photos/seed/${movie.title.replace(/\s/g, '')}/600/400`}
                        className="w-full aspect-video object-cover grayscale brightness-75 transition-all duration-700 group-hover:grayscale-0 group-hover:brightness-100 group-hover:scale-105"
                        alt={movie.title}
                        referrerPolicy="no-referrer"
                      />
                      {idx === 0 && (
                        <div className="absolute top-4 right-4 text-[10px] text-[#C5A059] border border-[#C5A059] px-2 py-0.5 uppercase tracking-widest bg-black/50 backdrop-blur-sm">
                          Top Match
                        </div>
                      )}
                    </div>
                    
                    <div className="font-serif italic text-sm text-[#C5A059] mb-1">
                      {movie.releaseYear}
                    </div>
                    <h3 className="font-serif text-2xl font-normal text-white mb-3 tracking-tight group-hover:text-[#C5A059] transition-colors">
                      {movie.title}
                    </h3>
                    <p className="text-[#AAA] text-[0.85rem] leading-relaxed mb-4 line-clamp-3 font-light">
                      {movie.description}
                    </p>
                    
                    <div className="flex gap-2 flex-wrap">
                      {movie.genre.split(',').map(tag => (
                        <span key={tag} className="text-[10px] bg-[#1a1a1a] px-2 py-1 uppercase tracking-widest text-[#888] font-medium border border-[#222]">
                          {tag.trim()}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                ))
              ) : (
                /* Trending fallback from Backend */
                trending.map((movie, idx) => (
                  <motion.div
                    key={movie.title + idx}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="movie-card opacity-60 hover:opacity-100"
                  >
                    <div className="font-serif italic text-sm text-[#C5A059] mb-1">
                      Trending • {movie.year}
                    </div>
                    <h3 className="font-serif text-2xl font-normal text-white mb-3">
                      {movie.title}
                    </h3>
                    <p className="text-[#666] text-[0.85rem]">
                      Discover this top-rated classic.
                    </p>
                    <div className="mt-4 flex gap-2">
                       {movie.genre.split(',').map((g: string) => (
                         <span key={g} className="text-[9px] uppercase tracking-widest text-[#444] border border-[#222] px-2 py-0.5">{g.trim()}</span>
                       ))}
                    </div>
                  </motion.div>
                ))
              )}
            </AnimatePresence>
          </div>

          {results.length === 0 && !searching && (
            <div className="flex flex-col items-center justify-center h-[50vh] text-center opacity-20">
               <Film className="w-24 h-24 mb-6 stroke-1" />
               <p className="font-serif italic text-3xl mb-2">Cinema awaits your influence</p>
               <p className="label-caps">Describe a vibe in the sidebar to begin</p>
            </div>
          )}

          {/* Curated Strip */}
          {results.length > 0 && (
            <div className="mt-20 border-t border-[#222] pt-8 flex items-center justify-between">
              <div className="font-serif italic text-lg text-white font-light">
                Based on your affinity for <u className="decoration-[#C5A059]/50 underline-offset-4 pointer-events-none">Complex Narratives</u> and <u className="decoration-[#C5A059]/50 underline-offset-4 pointer-events-none">Cinematic Atmosphere</u>
              </div>
              <div className="label-caps text-[10px]">CineAI Algorithm v.3.1</div>
            </div>
          )}
        </div>
      </main>

      {/* History Slide-over */}
      <AnimatePresence>
        {showHistory && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowHistory(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100]"
            />
            <motion.div 
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed right-0 top-0 h-full w-full max-w-md bg-[#0A0A0A] border-l border-[#222] z-[101] shadow-2xl flex flex-col"
            >
              <div className="p-10 border-b border-[#222] flex items-center justify-between">
                <h3 className="editorial-title text-2xl text-white">Archives</h3>
                <button onClick={() => setShowHistory(false)} className="text-[#666] hover:text-white transition-colors">
                  <ChevronDown className="rotate-270 w-8 h-8" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-10 space-y-8 scrollbar-hide">
                {history.length === 0 && <p className="text-[#666] font-serif italic text-center">Your cinematic journey is just beginning.</p>}
                {history.map((item) => (
                  <div key={item.id} className="group border-b border-[#111] pb-6">
                    <div className="flex justify-between items-start mb-2">
                       <span className="label-caps text-[9px] text-[#C5A059]">{item.type}</span>
                       <span className="font-serif italic text-[10px] text-[#444]">
                        {item.timestamp?.toDate().toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
                      </span>
                    </div>
                    <p className="text-white text-lg font-light group-hover:text-[#C5A059] transition-colors cursor-pointer">
                      {item.type === 'search' ? item.query : item.movieTitle}
                    </p>
                    {item.filters?.genre && (
                      <span className="text-[10px] text-[#666] mt-2 block">{item.filters.genre} • {item.filters.mood || 'Standard Mood'}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

