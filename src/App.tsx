import React, { useState, useEffect, FormEvent, useRef, Component } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate, useLocation } from 'react-router-dom';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Globe, 
  Code, 
  Palette, 
  Video, 
  Megaphone, 
  ExternalLink, 
  ChevronRight, 
  ChevronLeft,
  Github, 
  Linkedin, 
  Facebook, 
  Instagram,
  Menu,
  X,
  Briefcase,
  GraduationCap,
  Languages,
  Send,
  Plus,
  Trash2,
  Maximize2,
  LogOut,
  LogIn,
  Image as ImageIcon,
  Loader2,
  Upload,
  Film,
  Edit,
  Check
} from 'lucide-react';
import { 
  db, 
  auth, 
  storage,
  googleProvider, 
  signInWithPopup, 
  signOut, 
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  deleteDoc, 
  updateDoc,
  doc, 
  serverTimestamp,
  ref,
  uploadBytesResumable,
  getDownloadURL
} from './firebase';

// --- Types ---
// --- Types ---
enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData.map(provider => ({
        providerId: provider.providerId,
        displayName: provider.displayName,
        email: provider.email,
        photoUrl: provider.photoURL
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  errorInfo: string | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState;
  public props: ErrorBoundaryProps;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, errorInfo: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, errorInfo: error.message };
  }

  render() {
    if (this.state.hasError) {
      let displayMessage = "Something went wrong.";
      try {
        const parsed = JSON.parse(this.state.errorInfo || "");
        if (parsed.error && parsed.error.includes("permission-denied")) {
          displayMessage = "Access Denied: You don't have permission to view this content.";
        }
      } catch (e) {
        // Not JSON, use default
      }

      return (
        <div className="min-h-screen bg-black flex items-center justify-center p-6 text-center">
          <div className="max-w-md p-8 rounded-2xl bg-zinc-900 border border-red-500/20">
            <X className="text-red-500 mx-auto mb-4" size={48} />
            <h2 className="text-xl font-bold text-white mb-2">Application Error</h2>
            <p className="text-gray-400 mb-6">{displayMessage}</p>
            <button 
              onClick={() => window.location.reload()}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold"
            >
              Retry
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

const CATEGORIES = [
  "Graphics",
  "Website Designs/Web Apps",
  "Videos"
];

interface GalleryItem {
  id: string;
  url: string;
  type: 'image' | 'video';
  category?: string;
  description?: string;
  createdAt: any;
  authorUid: string;
}

interface Experience {
  year: string;
  company: string;
  role: string;
  description: string[];
}

// --- Data ---
const EXPERIENCES: Experience[] = [
  {
    year: "2024 - 2026",
    company: "D2D Experts & Lucent Energy",
    role: "Graphic Designer",
    description: [
      "Designing and producing a wide range of digital and physical graphics.",
      "Independently owning and managing a clothing brand, overseeing all editing and complex printing requirements for creative production."
    ]
  },
  {
    year: "2022 - 2024",
    company: "JRC Visa Consultancy & Immigration Services Inc.",
    role: "Social Media & Web Specialist",
    description: [
      "In-charge of Social Media accounts (Facebook, Google & YouTube).",
      "Creating contents for posting and shooting videos for YT Channel.",
      "Creating and moderating the company's website.",
      "Getting leads, SEO, and doing digital/traditional marketing campaigns.",
      "Designing brochures, flyers, and preparing Social Media Ads."
    ]
  },
  {
    year: "2020 - 2022",
    company: "Ramen Ao | Skyny Lab",
    role: "Video and Events Marketing Officer",
    description: [
      "In-charge of taking videos and editing them for YouTube Vlogs.",
      "Making marketing activities/campaigns and handling social media accounts."
    ]
  },
  {
    year: "2017 - 2020",
    company: "Freelance",
    role: "Photographer and Videographer",
    description: [
      "Professional coverage for events such as Weddings, Debuts, Birthdays, and more."
    ]
  }
];

const SKILLS = [
  "Photo and Video Editor",
  "Graphics Design",
  "Social Media Moderation",
  "FB and Google ADS",
  "Email Marketing",
  "Web Developing (Wordpress Elementor/Squarespace)",
  "HTML",
  "CSS",
  "JS"
];

const LANGUAGES = ["English", "Filipino", "Bisaya / Cebuano"];

// --- Components ---

const Nav = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAdminPage = location.pathname === '/admin';

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { name: 'About', href: '/#about' },
    { name: 'Projects', href: '/#projects' },
    { name: 'Experience', href: '/#experience' },
    { name: 'Skills', href: '/#skills' },
    { name: 'Contact', href: '/#contact' },
  ];

  if (isAdminPage) return null;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? 'bg-black/80 backdrop-blur-md py-4 border-b border-blue-500/20' : 'bg-transparent py-6'}`}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold tracking-tighter text-white group">
          MARCO<span className="text-blue-500 group-hover:text-blue-400 transition-colors">.</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center space-x-8">
          {navLinks.map((link) => (
            <a 
              key={link.name} 
              href={link.href} 
              className="text-sm font-medium text-gray-400 hover:text-blue-500 transition-colors uppercase tracking-widest"
            >
              {link.name}
            </a>
          ))}
          <a 
            href="#contact" 
            className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest rounded-full transition-all hover:scale-105 active:scale-95 shadow-[0_0_15px_rgba(59,130,246,0.5)]"
          >
            Hire Me
          </a>
        </div>

        {/* Mobile Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="absolute top-full left-0 right-0 bg-black border-b border-blue-500/20 p-6 md:hidden"
          >
            <div className="flex flex-col space-y-4">
              {navLinks.map((link) => (
                <a 
                  key={link.name} 
                  href={link.href} 
                  className="text-lg font-medium text-gray-400 hover:text-blue-500 transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {link.name}
                </a>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

const Hero = () => {
  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-2 gap-12 items-center">
        <motion.div 
          initial={{ opacity: 0, x: -50 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="inline-block px-4 py-1 rounded-full border border-blue-500/30 bg-blue-500/10 text-blue-400 text-xs font-bold uppercase tracking-widest mb-6">
            Available for Freelance
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-8xl font-black text-white leading-none mb-6 tracking-tighter">
            MARCO<br />
            <span className="text-blue-500">ANTILIGANDO</span>
          </h1>
          <div className="flex flex-wrap gap-y-3 gap-x-4 mb-8">
            {["DIGITAL MARKETING", "GRAPHICS EDITOR", "WEB DEVELOPER", "VIRTUAL ASSISTANT"].map((title) => (
              <span key={title} className="flex items-center text-[10px] md:text-xs font-bold text-gray-500 md:border-r border-gray-800 md:last:border-0 md:pr-3">
                <span className="w-1 h-1 bg-blue-500 rounded-full mr-2 md:hidden"></span>
                {title}
              </span>
            ))}
          </div>
          <p className="text-gray-400 text-base md:text-lg max-w-lg mb-10 leading-relaxed">
            A proficient digital marketer with expertise in designing and developing websites/landing pages.
          </p>
          <div className="flex flex-wrap gap-4">
            <a 
              href="#projects" 
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-lg transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.6)] flex items-center gap-2"
            >
              View Gallery <ChevronRight size={18} />
            </a>
            <div className="flex items-center gap-4 px-4">
              <a href="https://web.facebook.com/McCoii16" className="text-gray-500 hover:text-blue-500 transition-colors"><Facebook size={20} /></a>
              <a href="https://www.instagram.com/macoypg/" className="text-gray-500 hover:text-blue-500 transition-colors"><Instagram size={20} /></a>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.8 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="relative flex justify-center"
        >
          <div className="relative w-72 h-72 md:w-96 md:h-96">
            {/* Circular Frame with Orange/Yellow Background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-orange-500 to-yellow-400 p-2 shadow-[0_0_50px_rgba(249,115,22,0.3)]">
              <div className="w-full h-full rounded-full bg-black overflow-hidden border-4 border-black">
                <img 
                  src="https://i.ibb.co/hFVr2g84/unnamed-5.jpg?q=80&w=800&auto=format&fit=crop" 
                  alt="Marco Antiligando" 
                  className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700 scale-110"
                  referrerPolicy="no-referrer"
                />
              </div>
            </div>
            {/* Decorative Elements */}
            <div className="absolute -top-4 -right-4 w-24 h-24 border-t-2 border-r-2 border-blue-500 rounded-tr-3xl" />
            <div className="absolute -bottom-4 -left-4 w-24 h-24 border-b-2 border-l-2 border-blue-500 rounded-bl-3xl" />
          </div>
        </motion.div>
      </div>
    </section>
  );
};

const About = () => {
  return (
    <section id="about" className="py-24 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-12">
          <div className="md:col-span-1">
            <h2 className="text-4xl font-bold text-white mb-6 flex items-center gap-4">
              <span className="w-12 h-[2px] bg-blue-500"></span>
              About Me
            </h2>
            <p className="text-blue-500 font-mono text-sm uppercase tracking-widest mb-4">Who I am</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-gray-300 text-lg md:text-xl leading-relaxed mb-8">
              "A proficient digital marketer with expertise in designing and developing websites/landing pages."
            </p>
            <div className="grid sm:grid-cols-2 gap-6">
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Mail size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Email</p>
                  <p className="text-white text-sm">martiligando@gmail.com</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Phone size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Phone</p>
                  <p className="text-white text-sm">+63 945 124 2399</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <MapPin size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Location</p>
                  <p className="text-white text-sm">Cebu City, Philippines 6000</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-500">
                  <Languages size={20} />
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Languages</p>
                  <p className="text-white text-sm">{LANGUAGES.join(", ")}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// --- Gallery Component ---
const Gallery = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [visibleCount, setVisibleCount] = useState(9);
  const [selectedItemIndex, setSelectedItemIndex] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  const filteredItems = activeCategory === "All" 
    ? items 
    : items.filter(item => item.category === activeCategory);

  useEffect(() => {
    const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const galleryData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as GalleryItem[];
      setItems(galleryData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'gallery');
    });
    return () => unsubscribe();
  }, []);

  const handleNext = () => {
    if (selectedItemIndex !== null) {
      setSelectedItemIndex((selectedItemIndex + 1) % filteredItems.length);
    }
  };

  const handlePrev = () => {
    if (selectedItemIndex !== null) {
      setSelectedItemIndex((selectedItemIndex - 1 + filteredItems.length) % filteredItems.length);
    }
  };

  return (
    <section id="projects" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Project Gallery</h2>
            <p className="text-gray-500 max-w-md">A visual collection of my works across digital marketing, graphics, and web development.</p>
          </div>
          <div className="text-blue-500 font-mono text-sm uppercase tracking-widest">Portfolio</div>
        </div>

        {/* Category Filters */}
        <div className="flex flex-wrap gap-4 mb-12">
          {["All", ...CATEGORIES].map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setActiveCategory(cat);
                setVisibleCount(9);
              }}
              className={`px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest transition-all border ${
                activeCategory === cat 
                  ? "bg-blue-600 border-blue-600 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)]" 
                  : "bg-transparent border-white/10 text-gray-500 hover:border-white/30 hover:text-white"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="text-blue-500 animate-spin" size={40} />
          </div>
        ) : (
          <>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {filteredItems.slice(0, visibleCount).map((item, index) => (
                  <motion.div 
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: (index % 3) * 0.1 }}
                    className="group relative aspect-square overflow-hidden rounded-xl bg-zinc-900 cursor-pointer"
                    onClick={() => setSelectedItemIndex(index)}
                  >
                    {item.type === 'video' ? (
                      <div className="w-full h-full relative">
                        <video 
                          src={item.url} 
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute top-4 right-4 p-2 bg-black/50 rounded-full">
                          <Film size={16} className="text-white" />
                        </div>
                      </div>
                    ) : (
                      <img 
                        src={item.url} 
                        alt={item.category || "Gallery Item"} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-center items-center p-6 text-center">
                      <Maximize2 className="text-white mb-4" size={32} />
                      {item.category && <h3 className="text-white font-bold text-lg mb-1">{item.category}</h3>}
                      {item.description && <p className="text-gray-300 text-xs line-clamp-2">{item.description}</p>}
                    </div>
                  </motion.div>
                ))}
              </div>

            {visibleCount < filteredItems.length && (
              <div className="mt-12 text-center">
                <button 
                  onClick={() => setVisibleCount(prev => prev + 9)}
                  className="px-8 py-4 border border-blue-500/30 hover:bg-blue-500/10 text-blue-500 font-bold uppercase tracking-widest rounded-lg transition-all"
                >
                  Show More
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Lightbox */}
      <AnimatePresence>
        {selectedItemIndex !== null && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 md:p-10"
          >
            <button 
              className="absolute top-6 right-6 text-white hover:text-blue-500 transition-colors z-50"
              onClick={() => setSelectedItemIndex(null)}
            >
              <X size={32} />
            </button>

            <button 
              className="absolute left-4 md:left-10 text-white hover:text-blue-500 transition-colors z-50"
              onClick={handlePrev}
            >
              <ChevronLeft size={48} />
            </button>

            <button 
              className="absolute right-4 md:right-10 text-white hover:text-blue-500 transition-colors z-50"
              onClick={handleNext}
            >
              <ChevronRight size={48} />
            </button>

            <div className="relative w-full h-full flex flex-col items-center justify-center">
              {filteredItems[selectedItemIndex].type === 'video' ? (
                <motion.video 
                  key={filteredItems[selectedItemIndex].id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  src={filteredItems[selectedItemIndex].url} 
                  controls
                  autoPlay
                  className="max-w-full max-h-[80vh] shadow-2xl rounded-lg"
                />
              ) : (
                <motion.img 
                  key={filteredItems[selectedItemIndex].id}
                  initial={{ opacity: 0, x: 100 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -100 }}
                  src={filteredItems[selectedItemIndex].url} 
                  alt={filteredItems[selectedItemIndex].category || "Full Screen"} 
                  className="max-w-full max-h-[80vh] object-contain shadow-2xl"
                  referrerPolicy="no-referrer"
                />
              )}

              <div className="mt-8 text-center max-w-2xl">
                {filteredItems[selectedItemIndex].category && <h3 className="text-2xl font-bold text-white mb-2">{filteredItems[selectedItemIndex].category}</h3>}
                {filteredItems[selectedItemIndex].description && <p className="text-gray-400">{filteredItems[selectedItemIndex].description}</p>}
                <p className="text-gray-600 text-xs mt-4 font-mono">{selectedItemIndex + 1} / {filteredItems.length}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

// --- Admin Component ---
const Admin = () => {
  const [user, setUser] = useState<any>(null);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [formData, setFormData] = useState({ category: CATEGORIES[0], description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editFormData, setEditFormData] = useState({ category: '', description: '' });
  const [selectedFiles, setSelectedFiles] = useState<FileList | null>(null);
  const [loginMethod, setLoginMethod] = useState<'google' | 'email'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      if (u) {
        setUser(u);
      } else {
        setUser(null);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (user) {
      const q = query(collection(db, 'gallery'), orderBy('createdAt', 'desc'));
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const galleryData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as GalleryItem[];
        setItems(galleryData);
        setLoading(false);
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, 'gallery');
      });
      return () => unsubscribe();
    }
  }, [user]);

  const handleGoogleLogin = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setAuthError(error.message);
      console.error("Login failed", error);
    }
  };

  const handleEmailLogin = async (e: FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error: any) {
      setAuthError(error.message);
      console.error("Email login failed", error);
    }
  };

  const handleUpload = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedFiles || selectedFiles.length === 0) return;

    setUploading(true);
    setUploadProgress(0);

    try {
      const totalFiles = selectedFiles.length;
      let completedFiles = 0;

      for (let i = 0; i < totalFiles; i++) {
        const file = selectedFiles[i];
        const fileType = file.type.startsWith('video/') ? 'video' : 'image';
        const storageRef = ref(storage, `gallery/${Date.now()}_${file.name}`);
        const uploadTask = uploadBytesResumable(storageRef, file);

        await new Promise<void>((resolve, reject) => {
          uploadTask.on('state_changed', 
            (snapshot) => {
              const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
              // This is per-file progress, we could calculate overall progress
              const overallProgress = ((completedFiles + (progress / 100)) / totalFiles) * 100;
              setUploadProgress(overallProgress);
            }, 
            (error) => reject(error), 
            async () => {
              const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
              await addDoc(collection(db, 'gallery'), {
                url: downloadURL,
                type: fileType,
                category: formData.category,
                description: formData.description,
                createdAt: serverTimestamp(),
                authorUid: user.uid
              });
              completedFiles++;
              setUploadProgress((completedFiles / totalFiles) * 100);
              resolve();
            }
          );
        });
      }

      setFormData({ category: CATEGORIES[0], description: '' });
      setSelectedFiles(null);
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) fileInput.value = '';
      
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'gallery');
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      await updateDoc(doc(db, 'gallery', id), {
        category: editFormData.category,
        description: editFormData.description
      });
      setEditingId(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `gallery/${id}`);
    }
  };

  const startEditing = (item: GalleryItem) => {
    setEditingId(item.id);
    setEditFormData({
      category: item.category || CATEGORIES[0],
      description: item.description || ''
    });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      try {
        await deleteDoc(doc(db, 'gallery', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `gallery/${id}`);
      }
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center p-12 rounded-3xl bg-zinc-900 border border-white/10 shadow-2xl">
          <div className="w-20 h-20 bg-blue-500/20 rounded-full flex items-center justify-center text-blue-500 mx-auto mb-8">
            <Briefcase size={40} />
          </div>
          <h1 className="text-3xl font-bold text-white mb-4 tracking-tighter">Admin Dashboard</h1>
          <p className="text-gray-500 mb-8">Sign in to manage your gallery.</p>
          
          <div className="flex bg-black/50 p-1 rounded-xl mb-8 border border-white/5">
            <button 
              onClick={() => setLoginMethod('google')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${loginMethod === 'google' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Google
            </button>
            <button 
              onClick={() => setLoginMethod('email')}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase tracking-widest transition-all ${loginMethod === 'email' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Email
            </button>
          </div>

          {authError && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-500 text-xs text-left">
              {authError}
            </div>
          )}

          {loginMethod === 'google' ? (
            <button 
              onClick={handleGoogleLogin}
              className="w-full py-4 bg-white text-black font-bold uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-all flex items-center justify-center gap-3"
            >
              <LogIn size={20} /> Sign In with Google
            </button>
          ) : (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Email Address</label>
                <input 
                  type="email" 
                  required
                  placeholder="admin@example.com"
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="space-y-2 text-left">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-500 ml-1">Password</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-black border border-white/10 rounded-xl text-white focus:border-blue-500 outline-none transition-colors text-sm"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <button 
                type="submit"
                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <LogIn size={20} /> Sign In
              </button>
            </form>
          )}

          <Link to="/" className="inline-block mt-8 text-gray-500 hover:text-white transition-colors text-sm">Back to Portfolio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-gray-300 p-6 md:p-12">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black text-white tracking-tighter mb-2">GALLERY <span className="text-blue-500">MANAGER</span></h1>
            <p className="text-gray-500">Welcome back, {user.displayName}</p>
          </div>
          <div className="flex gap-4">
            <Link to="/" className="px-6 py-2 border border-white/10 hover:bg-white/5 rounded-lg transition-all text-sm font-bold">View Site</Link>
            <button 
              onClick={() => signOut(auth)}
              className="px-6 py-2 bg-red-600/20 text-red-500 hover:bg-red-600/30 rounded-lg transition-all text-sm font-bold flex items-center gap-2"
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Upload Form */}
          <div className="lg:col-span-1">
            <div className="p-8 rounded-2xl bg-zinc-900 border border-white/10 sticky top-12">
              <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                <Plus className="text-blue-500" size={20} /> Add New Media
              </h2>
              <form onSubmit={handleUpload} className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Select Photos/Videos</label>
                  <div className="relative group">
                    <input 
                      id="file-upload"
                      type="file" 
                      multiple
                      accept="image/*,video/*"
                      required
                      className="hidden"
                      onChange={(e) => setSelectedFiles(e.target.files)}
                    />
                    <label 
                      htmlFor="file-upload"
                      className="w-full px-4 py-8 bg-black border-2 border-dashed border-white/10 rounded-xl text-gray-500 hover:text-white hover:border-blue-500/50 transition-all cursor-pointer flex flex-col items-center justify-center gap-3"
                    >
                      <Upload size={32} className={selectedFiles && selectedFiles.length > 0 ? "text-blue-500" : ""} />
                      <span className="text-sm font-medium">
                        {selectedFiles && selectedFiles.length > 0 
                          ? `${selectedFiles.length} file(s) selected` 
                          : "Click to browse or drag & drop"}
                      </span>
                      <span className="text-[10px] uppercase tracking-tighter opacity-50">Supports JPG, PNG, MP4, MOV</span>
                    </label>
                  </div>
                </div>

                {uploading && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest text-blue-500">
                      <span>Uploading...</span>
                      <span>{Math.round(uploadProgress)}%</span>
                    </div>
                    <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                      <motion.div 
                        className="h-full bg-blue-600"
                        initial={{ width: 0 }}
                        animate={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Category</label>
                  <select 
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none transition-colors"
                    value={formData.category}
                    onChange={(e) => setFormData({...formData, category: e.target.value})}
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-500">Description (Optional)</label>
                  <textarea 
                    rows={3}
                    placeholder="Brief details..."
                    className="w-full px-4 py-3 bg-black border border-white/10 rounded-lg text-white focus:border-blue-500 outline-none transition-colors resize-none"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                  ></textarea>
                </div>
                <button 
                  type="submit"
                  disabled={uploading || !selectedFiles}
                  className="w-full py-4 bg-blue-600 hover:bg-blue-500 disabled:bg-zinc-800 disabled:text-gray-600 text-white font-bold uppercase tracking-widest rounded-lg transition-all flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.2)]"
                >
                  {uploading ? <Loader2 className="animate-spin" size={20} /> : <ImageIcon size={20} />}
                  {uploading ? "Uploading..." : "Add to Gallery"}
                </button>
              </form>
            </div>
          </div>

          {/* Items List */}
          <div className="lg:col-span-2">
            <div className="grid sm:grid-cols-2 gap-6">
              {loading ? (
                <div className="col-span-full flex justify-center py-20">
                  <Loader2 className="text-blue-500 animate-spin" size={40} />
                </div>
              ) : items.length === 0 ? (
                <div className="col-span-full text-center py-20 border-2 border-dashed border-white/5 rounded-3xl">
                  <ImageIcon className="text-gray-800 mx-auto mb-4" size={64} />
                  <p className="text-gray-600">No items in your gallery yet.</p>
                </div>
              ) : (
                items.map((item) => (
                  <div key={item.id} className="group relative rounded-xl overflow-hidden bg-zinc-900 border border-white/5">
                    <div className="aspect-square relative">
                      {item.type === 'video' ? (
                        <div className="w-full h-full bg-black flex items-center justify-center">
                          <Film className="text-gray-700" size={48} />
                          <video 
                            src={item.url} 
                            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity"
                          />
                          <div className="absolute top-2 right-2 p-1 bg-black/50 rounded-md">
                            <Film size={12} className="text-white" />
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={item.url} 
                          alt={item.category} 
                          className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="p-4">
                      {editingId === item.id ? (
                        <div className="space-y-3">
                          <select 
                            className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-500"
                            value={editFormData.category}
                            onChange={(e) => setEditFormData({...editFormData, category: e.target.value})}
                          >
                            {CATEGORIES.map(cat => (
                              <option key={cat} value={cat}>{cat}</option>
                            ))}
                          </select>
                          <textarea 
                            className="w-full px-3 py-2 bg-black border border-white/10 rounded-lg text-white text-xs outline-none focus:border-blue-500 resize-none"
                            rows={2}
                            value={editFormData.description}
                            onChange={(e) => setEditFormData({...editFormData, description: e.target.value})}
                          />
                          <div className="flex gap-2">
                            <button 
                              onClick={() => handleUpdate(item.id)}
                              className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                            >
                              <Check size={14} /> Save
                            </button>
                            <button 
                              onClick={() => setEditingId(null)}
                              className="flex-1 py-2 bg-zinc-800 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1"
                            >
                              <X size={14} /> Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-white font-bold text-sm truncate max-w-[150px]">{item.category || "Uncategorized"}</h3>
                            <p className="text-gray-500 text-[10px] mb-1">{new Date(item.createdAt?.toDate()).toLocaleDateString()}</p>
                            {item.description && (
                              <p className="text-gray-400 text-[10px] line-clamp-2">{item.description}</p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <button 
                              onClick={() => startEditing(item)}
                              className="p-2 text-gray-500 hover:text-blue-500 transition-colors"
                            >
                              <Edit size={16} />
                            </button>
                            <button 
                              onClick={() => handleDelete(item.id)}
                              className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Main App Components ---
const PublicSite = () => {
  return (
    <main>
      <Hero />
      <About />
      <Gallery />
      <Experience />
      <Skills />
      <Contact />
      <Footer />
    </main>
  );
};

const Experience = () => {
  return (
    <section id="experience" className="py-24 bg-zinc-950/50">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-20">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">Professional Journey</h2>
          <div className="w-20 h-1 bg-blue-500 mx-auto"></div>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-0 md:left-1/2 top-0 bottom-0 w-[2px] bg-zinc-800 md:-translate-x-1/2" />

          <div className="space-y-12">
            {EXPERIENCES.map((exp, index) => (
              <motion.div 
                key={exp.company}
                initial={{ opacity: 0, x: index % 2 === 0 ? -50 : 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className={`relative flex flex-col md:flex-row gap-8 ${index % 2 === 0 ? 'md:flex-row-reverse' : ''}`}
              >
                {/* Dot */}
                <div className="absolute left-0 md:left-1/2 top-0 w-4 h-4 bg-blue-500 rounded-full md:-translate-x-1/2 shadow-[0_0_10px_rgba(59,130,246,0.8)] z-10" />

                <div className="md:w-1/2 pl-8 md:pl-0">
                  <div className={`p-6 rounded-2xl bg-zinc-900 border border-white/5 hover:border-blue-500/30 transition-colors ${index % 2 === 0 ? 'md:text-right' : 'md:text-left'}`}>
                    <span className="text-blue-500 font-mono text-sm mb-2 block">{exp.year}</span>
                    <h3 className="text-xl font-bold text-white mb-1">{exp.role}</h3>
                    <p className="text-gray-400 font-medium mb-4">{exp.company}</p>
                    <ul className={`text-sm text-gray-500 space-y-2 list-none`}>
                      {exp.description.map((item, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 ${index % 2 === 0 ? 'md:hidden' : ''}`}></span>
                          {item}
                          <span className={`mt-1.5 w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0 hidden ${index % 2 === 0 ? 'md:block' : ''}`}></span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                <div className="hidden md:block md:w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>

        {/* Education Section */}
        <div className="mt-32 max-w-4xl mx-auto">
          <h3 className="text-2xl font-bold text-white mb-12 flex items-center gap-4">
            <GraduationCap className="text-blue-500" /> Education
          </h3>
          <div className="p-8 rounded-2xl bg-zinc-900 border border-white/5">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h4 className="text-xl font-bold text-white">University Of Southern Philippines Foundation</h4>
                <p className="text-blue-500">Bachelor of Science in Business Management</p>
                <p className="text-gray-500">Major in Marketing Management</p>
              </div>
              <span className="px-4 py-1 bg-zinc-800 text-gray-400 rounded-full text-sm font-mono">2013 - 2017</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

const Skills = () => {
  return (
    <section id="skills" className="py-24">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Expertise & Skills</h2>
            <p className="text-gray-400 mb-8 leading-relaxed">
              With a diverse background in marketing, design, and development, I bring a holistic approach to every project, ensuring both visual excellence and technical performance.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/5">
                <Palette className="text-blue-500 mb-2" size={24} />
                <h4 className="text-white font-bold text-sm">Design</h4>
                <p className="text-xs text-gray-500">UI/UX & Graphics</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/5">
                <Code className="text-blue-500 mb-2" size={24} />
                <h4 className="text-white font-bold text-sm">Dev</h4>
                <p className="text-xs text-gray-500">Web & Landing Pages</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/5">
                <Megaphone className="text-blue-500 mb-2" size={24} />
                <h4 className="text-white font-bold text-sm">Marketing</h4>
                <p className="text-xs text-gray-500">Ads & Strategy</p>
              </div>
              <div className="p-4 rounded-xl bg-zinc-900 border border-white/5">
                <Video className="text-blue-500 mb-2" size={24} />
                <h4 className="text-white font-bold text-sm">Video</h4>
                <p className="text-xs text-gray-500">Editing & Production</p>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            {SKILLS.map((skill, index) => (
              <motion.span 
                key={skill}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                className="px-6 py-3 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full text-sm font-bold hover:bg-blue-500 hover:text-white transition-all cursor-default"
              >
                {skill}
              </motion.span>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

const Contact = () => {
  const [formState, setFormState] = useState({ name: '', email: '', message: '' });
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);
    setTimeout(() => setIsSubmitted(false), 3000);
  };

  return (
    <section id="contact" className="py-24 relative overflow-hidden">
      {/* Decorative Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tighter">LET'S WORK <span className="text-blue-500">TOGETHER</span></h2>
          <p className="text-gray-400">Have a project in mind? Let's build something amazing together.</p>
        </div>

        <div className="max-w-2xl mx-auto">
          {/* Glassmorphic Form */}
          <div className="p-8 md:p-12 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl shadow-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Name</label>
                  <input 
                    type="text" 
                    required
                    placeholder="John Doe"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={formState.name}
                    onChange={(e) => setFormState({...formState, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Email</label>
                  <input 
                    type="email" 
                    required
                    placeholder="john@example.com"
                    className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors"
                    value={formState.email}
                    onChange={(e) => setFormState({...formState, email: e.target.value})}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-widest text-gray-400 ml-1">Message</label>
                <textarea 
                  required
                  rows={5}
                  placeholder="Tell me about your project..."
                  className="w-full px-6 py-4 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500 transition-colors resize-none"
                  value={formState.message}
                  onChange={(e) => setFormState({...formState, message: e.target.value})}
                ></textarea>
              </div>
              <button 
                type="submit"
                className="w-full py-5 bg-blue-600 hover:bg-blue-500 text-white font-bold uppercase tracking-widest rounded-xl transition-all hover:shadow-[0_0_30px_rgba(59,130,246,0.4)] flex items-center justify-center gap-3 group"
              >
                {isSubmitted ? "Message Sent!" : "Send Message"}
                {!isSubmitted && <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

const Footer = () => {
  return (
    <footer className="py-12 border-t border-white/5">
      <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-8">
        <div className="text-xl font-bold tracking-tighter text-white">
          MARCO<span className="text-blue-500">.</span>
        </div>
        <p className="text-gray-500 text-sm">
          © {new Date().getFullYear()} Marco Antiligando. All rights reserved.
        </p>
        <div className="flex items-center gap-6">
          <a href="#" className="text-gray-500 hover:text-blue-500 transition-colors"><Linkedin size={18} /></a>
          <a href="#" className="text-gray-500 hover:text-blue-500 transition-colors"><Facebook size={18} /></a>
          <a href="#" className="text-gray-500 hover:text-blue-500 transition-colors"><Instagram size={18} /></a>
        </div>
      </div>
    </footer>
  );
};

export default function App() {
  return (
    <Router>
      <ErrorBoundary>
        <div className="min-h-screen bg-black text-gray-300 font-sans selection:bg-blue-500/30 selection:text-blue-200 overflow-x-hidden">
          <Nav />
          <Routes>
            <Route path="/" element={<PublicSite />} />
            <Route path="/admin" element={<Admin />} />
          </Routes>
        </div>
      </ErrorBoundary>
    </Router>
  );
}
