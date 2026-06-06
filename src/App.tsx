import {
  type ComponentType,
  type Dispatch,
  type FormEvent,
  type ReactNode,
  type SetStateAction,
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  AtSign,
  Bot,
  Briefcase,
  Clock3,
  Code2,
  Database,
  Globe,
  LockKeyhole,
  Mail,
  MapPin,
  Menu,
  Minus,
  Palette,
  Phone,
  Plus,
  Save,
  Scaling,
  ShieldCheck,
  Smartphone,
  X,
} from "lucide-react";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom";
import {
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  updateProfile,
  type User,
} from "firebase/auth";
import {
  doc,
  setDoc,
  onSnapshot,
  collection,
  query,
  orderBy,
  deleteDoc,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

type ProjectCategory = "Web" | "App" | "UI/UX" | "AI";
type ProjectFilter = "All" | ProjectCategory;
type ServiceIconKey = "code" | "app" | "design" | "backend" | "ai";

type ServiceItem = {
  name: string;
  description: string;
  icon: ServiceIconKey;
};

type ProjectItem = {
  title: string;
  category: ProjectCategory;
  stack: string;
  description: string;
};

type TeamItem = {
  name: string;
  role: string;
  skills: string;
  bio: string;
};

type SiteContent = {
  brandName: string;
  brandTagline: string;
  home: {
    headline: string;
    subheading: string;
    ctaPrimary: string;
    ctaSecondary: string;
    ctaBanner: string;
  };
  about: {
    intro: string;
    mission: string;
    vision: string;
    founderMessage: string;
  };
  services: ServiceItem[];
  projects: ProjectItem[];
  team: TeamItem[];
  contact: {
    phone: string;
    email: string;
    address: string;
    instagram: string;
    linkedin: string;
    website: string;
  };
};

type AuthState = {
  userLoggedIn: boolean;
  adminLoggedIn: boolean;
  userName: string;
  userEmail: string;
  adminEmail: string;
};

type RegisteredUser = {
  id?: string;
  fullName: string;
  email: string;
  createdAt?: Timestamp;
};

type AuthContextValue = AuthState & {
  loginUser: (name: string, email: string) => void;
  logoutUser: () => Promise<void>;
  loginAdmin: (email: string) => void;
  logoutAdmin: () => Promise<void>;
};

type ContentContextValue = {
  content: SiteContent;
  setContent: Dispatch<SetStateAction<SiteContent>>;
  resetContent: () => void;
};

const initialContent: SiteContent = {
  brandName: "Aarya Forge Studio",
  brandTagline: "Software Development Company",
  home: {
    headline: "We Forge Digital Excellence",
    subheading: "Transforming Ideas into Powerful Digital Solutions",
    ctaPrimary: "Get Started",
    ctaSecondary: "View Projects",
    ctaBanner: "Let's Build Something Amazing Together",
  },
  about: {
    intro:
      "We are a premium software development company focused on building high-impact digital products with modern technology and design precision.",
    mission: "To empower businesses through secure, scalable, and human-centered software experiences.",
    vision: "To become the most trusted digital forge for future-ready products around the world.",
    founderMessage:
      "Every line of code we ship should create measurable value. We combine product strategy, design clarity, and technical depth to build with confidence.",
  },
  services: [
    {
      name: "Web Development",
      description: "Modern scalable web platforms with excellent performance and clean architecture.",
      icon: "code",
    },
    {
      name: "App Development",
      description: "High-quality mobile apps engineered for speed, usability, and long-term growth.",
      icon: "app",
    },
    {
      name: "UI/UX Design",
      description: "Design systems and digital experiences that feel premium, intuitive, and consistent.",
      icon: "design",
    },
    {
      name: "Backend Development",
      description: "Secure API foundations and cloud-ready services built for reliability at scale.",
      icon: "backend",
    },
    {
      name: "AI Solutions",
      description: "Applied AI integrations to automate decisions and accelerate digital innovation.",
      icon: "ai",
    },
  ],
  projects: [
    {
      title: "Nexora Commerce Engine",
      category: "Web",
      stack: "React, Node.js, PostgreSQL",
      description: "Enterprise ecommerce platform with intelligent inventory and role-based dashboards.",
    },
    {
      title: "PulseCare Patient App",
      category: "App",
      stack: "React Native, Express, MongoDB",
      description: "Healthcare mobile suite for appointments, reports, and real-time doctor communication.",
    },
    {
      title: "Northstar Design System",
      category: "UI/UX",
      stack: "Figma, Storybook, Tailwind",
      description: "Unified design language that improved consistency and handoff across product teams.",
    },
    {
      title: "Luma AI Assistant",
      category: "AI",
      stack: "Python, FastAPI, OpenAI",
      description: "AI operations assistant that reduced repetitive manual tasks by over 45%.",
    },
  ],
  team: [
    {
      name: "Aarya Patel",
      role: "Founder & Product Architect",
      skills: "Product Strategy, Architecture, Leadership",
      bio: "Drives product direction and ensures every delivery matches enterprise standards.",
    },
    {
      name: "Rohan Mehta",
      role: "Frontend Developer",
      skills: "React, Next.js, Framer Motion",
      bio: "Creates polished interfaces with strong accessibility and performance.",
    },
    {
      name: "Sana Kapoor",
      role: "Backend Developer",
      skills: "Node.js, API Design, Security",
      bio: "Builds resilient backend systems with secure data pipelines.",
    },
  ],
  contact: {
    phone: "+91 98765 43210",
    email: "hello@aaryaforge.studio",
    address: "Hitech City, Hyderabad, India",
    instagram: "@aaryaforgestudio",
    linkedin: "linkedin.com/company/aaryaforge",
    website: "www.aaryaforgestudio.com",
  },
};

const iconMap: Record<ServiceIconKey, ComponentType<{ className?: string }>> = {
  code: Code2,
  app: Smartphone,
  design: Palette,
  backend: Database,
  ai: Bot,
};

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/about", label: "About" },
  { to: "/team", label: "Team" },
  { to: "/projects", label: "Projects" },
  { to: "/contact", label: "Contact" },
  { to: "/user-dashboard", label: "User Dashboard" },
  { to: "/admin-dashboard", label: "Admin Dashboard" },
];

const ContentContext = createContext<ContentContextValue | null>(null);
const AuthContext = createContext<AuthContextValue | null>(null);

function useContent() {
  const value = useContext(ContentContext);
  if (!value) throw new Error("useContent must be used inside ContentContext provider");
  return value;
}

function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthContext provider");
  return value;
}

function BrandLogo({ compact = false }: { compact?: boolean }) {
  const { content: { brandName, brandTagline } } = useContent();
  return (
    <div className="flex items-center gap-3">
      <svg viewBox="0 0 100 100" className="h-10 w-10 shrink-0" role="img" aria-label={`${brandName} logo`}>
        <path d="M8 88 L44 10 L68 60 L57 60 L45 36 L23 88 Z" fill="#0A0D3A" />
        <path d="M38 63 H58 L49 79 H30 Z" fill="#0A0D3A" />
        <path d="M62 88 V40 L84 22 V88 Z" fill="#111656" />
        <rect x="67" y="50" width="3" height="34" fill="#C69A3B" />
        <rect x="73" y="44" width="3" height="40" fill="#C69A3B" />
        <rect x="79" y="39" width="3" height="45" fill="#C69A3B" />
      </svg>
      {!compact && (
        <div>
          <p className="font-heading text-lg font-semibold tracking-tight text-slate-900">{brandName}</p>
          <p className="text-xs uppercase tracking-[0.18em] text-slate-500">{brandTagline}</p>
        </div>
      )}
    </div>
  );
}

function ScrollSetup() {
  const location = useLocation();
  const { content: { brandName } } = useContent();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    const label = navLinks.find((item) => item.to === location.pathname)?.label ?? "Welcome";
    document.title = `${label} | ${brandName}`;
  }, [location.pathname, brandName]);
  return null;
}

function Navbar() {
  const [open, setOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-white/50 bg-white/80 backdrop-blur-xl">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-5 py-3 md:px-8">
        <NavLink to="/" onClick={() => setOpen(false)}>
          <BrandLogo compact />
        </NavLink>
        <button type="button" onClick={() => setOpen((v) => !v)} className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 md:hidden" aria-label="Toggle menu">
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
        <ul className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (<li key={link.to}><TopLink to={link.to} label={link.label} /></li>))}
        </ul>
      </nav>
      <AnimatePresence>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-slate-200 bg-white md:hidden">
            <ul className="space-y-1 px-4 py-3">
              {navLinks.map((link) => (<li key={link.to}><TopLink to={link.to} label={link.label} mobile onClick={() => setOpen(false)} /></li>))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}

function TopLink({ to, label, mobile = false, onClick }: { to: string; label: string; mobile?: boolean; onClick?: () => void }) {
  return (
    <NavLink to={to} onClick={onClick} className={({ isActive }) => ["rounded-md px-3 py-2 text-sm font-medium transition", isActive ? "bg-gradient-to-r from-indigo-600 to-violet-500 bg-clip-text text-transparent" : "text-slate-600 hover:text-slate-900", mobile ? "block w-full hover:bg-slate-100" : "inline-flex"].join(" ")}>
      {label}
    </NavLink>
  );
}

function PageWrap({ children }: { children: ReactNode }) {
  return (<motion.main initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -18 }} transition={{ duration: 0.4 }}>{children}</motion.main>);
}

function HomePage() {
  const { content: { home, services, projects } } = useContent();
  const featured = projects.slice(0, 3);
  return (
    <>
      <section className="relative overflow-hidden bg-slate-950 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(123,97,255,0.38),_transparent_45%),radial-gradient(circle_at_20%_15%,_rgba(0,176,255,0.35),_transparent_35%)]" />
        <div className="absolute -left-20 top-20 h-64 w-64 animate-float rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute bottom-10 right-0 h-72 w-72 animate-float-delayed rounded-full bg-violet-500/20 blur-3xl" />
        <div className="relative mx-auto flex min-h-[88vh] max-w-7xl flex-col justify-center gap-8 px-5 py-20 md:px-8">
          <div className="max-w-3xl">
            <BrandLogo />
            <h1 className="font-heading mt-8 text-4xl font-bold leading-tight text-balance sm:text-5xl md:text-6xl">{home.headline}</h1>
            <p className="mt-5 max-w-2xl text-lg text-slate-200">{home.subheading}</p>
            <div className="mt-9 flex flex-wrap gap-3">
              <motion.div whileHover={{ scale: 1.03, boxShadow: "0px 0px 32px rgba(88, 101, 242, 0.4)" }} whileTap={{ scale: 0.98 }}>
                <NavLink to="/contact" className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-900">{home.ctaPrimary} <ArrowRight className="h-4 w-4" /></NavLink>
              </motion.div>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                <NavLink to="/projects" className="inline-flex items-center gap-2 rounded-full border border-white/35 px-6 py-3 text-sm font-semibold text-white hover:bg-white/10">{home.ctaSecondary}</NavLink>
              </motion.div>
            </div>
          </div>
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <h2 className="font-heading text-3xl font-bold text-slate-900">Services</h2>
        <p className="mt-3 max-w-2xl text-slate-600">End-to-end digital product services crafted for ambitious startups and enterprise teams.</p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => {
            const Icon = iconMap[service.icon];
            return (
              <motion.article key={service.name} whileHover={{ y: -8 }} className="rounded-2xl border border-slate-200/80 bg-white p-6 shadow-[0_14px_45px_-30px_rgba(33,56,161,0.55)]">
                <Icon className="h-5 w-5 text-indigo-600" />
                <h3 className="mt-4 font-heading text-xl font-semibold text-slate-900">{service.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{service.description}</p>
              </motion.article>
            );
          })}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-2 md:px-8">
        <h2 className="font-heading text-3xl font-bold text-slate-900">Why Choose Us</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Clock3, title: "Fast Delivery", text: "Agile process and focused sprints for rapid quality outcomes." },
            { icon: Code2, title: "Clean Code", text: "Readable and maintainable engineering standards from day one." },
            { icon: ShieldCheck, title: "Secure Systems", text: "Security-first architecture with best-practice implementation." },
            { icon: Scaling, title: "Scalable Architecture", text: "Future-ready systems built to support business growth." },
          ].map((item) => (
            <div key={item.title}>
              <item.icon className="h-5 w-5 text-violet-600" />
              <h3 className="font-heading mt-3 text-lg font-semibold text-slate-900">{item.title}</h3>
              <p className="mt-2 text-sm text-slate-600">{item.text}</p>
            </div>
          ))}
        </div>
      </section>
      <section className="mx-auto max-w-7xl px-5 py-20 md:px-8">
        <h2 className="font-heading text-3xl font-bold text-slate-900">Featured Projects</h2>
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {featured.map((project) => (
            <motion.article key={project.title} whileHover={{ y: -6 }} className="rounded-2xl border border-slate-200 bg-gradient-to-b from-white to-slate-50 p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">{project.category}</p>
              <h3 className="font-heading mt-3 text-xl font-semibold text-slate-900">{project.title}</h3>
              <p className="mt-2 text-sm text-slate-500">{project.stack}</p>
              <p className="mt-4 text-sm text-slate-600">{project.description}</p>
            </motion.article>
          ))}
        </div>
      </section>
      <section className="bg-slate-950 px-5 py-20 text-center text-white md:px-8">
        <h2 className="font-heading text-3xl font-bold">{home.ctaBanner}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-slate-300">Partner with us to turn your idea into a secure, scalable, and stunning digital product.</p>
        <motion.div whileHover={{ scale: 1.03, boxShadow: "0px 0px 25px rgba(125, 107, 255, 0.45)" }} whileTap={{ scale: 0.98 }} className="mt-8 inline-flex">
          <NavLink to="/contact" className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 to-violet-500 px-6 py-3 text-sm font-semibold text-white">Start Your Project <ArrowRight className="h-4 w-4" /></NavLink>
        </motion.div>
      </section>
    </>
  );
}

function AboutPage() {
  const { content: { about } } = useContent();
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <h1 className="font-heading text-4xl font-bold text-slate-900">About Us</h1>
      <p className="mt-4 max-w-3xl text-slate-600">{about.intro}</p>
      <div className="mt-12 grid gap-8 md:grid-cols-2">
        <div><h2 className="font-heading text-2xl font-semibold text-slate-900">Mission</h2><p className="mt-3 text-slate-600">{about.mission}</p></div>
        <div><h2 className="font-heading text-2xl font-semibold text-slate-900">Vision</h2><p className="mt-3 text-slate-600">{about.vision}</p></div>
      </div>
      <div className="mt-12 rounded-2xl border border-slate-200 bg-white p-8">
        <h2 className="font-heading text-2xl font-semibold text-slate-900">Founder Message</h2>
        <p className="mt-4 text-slate-600">{about.founderMessage}</p>
      </div>
    </section>
  );
}

function TeamPage() {
  const { content: { team } } = useContent();
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <h1 className="font-heading text-4xl font-bold text-slate-900">Team / Employee Details</h1>
      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {team.map((member) => (
          <motion.article key={member.name} whileHover={{ y: -7 }} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_35px_-28px_rgba(27,39,104,0.45)]">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 font-heading text-lg font-semibold text-white">
              {member.name.split(" ").map((part) => part[0]).join("")}
            </div>
            <h2 className="font-heading text-xl font-semibold text-slate-900">{member.name}</h2>
            <p className="mt-1 text-sm font-medium text-indigo-600">{member.role}</p>
            <p className="mt-3 text-sm text-slate-600">{member.bio}</p>
            <p className="mt-3 text-sm text-slate-500">Skills: {member.skills}</p>
            <div className="mt-4 flex gap-3 text-slate-500"><Globe className="h-4 w-4" /><AtSign className="h-4 w-4" /></div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function ProjectsPage() {
  const { content: { projects } } = useContent();
  const [filter, setFilter] = useState<ProjectFilter>("All");
  const filtered = useMemo(() => (filter === "All" ? projects : projects.filter((item) => item.category === filter)), [projects, filter]);
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <h1 className="font-heading text-4xl font-bold text-slate-900">Projects</h1>
      <div className="mt-8 flex flex-wrap gap-2">
        {(["All", "Web", "App", "UI/UX", "AI"] as const).map((category) => (
          <button key={category} type="button" onClick={() => setFilter(category)} className={["rounded-full px-4 py-2 text-sm font-medium transition", filter === category ? "bg-slate-900 text-white" : "border border-slate-300 bg-white text-slate-600 hover:border-slate-500"].join(" ")}>
            {category}
          </button>
        ))}
      </div>
      <div className="mt-10 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((project) => (
          <motion.article key={project.title} whileHover={{ y: -6 }} className="rounded-2xl border border-slate-200 bg-white p-6">
            <div className="h-36 rounded-xl bg-gradient-to-br from-indigo-500/90 via-blue-500/70 to-violet-500/80" />
            <p className="mt-4 text-xs font-semibold uppercase tracking-[0.15em] text-indigo-600">{project.category}</p>
            <h2 className="font-heading mt-3 text-xl font-semibold text-slate-900">{project.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{project.stack}</p>
            <p className="mt-3 text-sm text-slate-600">{project.description}</p>
            <button type="button" className="mt-5 inline-flex items-center gap-2 rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:border-indigo-500 hover:text-indigo-600">
              View Details <ArrowRight className="h-4 w-4" />
            </button>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

function UserLoginPage() {
  const navigate = useNavigate();
  const { loginUser } = useAuth();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setFeedback(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, loginEmail.trim(), loginPassword);
      const displayName = userCredential.user.displayName || loginEmail.split("@")[0];
      loginUser(displayName, userCredential.user.email || loginEmail);
      navigate("/user-dashboard");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setFeedback({ type: "error", text: "Invalid email or password." });
      } else if (code === "auth/invalid-email") {
        setFeedback({ type: "error", text: "Please enter a valid email." });
      } else {
        setFeedback({ type: "error", text: "Login failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!registerName.trim() || !registerEmail.trim() || !registerPassword.trim()) {
      setFeedback({ type: "error", text: "Please fill all registration fields." });
      return;
    }
    if (registerPassword !== confirmPassword) {
      setFeedback({ type: "error", text: "Passwords do not match." });
      return;
    }
    if (registerPassword.length < 6) {
      setFeedback({ type: "error", text: "Password must be at least 6 characters." });
      return;
    }

    setLoading(true);
    setFeedback(null);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, registerEmail.trim(), registerPassword);
      
      await updateProfile(userCredential.user, {
        displayName: registerName.trim(),
      });

      await setDoc(doc(db, "users", userCredential.user.uid), {
        fullName: registerName.trim(),
        email: registerEmail.trim(),
        createdAt: serverTimestamp(),
      });

      setFeedback({ type: "success", text: "Registration successful! You can now login." });
      setMode("login");
      setLoginEmail(registerEmail.trim());
      setLoginPassword("");
      setRegisterName("");
      setRegisterEmail("");
      setRegisterPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/email-already-in-use") {
        setFeedback({ type: "error", text: "Email already registered. Please login." });
      } else if (code === "auth/invalid-email") {
        setFeedback({ type: "error", text: "Please enter a valid email." });
      } else if (code === "auth/weak-password") {
        setFeedback({ type: "error", text: "Password is too weak. Use at least 6 characters." });
      } else {
        setFeedback({ type: "error", text: "Registration failed. Please try again." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="relative overflow-hidden px-5 py-16 md:px-8">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_rgba(93,167,255,0.2),_transparent_40%),radial-gradient(circle_at_bottom_right,_rgba(153,106,255,0.2),_transparent_45%)]" />
      <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-[0_22px_60px_-35px_rgba(42,59,138,0.5)]">
        <h1 className="font-heading text-3xl font-bold text-slate-900">{mode === "login" ? "User Login" : "New User Register"}</h1>
        <p className="mt-2 text-sm text-slate-500">Powered by Firebase Authentication</p>

        <div className="mt-5 grid grid-cols-2 rounded-xl bg-slate-100 p-1 text-sm font-semibold">
          <button type="button" onClick={() => { setMode("login"); setFeedback(null); }} className={["rounded-lg py-2 transition", mode === "login" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"].join(" ")}>Login</button>
          <button type="button" onClick={() => { setMode("register"); setFeedback(null); }} className={["rounded-lg py-2 transition", mode === "register" ? "bg-white text-slate-900 shadow-sm" : "text-slate-500"].join(" ")}>Register</button>
        </div>

        {mode === "login" ? (
          <form className="mt-7 space-y-4" onSubmit={handleLogin}>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} type="email" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password
              <input value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} type="password" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
            </label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 px-4 py-3 font-semibold text-white disabled:opacity-60">
              {loading ? "Signing in..." : "Login"}
            </button>
          </form>
        ) : (
          <form className="mt-7 space-y-4" onSubmit={handleRegister}>
            <label className="block text-sm font-medium text-slate-700">
              Full Name
              <input value={registerName} onChange={(e) => setRegisterName(e.target.value)} required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Email
              <input value={registerEmail} onChange={(e) => setRegisterEmail(e.target.value)} type="email" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Password (min 6 characters)
              <input value={registerPassword} onChange={(e) => setRegisterPassword(e.target.value)} type="password" required minLength={6} className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Confirm Password
              <input value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} type="password" required className="mt-2 w-full rounded-xl border border-slate-300 px-4 py-3 outline-none focus:border-indigo-500" />
            </label>
            <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 px-4 py-3 font-semibold text-white disabled:opacity-60">
              {loading ? "Registering..." : "Register"}
            </button>
          </form>
        )}

        {feedback && (
          <div className={`mt-4 rounded-lg px-4 py-2 text-sm ${feedback.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
            {feedback.text}
          </div>
        )}
      </div>
    </section>
  );
}

function AdminLoginPage() {
  const navigate = useNavigate();
  const { loginAdmin } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
      loginAdmin(userCredential.user.email || email);
      navigate("/admin-dashboard");
    } catch (err: any) {
      const code = err?.code || "";
      if (code === "auth/invalid-credential" || code === "auth/wrong-password" || code === "auth/user-not-found") {
        setError("Invalid email or password.");
      } else if (code === "auth/invalid-email") {
        setError("Please enter a valid email.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-slate-950 px-5 py-16 md:px-8">
      <div className="mx-auto max-w-md rounded-2xl border border-indigo-400/35 bg-slate-900/80 p-8 shadow-[0_0_40px_rgba(90,102,255,0.2)]">
        <h1 className="font-heading text-3xl font-bold text-white">Admin Panel Login</h1>
        <p className="mt-2 text-sm text-slate-400">Secure access powered by Firebase</p>
        <form className="mt-7 space-y-4" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-300">
            Admin Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="admin@example.com" className="mt-2 w-full rounded-xl border border-indigo-300/30 bg-slate-900 px-4 py-3 text-white outline-none focus:border-indigo-400" />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Password
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2 w-full rounded-xl border border-indigo-300/30 bg-slate-900 px-4 py-3 text-white outline-none focus:border-indigo-400" />
          </label>
          <p className="flex items-center gap-2 text-xs text-cyan-300"><LockKeyhole className="h-3.5 w-3.5" />Protected by Firebase secure authentication.</p>
          {error && (<div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">{error}</div>)}
          <button type="submit" disabled={loading} className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-500 px-4 py-3 font-semibold text-white disabled:opacity-60">
            {loading ? "Signing in..." : "Secure Login"}
          </button>
        </form>
      </div>
    </section>
  );
}

function ContactPage() {
  const { content: { contact } } = useContent();
  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <h1 className="font-heading text-4xl font-bold text-slate-900">Contact Us</h1>
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {[
            { icon: Phone, label: "Mobile Number", value: contact.phone },
            { icon: Mail, label: "Email ID", value: contact.email },
            { icon: MapPin, label: "Office Address", value: contact.address },
            { icon: AtSign, label: "Instagram", value: contact.instagram },
            { icon: Briefcase, label: "LinkedIn", value: contact.linkedin },
            { icon: Globe, label: "Website", value: contact.website },
          ].map((item) => (
            <div key={item.label} className="flex items-start gap-3">
              <item.icon className="mt-1 h-4 w-4 text-indigo-600" />
              <div><p className="text-sm font-semibold text-slate-900">{item.label}</p><p className="text-sm text-slate-600">{item.value}</p></div>
            </div>
          ))}
        </div>
        <form className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_20px_45px_-35px_rgba(31,45,119,0.45)]">
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Name<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500" /></label>
            <label className="text-sm font-medium text-slate-700">Email<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500" /></label>
          </div>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <label className="text-sm font-medium text-slate-700">Phone<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500" /></label>
            <label className="text-sm font-medium text-slate-700">Message<input className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-indigo-500" /></label>
          </div>
          <button type="submit" className="mt-5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-500 px-5 py-3 text-sm font-semibold text-white">Send Message</button>
        </form>
      </div>
      <div className="mt-12 overflow-hidden rounded-2xl border border-slate-200">
        <iframe title="Office Map" src="https://www.google.com/maps?q=Hitech%20City%20Hyderabad&output=embed" className="h-[320px] w-full" loading="lazy" />
      </div>
    </section>
  );
}

function UserDashboardPage() {
  const { userLoggedIn, userName, userEmail, logoutUser } = useAuth();
  const { content: { projects } } = useContent();

  if (!userLoggedIn) return <Navigate to="/user-login" replace />;

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <h1 className="font-heading text-4xl font-bold text-slate-900">User Dashboard</h1>
      <p className="mt-2 text-slate-600">Welcome back, <span className="font-semibold text-indigo-600">{userName}</span></p>
      <p className="text-sm text-slate-500">{userEmail}</p>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {[
          { label: "Active Projects", value: String(Math.min(projects.length, 4)) },
          { label: "Pending Approvals", value: "2" },
          { label: "Support Tickets", value: "1" },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-sm text-slate-500">{item.label}</p>
            <p className="font-heading mt-2 text-3xl font-bold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>
      <h2 className="font-heading mt-12 text-2xl font-semibold text-slate-900">Your Recent Projects</h2>
      <div className="mt-5 grid gap-4 md:grid-cols-2">
        {projects.slice(0, 4).map((project) => (
          <div key={project.title} className="rounded-2xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-indigo-600">{project.category}</p>
            <h3 className="font-heading mt-2 text-xl font-semibold text-slate-900">{project.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{project.stack}</p>
          </div>
        ))}
      </div>
      <button type="button" onClick={() => logoutUser()} className="mt-8 rounded-full border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:border-slate-900 hover:text-slate-900">
        Logout User
      </button>
    </section>
  );
}

function AdminDashboardPage() {
  const { adminLoggedIn, adminEmail, logoutAdmin } = useAuth();
  const { content, setContent, resetContent } = useContent();
  const [notice, setNotice] = useState("");
  const [users, setUsers] = useState<RegisteredUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  useEffect(() => {
    if (!adminLoggedIn) return;
    const q = query(collection(db, "users"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as RegisteredUser[];
      setUsers(data);
      setLoadingUsers(false);
    }, () => setLoadingUsers(false));

    return () => unsubscribe();
  }, [adminLoggedIn]);

  const handleDeleteUser = async (id: string) => {
    if (!window.confirm("Delete this user record? (Note: Firebase Auth account will remain)")) return;
    try {
      await deleteDoc(doc(db, "users", id));
      setNotice("User record deleted.");
    } catch (error) {
      console.error("Error deleting:", error);
    }
  };

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 2000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!adminLoggedIn) return <Navigate to="/admin-login" replace />;

  const updateProject = (index: number, key: keyof ProjectItem, value: string) => {
    setContent((prev) => {
      const next = [...prev.projects];
      if (key === "category") next[index] = { ...next[index], category: value as ProjectCategory };
      else next[index] = { ...next[index], [key]: value };
      return { ...prev, projects: next };
    });
  };

  return (
    <section className="mx-auto max-w-7xl px-5 py-16 md:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-4xl font-bold text-slate-900">Admin Dashboard</h1>
          <p className="mt-2 text-slate-600">Logged in as: <span className="font-semibold text-indigo-600">{adminEmail}</span></p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={() => { resetContent(); setNotice("Content reset to default."); }} className="rounded-full border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700">Reset</button>
          <button type="button" onClick={() => logoutAdmin()} className="rounded-full border border-slate-900 px-4 py-2 text-sm font-semibold text-slate-900">Logout Admin</button>
        </div>
      </div>

      {notice && <p className="mt-4 rounded-lg bg-emerald-50 px-4 py-2 text-sm text-emerald-700">{notice}</p>}

      <div className="mt-8 space-y-8">
        {/* REGISTERED USERS SECTION */}
        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">
              👥 Registered Users
              <span className="ml-2 rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">{users.length}</span>
            </h2>
          </div>
          {loadingUsers ? (
            <p className="mt-4 text-sm text-slate-500">Loading users...</p>
          ) : users.length === 0 ? (
            <p className="mt-4 text-sm text-slate-500">No registered users yet. Users will appear here when they register.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="border-b border-slate-200 text-left text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Email</th>
                    <th className="pb-3">Registered</th>
                    <th className="pb-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {users.map((user) => (
                    <tr key={user.id}>
                      <td className="py-3 font-medium text-slate-900">{user.fullName}</td>
                      <td className="py-3 text-indigo-600">{user.email}</td>
                      <td className="py-3 text-slate-500">{user.createdAt ? user.createdAt.toDate().toLocaleDateString() : "—"}</td>
                      <td className="py-3 text-right">
                        <button type="button" onClick={() => user.id && handleDeleteUser(user.id)} className="rounded-lg border border-red-200 px-3 py-1 text-xs font-semibold text-red-600 hover:bg-red-50">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-xl font-semibold">Brand + Hero</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input label="Brand Name" value={content.brandName} onChange={(value) => setContent((prev) => ({ ...prev, brandName: value }))} />
            <Input label="Brand Tagline" value={content.brandTagline} onChange={(value) => setContent((prev) => ({ ...prev, brandTagline: value }))} />
            <Input label="Hero Headline" value={content.home.headline} onChange={(value) => setContent((prev) => ({ ...prev, home: { ...prev.home, headline: value } }))} />
            <Input label="Hero Subheading" value={content.home.subheading} onChange={(value) => setContent((prev) => ({ ...prev, home: { ...prev.home, subheading: value } }))} />
            <Input label="Primary CTA" value={content.home.ctaPrimary} onChange={(value) => setContent((prev) => ({ ...prev, home: { ...prev.home, ctaPrimary: value } }))} />
            <Input label="Secondary CTA" value={content.home.ctaSecondary} onChange={(value) => setContent((prev) => ({ ...prev, home: { ...prev.home, ctaSecondary: value } }))} />
            <Input label="CTA Banner" value={content.home.ctaBanner} onChange={(value) => setContent((prev) => ({ ...prev, home: { ...prev.home, ctaBanner: value } }))} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-xl font-semibold">About Content</h2>
          <div className="mt-4 grid gap-4">
            <TextArea label="Introduction" value={content.about.intro} onChange={(value) => setContent((prev) => ({ ...prev, about: { ...prev.about, intro: value } }))} />
            <TextArea label="Mission" value={content.about.mission} onChange={(value) => setContent((prev) => ({ ...prev, about: { ...prev.about, mission: value } }))} />
            <TextArea label="Vision" value={content.about.vision} onChange={(value) => setContent((prev) => ({ ...prev, about: { ...prev.about, vision: value } }))} />
            <TextArea label="Founder Message" value={content.about.founderMessage} onChange={(value) => setContent((prev) => ({ ...prev, about: { ...prev.about, founderMessage: value } }))} />
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">Services</h2>
            <button type="button" onClick={() => setContent((prev) => ({ ...prev, services: [...prev.services, { name: "New Service", description: "Service description", icon: "code" }] }))} className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Add Service
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {content.services.map((service, index) => (
              <div key={`${service.name}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-4">
                <Input label="Service Name" value={service.name} onChange={(value) => setContent((prev) => { const next = [...prev.services]; next[index] = { ...next[index], name: value }; return { ...prev, services: next }; })} />
                <Input label="Description" value={service.description} onChange={(value) => setContent((prev) => { const next = [...prev.services]; next[index] = { ...next[index], description: value }; return { ...prev, services: next }; })} />
                <label className="text-sm font-medium text-slate-700">
                  Icon
                  <select value={service.icon} onChange={(e) => setContent((prev) => { const next = [...prev.services]; next[index] = { ...next[index], icon: e.target.value as ServiceIconKey }; return { ...prev, services: next }; })} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="code">Code</option><option value="app">App</option><option value="design">Design</option><option value="backend">Backend</option><option value="ai">AI</option>
                  </select>
                </label>
                <button type="button" onClick={() => setContent((prev) => ({ ...prev, services: prev.services.filter((_, itemIndex) => itemIndex !== index) }))} className="self-end rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">
                  <Minus className="mr-1 inline h-4 w-4" /> Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">Projects</h2>
            <button type="button" onClick={() => setContent((prev) => ({ ...prev, projects: [...prev.projects, { title: "New Project", category: "Web", stack: "React", description: "Project description" }] }))} className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Add Project
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {content.projects.map((project, index) => (
              <div key={`${project.title}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-5">
                <Input label="Title" value={project.title} onChange={(value) => updateProject(index, "title", value)} />
                <label className="text-sm font-medium text-slate-700">
                  Category
                  <select value={project.category} onChange={(e) => updateProject(index, "category", e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2">
                    <option value="Web">Web</option><option value="App">App</option><option value="UI/UX">UI/UX</option><option value="AI">AI</option>
                  </select>
                </label>
                <Input label="Stack" value={project.stack} onChange={(value) => updateProject(index, "stack", value)} />
                <Input label="Description" value={project.description} onChange={(value) => updateProject(index, "description", value)} />
                <button type="button" onClick={() => setContent((prev) => ({ ...prev, projects: prev.projects.filter((_, itemIndex) => itemIndex !== index) }))} className="self-end rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">
                  <Minus className="mr-1 inline h-4 w-4" /> Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <div className="flex items-center justify-between">
            <h2 className="font-heading text-xl font-semibold">Team</h2>
            <button type="button" onClick={() => setContent((prev) => ({ ...prev, team: [...prev.team, { name: "New Member", role: "Role", skills: "Skills", bio: "Short bio" }] }))} className="inline-flex items-center gap-1 rounded-full border border-slate-300 px-3 py-1.5 text-sm font-semibold">
              <Plus className="h-4 w-4" /> Add Member
            </button>
          </div>
          <div className="mt-4 space-y-4">
            {content.team.map((member, index) => (
              <div key={`${member.name}-${index}`} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-5">
                <Input label="Name" value={member.name} onChange={(value) => setContent((prev) => { const next = [...prev.team]; next[index] = { ...next[index], name: value }; return { ...prev, team: next }; })} />
                <Input label="Role" value={member.role} onChange={(value) => setContent((prev) => { const next = [...prev.team]; next[index] = { ...next[index], role: value }; return { ...prev, team: next }; })} />
                <Input label="Skills" value={member.skills} onChange={(value) => setContent((prev) => { const next = [...prev.team]; next[index] = { ...next[index], skills: value }; return { ...prev, team: next }; })} />
                <Input label="Bio" value={member.bio} onChange={(value) => setContent((prev) => { const next = [...prev.team]; next[index] = { ...next[index], bio: value }; return { ...prev, team: next }; })} />
                <button type="button" onClick={() => setContent((prev) => ({ ...prev, team: prev.team.filter((_, itemIndex) => itemIndex !== index) }))} className="self-end rounded-lg border border-red-200 px-3 py-2 text-sm font-semibold text-red-600">
                  <Minus className="mr-1 inline h-4 w-4" /> Remove
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="font-heading text-xl font-semibold">Contact Data</h2>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Input label="Phone" value={content.contact.phone} onChange={(value) => setContent((prev) => ({ ...prev, contact: { ...prev.contact, phone: value } }))} />
            <Input label="Email" value={content.contact.email} onChange={(value) => setContent((prev) => ({ ...prev, contact: { ...prev.contact, email: value } }))} />
            <Input label="Address" value={content.contact.address} onChange={(value) => setContent((prev) => ({ ...prev, contact: { ...prev.contact, address: value } }))} />
            <Input label="Instagram" value={content.contact.instagram} onChange={(value) => setContent((prev) => ({ ...prev, contact: { ...prev.contact, instagram: value } }))} />
            <Input label="LinkedIn" value={content.contact.linkedin} onChange={(value) => setContent((prev) => ({ ...prev, contact: { ...prev.contact, linkedin: value } }))} />
            <Input label="Website" value={content.contact.website} onChange={(value) => setContent((prev) => ({ ...prev, contact: { ...prev.contact, website: value } }))} />
          </div>
        </section>

        <button type="button" onClick={() => setNotice("Changes saved automatically.")} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-600 to-violet-500 px-5 py-2.5 text-sm font-semibold text-white">
          <Save className="h-4 w-4" /> Save Changes
        </button>
      </div>
    </section>
  );
}

function Input({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
    </label>
  );
}

function TextArea({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="text-sm font-medium text-slate-700">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2" />
    </label>
  );
}

function Footer() {
  const { content: { brandName, services } } = useContent();
  return (
    <footer className="border-t border-slate-200 bg-slate-50/80">
      <div className="mx-auto grid max-w-7xl gap-10 px-5 py-12 md:grid-cols-4 md:px-8">
        <div>
          <BrandLogo />
          <p className="mt-4 text-sm text-slate-600">Premium digital products crafted with clarity, speed, and excellence.</p>
        </div>
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">Quick Links</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">
            {navLinks.slice(0, 5).map((item) => (<li key={item.to}><NavLink to={item.to} className="hover:text-slate-900">{item.label}</NavLink></li>))}
          </ul>
        </div>
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">Services</h2>
          <ul className="mt-3 space-y-2 text-sm text-slate-600">{services.map((item) => (<li key={item.name}>{item.name}</li>))}</ul>
        </div>
        <div>
          <h2 className="font-heading text-sm font-semibold uppercase tracking-[0.12em] text-slate-900">Social Media</h2>
          <div className="mt-3 flex items-center gap-3 text-slate-500"><AtSign className="h-4 w-4" /><Briefcase className="h-4 w-4" /><Mail className="h-4 w-4" /></div>
        </div>
      </div>
      <div className="border-t border-slate-200 py-4 text-center text-xs text-slate-500">Copyright {new Date().getFullYear()} {brandName}. All rights reserved.</div>
    </footer>
  );
}

function AppShell() {
  const location = useLocation();
  return (
    <div className="bg-white text-slate-900">
      <ScrollSetup />
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PageWrap><HomePage /></PageWrap>} />
          <Route path="/about" element={<PageWrap><AboutPage /></PageWrap>} />
          <Route path="/team" element={<PageWrap><TeamPage /></PageWrap>} />
          <Route path="/projects" element={<PageWrap><ProjectsPage /></PageWrap>} />
          <Route path="/user-login" element={<PageWrap><UserLoginPage /></PageWrap>} />
          <Route path="/admin-login" element={<PageWrap><AdminLoginPage /></PageWrap>} />
          <Route path="/user-dashboard" element={<PageWrap><UserDashboardPage /></PageWrap>} />
          <Route path="/admin-dashboard" element={<PageWrap><AdminDashboardPage /></PageWrap>} />
          <Route path="/contact" element={<PageWrap><ContactPage /></PageWrap>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

const ADMIN_EMAILS = ["hariomparasar0@gmail.com"];

export default function App() {
  const [content, setContent] = useState<SiteContent>(initialContent);
  const [isContentLoaded, setIsContentLoaded] = useState(false);

  const [authState, setAuthState] = useState<AuthState>({
    userLoggedIn: false,
    adminLoggedIn: false,
    userName: "",
    userEmail: "",
    adminEmail: "",
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser: User | null) => {
      if (firebaseUser) {
        const email = firebaseUser.email || "";
        const isAdmin = ADMIN_EMAILS.includes(email.toLowerCase());
        if (isAdmin) {
          setAuthState({
            userLoggedIn: false,
            adminLoggedIn: true,
            userName: "",
            userEmail: "",
            adminEmail: email,
          });
        } else {
          setAuthState({
            userLoggedIn: true,
            adminLoggedIn: false,
            userName: firebaseUser.displayName || email.split("@")[0],
            userEmail: email,
            adminEmail: "",
          });
        }
      } else {
        setAuthState({
          userLoggedIn: false,
          adminLoggedIn: false,
          userName: "",
          userEmail: "",
          adminEmail: "",
        });
      }
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const contentDocRef = doc(db, "siteContent", "main");
    const unsubscribe = onSnapshot(
      contentDocRef,
      async (snapshot) => {
        if (snapshot.exists()) {
          setContent(snapshot.data() as SiteContent);
        } else {
          try {
            await setDoc(contentDocRef, initialContent);
            setContent(initialContent);
          } catch (error) { console.error("Error initializing content:", error); }
        }
        setIsContentLoaded(true);
      },
      (error) => { console.error("Error loading content:", error); setIsContentLoaded(true); }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isContentLoaded) return;
    const saveTimer = setTimeout(async () => {
      try {
        const contentDocRef = doc(db, "siteContent", "main");
        await setDoc(contentDocRef, content);
      } catch (error) { console.error("Error saving content:", error); }
    }, 1000);
    return () => clearTimeout(saveTimer);
  }, [content, isContentLoaded]);

  const contentValue = useMemo<ContentContextValue>(() => ({
    content,
    setContent,
    resetContent: () => setContent(initialContent),
  }), [content]);

  const authValue = useMemo<AuthContextValue>(() => ({
    ...authState,
    loginUser: (name: string, email: string) => setAuthState((prev) => ({ ...prev, userLoggedIn: true, userName: name, userEmail: email })),
    logoutUser: async () => {
      await signOut(auth);
      setAuthState({ userLoggedIn: false, adminLoggedIn: false, userName: "", userEmail: "", adminEmail: "" });
    },
    loginAdmin: (email: string) => setAuthState((prev) => ({ ...prev, adminLoggedIn: true, adminEmail: email })),
    logoutAdmin: async () => {
      await signOut(auth);
      setAuthState({ userLoggedIn: false, adminLoggedIn: false, userName: "", userEmail: "", adminEmail: "" });
    },
  }), [authState]);

  if (!isContentLoaded) {
    return (
      <div className="flex h-screen items-center justify-center bg-slate-950">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
          <p className="mt-4 text-sm text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={authValue}>
      <ContentContext.Provider value={contentValue}>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </ContentContext.Provider>
    </AuthContext.Provider>
  );
}