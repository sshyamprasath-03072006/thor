import { useState, useRef } from "react";
import { motion } from "motion/react";
import {
  MessageCircle,
  Repeat2,
  Heart,
  Share,
  BadgeCheck,
  Image as ImageIcon,
  Sparkles,
  MapPin,
  X,
} from "lucide-react";
import { useTranslation } from "../../context/TranslationContext";
import { useTheme } from "../../context/ThemeContext";

const MOCK_POSTS = [
  {
    id: 1,
    author: {
      name: "Rajesh Kumar",
      handle: "@rajesh_safari",
      verified: true,
      avatar: "R",
    },
    content:
      "Just finished a 3-day guided tour across Mahabalipuram! The new safety zones established by the tourism board made the night-walk completely stress-free. Highly recommend! 🏛️✨",
    image:
      "https://images.unsplash.com/photo-1582510003544-4d00b7f7415e?auto=format&fit=crop&q=80&w=800",
    location: "Tamil Nadu, India",
    time: "2h",
    likes: 124,
    replies: 12,
    reposts: 5,
    isLiked: false,
  },
  {
    id: 2,
    author: {
      name: "Sarah Jenkins",
      handle: "@sarahj_travels",
      verified: false,
      avatar: "S",
    },
    content:
      "Anyone traveling to Ooty this weekend? I'm looking for recommendations on verified local guides for trekking. Needs to be someone who speaks English and Tamil.",
    location: "Ooty, Kerala",
    time: "5h",
    likes: 42,
    replies: 8,
    reposts: 2,
    isLiked: true,
  },
  {
    id: 3,
    author: {
      name: "THOR Official",
      handle: "@guard_of_tourism",
      verified: true,
      avatar: "⚡",
    },
    content:
      "🚨 WEATHER ALERT: Heavy rainfall expected in the Nilgiris district over the next 48 hours. Please avoid steep trekking routes. Our AI Pulse systems are actively monitoring all registered travelers in the area.",
    location: "Global Command",
    time: "12h",
    likes: 892,
    replies: 45,
    reposts: 312,
    isLiked: false,
  },
];

export default function Community() {
  const { translate } = useTranslation();
  const { theme } = useTheme();
  const [posts, setPosts] = useState<any[]>(MOCK_POSTS);
  const [composeText, setComposeText] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePost = () => {
    if (!composeText.trim() && !selectedImage) return;

    const newPost = {
      id: Date.now(),
      author: {
        name: "Current User",
        handle: "@tourist",
        verified: false,
        avatar: "U",
      },
      content: composeText,
      image: selectedImage || undefined,
      location: "Current Location",
      time: "Just now",
      likes: 0,
      replies: 0,
      reposts: 0,
      isLiked: false,
    };

    setPosts([newPost, ...posts]);
    setComposeText("");
    setSelectedImage(null);
  };

  const handleLike = (id: number) => {
    setPosts(
      posts.map((p) =>
        p.id === id
          ? {
              ...p,
              isLiked: !p.isLiked,
              likes: p.isLiked ? p.likes - 1 : p.likes + 1,
            }
          : p,
      ),
    );
  };

  return (
    <div
      className="w-full max-w-2xl mx-auto min-h-screen pb-24 border-x"
      style={{
        background: "var(--thor-bg)",
        borderColor: "var(--thor-border)",
      }}
    >
      {/* Header */}
      <div
        className="sticky top-0 z-20 border-b px-5 py-4 flex items-center justify-between cursor-pointer backdrop-blur-md"
        style={{
          background: "var(--thor-surface)" + "f0",
          borderColor: "var(--thor-border)",
          boxShadow: "var(--thor-shadow-sm)",
        }}
      >
        <div className="flex items-center gap-3">
          <h1
            className="text-xl font-bold"
            style={{ color: "var(--thor-text)" }}
          >
            {translate("Community")}
          </h1>
        </div>
        <div
          className="p-2 rounded-lg"
          style={{ background: "var(--thor-brand)" + "15" }}
        >
          <Sparkles
            className="w-5 h-5"
            style={{ color: "var(--thor-brand)" }}
          />
        </div>
      </div>

      {/* Compose Area */}
      <div
        className="flex gap-4 p-5 border-b"
        style={{
          borderColor: "var(--thor-border)",
          background: "var(--thor-surface)" + "30",
        }}
      >
        <div
          className="w-12 h-12 rounded-full flex items-center justify-center font-bold shrink-0"
          style={{
            background:
              "linear-gradient(135deg, var(--thor-brand) 0%, var(--thor-brand-dark) 100%)",
            color: "#000000",
          }}
        >
          U
        </div>
        <div className="flex-1">
          <textarea
            value={composeText}
            onChange={(e) => setComposeText(e.target.value)}
            placeholder={translate("What's happening in your journey?")}
            className="w-full resize-none outline-none min-h-[50px] text-lg font-medium"
            style={{
              background: "transparent",
              color: "var(--thor-text)",
              fontSize: "1.125rem",
            }}
          />
          {selectedImage && (
            <div
              className="relative mt-3 mb-2 rounded-2xl overflow-hidden border w-fit"
              style={{ borderColor: "var(--thor-border)" }}
            >
              <img
                src={selectedImage}
                alt="Preview"
                className="max-h-[300px] w-auto object-cover"
              />
              <button
                onClick={() => setSelectedImage(null)}
                className="absolute top-2 right-2 text-white p-1.5 rounded-full backdrop-blur-md transition-colors"
                style={{ background: "rgba(0,0,0,0.6)" }}
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
          <div
            className="flex items-center justify-between pt-3 border-t mt-2"
            style={{ borderColor: "var(--thor-border)" + "50" }}
          >
            <div className="flex gap-4">
              <input
                type="file"
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleImageSelect}
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 rounded-full transition-colors"
                style={{
                  color: "var(--thor-info)",
                  backgroundColor: "var(--thor-info)" + "10",
                }}
              >
                <ImageIcon className="w-5 h-5" />
              </button>
              <button
                className="p-2 rounded-full transition-colors"
                style={{
                  color: "var(--thor-info)",
                  backgroundColor: "var(--thor-info)" + "10",
                }}
              >
                <MapPin className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={handlePost}
              disabled={!composeText.trim() && !selectedImage}
              className="font-bold px-4 py-1.5 rounded-full transition-colors"
              style={{
                background: "var(--thor-brand)",
                color: "#000000",
                opacity: !composeText.trim() && !selectedImage ? 0.5 : 1,
              }}
            >
              {translate("Post")}
            </button>
          </div>
        </div>
      </div>

      {/* Feed */}
      <div className="flex flex-col">
        {posts.map((post) => (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            key={post.id}
            className="p-4 border-b transition-colors cursor-pointer flex gap-3"
            style={{
              borderColor: "var(--thor-border)",
            }}
          >
            {/* Avatar */}
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center font-bold shrink-0"
              style={{
                background: "var(--thor-surface-2)",
                color: "var(--thor-text)",
              }}
            >
              {post.author.avatar}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              {/* Author Row */}
              <div className="flex items-center gap-1 text-sm mb-1">
                <span
                  className="font-bold truncate"
                  style={{ color: "var(--thor-text)" }}
                >
                  {post.author.name}
                </span>
                {post.author.verified && (
                  <BadgeCheck className="w-4 h-4 text-blue-500 shrink-0" />
                )}
                <span
                  className="truncate"
                  style={{ color: "var(--thor-text-muted)" }}
                >
                  {post.author.handle}
                </span>
                <span style={{ color: "var(--thor-text-muted)" }}>·</span>
                <span style={{ color: "var(--thor-text-muted)" }}>
                  {post.time}
                </span>
              </div>

              {/* Text */}
              <p
                className="text-[15px] leading-snug mb-3 whitespace-pre-wrap"
                style={{ color: "var(--thor-text)" }}
              >
                {post.content}
              </p>

              {/* Image Attachment */}
              {post.image && (
                <div
                  className="mb-3 rounded-2xl overflow-hidden border"
                  style={{ borderColor: "var(--thor-border)" }}
                >
                  <img
                    src={post.image}
                    alt="Post Attachment"
                    className="w-full max-h-[400px] object-cover"
                  />
                </div>
              )}

              {/* Location Tag */}
              {post.location && (
                <div
                  className="flex items-center gap-1.5 text-xs font-medium mb-3"
                  style={{ color: "var(--thor-info)" }}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {post.location}
                </div>
              )}

              {/* Actions Row */}
              <div
                className="flex items-center justify-between max-w-md"
                style={{ color: "var(--thor-text-muted)" }}
              >
                <button
                  className="flex items-center gap-2 group transition-colors"
                  style={{ color: "var(--thor-text-muted)" }}
                >
                  <div
                    className="p-2 rounded-full transition-colors"
                    style={{}}
                  >
                    <MessageCircle className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-xs">{post.replies}</span>
                </button>

                <button
                  className="flex items-center gap-2 group transition-colors"
                  style={{ color: "var(--thor-text-muted)" }}
                >
                  <div className="p-2 rounded-full transition-colors">
                    <Repeat2 className="w-[18px] h-[18px]" />
                  </div>
                  <span className="text-xs">{post.reposts}</span>
                </button>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post.id);
                  }}
                  className="flex items-center gap-2 group transition-colors"
                  style={{
                    color: post.isLiked
                      ? "var(--thor-danger)"
                      : "var(--thor-text-muted)",
                  }}
                >
                  <div
                    className="p-2 rounded-full transition-colors"
                    style={{
                      background: post.isLiked
                        ? "var(--thor-danger)" + "10"
                        : "transparent",
                    }}
                  >
                    <Heart
                      className="w-[18px] h-[18px]"
                      fill={post.isLiked ? "currentColor" : "none"}
                    />
                  </div>
                  <span className="text-xs">{post.likes}</span>
                </button>

                <button
                  className="flex items-center gap-2 group transition-colors"
                  style={{ color: "var(--thor-text-muted)" }}
                >
                  <div className="p-2 rounded-full transition-colors">
                    <Share className="w-[18px] h-[18px]" />
                  </div>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
