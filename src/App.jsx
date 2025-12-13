import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { MessageSquare, Heart, Share2, Send, Sparkles, Plus, X, ChevronDown, Quote, Star, Moon, Sun, Check } from 'lucide-react';

// --- 新版图标：西瓜时钟 (Melon Clock) ---
const MelonClockIcon = ({ size = 24, className = "", isSpinning = false }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="7" strokeOpacity="0.2" />
    <path d="M12 7V7.01" strokeWidth="3" />
    <path d="M17 12V12.01" strokeWidth="3" />
    <path d="M12 17V17.01" strokeWidth="3" />
    <path d="M7 12V12.01" strokeWidth="3" />
    <g className={isSpinning ? "animate-clock-spin" : ""} style={{ transformOrigin: "12px 12px" }}>
      <path d="M12 12L12 9" />
      <path d="M12 12L14.5 14.5" />
    </g>
  </svg>
);

// --- 修复版打字机 Hook ---
const useTypewriter = (text, speed = 30, startDelay = 300) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(true);

  useLayoutEffect(() => {
    setIsTyping(true);
    setDisplayedText("");
  }, [text]);

  useEffect(() => {
    if (!text) {
      setIsTyping(false);
      return;
    }
    let timeoutId;
    let currentIndex = 0;
    const startTimeout = setTimeout(() => {
      const typeChar = () => {
        if (currentIndex < text.length) {
          setDisplayedText(text.slice(0, currentIndex + 1));
          currentIndex++;
          const char = text[currentIndex - 1];
          const delay = (char === '，' || char === '。' || char === '？' || char === '！') ? speed * 8 : speed;
          timeoutId = setTimeout(typeChar, delay);
        } else {
          setIsTyping(false);
        }
      };
      typeChar();
    }, startDelay);
    return () => { clearTimeout(startTimeout); clearTimeout(timeoutId); };
  }, [text, speed, startDelay]);

  return { displayedText, isTyping };
};

// --- Toast 通知组件 ---
const Toast = ({ message, isVisible, onClose, theme }) => {
  useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(onClose, 2000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onClose]);

  if (!isVisible) return null;

  const isDark = theme === 'dark';
  const bgColor = isDark ? 'bg-zinc-800' : 'bg-white';
  const textColor = isDark ? 'text-white' : 'text-zinc-900';
  const borderColor = isDark ? 'border-white/10' : 'border-black/5';

  return (
    <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 px-6 py-3 rounded-full shadow-xl border ${bgColor} ${textColor} ${borderColor} animate-fade-in-down`}>
      <Check size={16} className={isDark ? "text-emerald-400" : "text-emerald-600"} />
      <span className="text-sm font-medium tracking-wide">{message}</span>
    </div>
  );
};

// --- 背景组件 ---
const ParticleBackground = ({ theme }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: -1000, y: -1000 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animationFrameId;
    let particles = [];

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initParticles();
    };

    const initParticles = () => {
      particles = [];
      const numParticles = Math.floor((canvas.width * canvas.height) / 7000);
      for (let i = 0; i < numParticles; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          size: Math.random() * 1.5 + 0.5,
          baseAlpha: Math.random() * 0.3 + 0.1,
          phase: Math.random() * Math.PI * 2,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          originX: 0, originY: 0, currentX: 0, currentY: 0,
        });
        particles[i].originX = particles[i].x;
        particles[i].originY = particles[i].y;
        particles[i].currentX = particles[i].x;
        particles[i].currentY = particles[i].y;
      }
    };

    const draw = (time) => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      if (theme === 'dark') {
        gradient.addColorStop(0, '#1c1b1a');
        gradient.addColorStop(1, '#171615');
      } else {
        gradient.addColorStop(0, '#f2f0e9');
        gradient.addColorStop(1, '#ebe8e0');
      }
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const t = time * 0.001;
      const maxDist = 200;
      const connectDist = 120;
      const damping = 0.05;

      particles.forEach(p => {
        p.originX += p.vx;
        p.originY += p.vy;

        if (p.originX < 0) { p.originX = canvas.width; p.currentX = canvas.width; }
        if (p.originX > canvas.width) { p.originX = 0; p.currentX = 0; }
        if (p.originY < 0) { p.originY = canvas.height; p.currentY = canvas.height; }
        if (p.originY > canvas.height) { p.originY = 0; p.currentY = 0; }

        const dx = mouseRef.current.x - p.originX;
        const dy = mouseRef.current.y - p.originY;
        const dist = Math.sqrt(dx * dx + dy * dy);

        let targetX = p.originX;
        let targetY = p.originY;
        let scale = 1;
        let alphaBoost = 0;

        if (dist < maxDist) {
          const force = Math.pow((maxDist - dist) / maxDist, 2);
          const angle = Math.atan2(dy, dx);
          const pushDistance = 150 * force;
          targetX -= Math.cos(angle) * pushDistance;
          targetY -= Math.sin(angle) * pushDistance;
          scale = 1 + force * 2;
          alphaBoost = force * 0.5;
        }

        p.currentX += (targetX - p.currentX) * damping;
        p.currentY += (targetY - p.currentY) * damping;

        const visualAlpha = Math.min(0.6, p.baseAlpha + Math.sin(t * 1.5 + p.phase) * 0.1 + alphaBoost);
        const visualSize = p.size * scale;

        p.renderX = p.currentX;
        p.renderY = p.currentY;
        p.renderAlpha = visualAlpha;
        p.renderSize = visualSize;
      });

      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].renderX - particles[j].renderX;
          const dy = particles[i].renderY - particles[j].renderY;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectDist) {
            const alpha = (1 - dist / connectDist) * 0.15;
            ctx.strokeStyle = theme === 'dark'
              ? `rgba(235, 232, 224, ${alpha})`
              : `rgba(74, 70, 60, ${alpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].renderX, particles[i].renderY);
            ctx.lineTo(particles[j].renderX, particles[j].renderY);
            ctx.stroke();
          }
        }
      }

      particles.forEach(p => {
        const color = theme === 'dark' ? '235, 232, 224' : '74, 70, 60';
        ctx.fillStyle = `rgba(${color}, ${p.renderAlpha})`;
        ctx.beginPath();
        ctx.arc(p.renderX, p.renderY, p.renderSize, 0, Math.PI * 2);
        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    const handleMouseMove = (e) => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
    };
    const handleTouchMove = (e) => {
      if (e.touches[0]) mouseRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
    };

    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('touchmove', handleTouchMove);
    resize();
    draw(0);

    return () => {
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  return <canvas ref={canvasRef} className="fixed inset-0 z-0 pointer-events-none" />;
};

// --- 主应用组件 ---
const InfiniteMelon = () => {
  const [theme, setTheme] = useState('light');

  // Toast 状态
  const [toastMessage, setToastMessage] = useState("");
  const [isToastVisible, setIsToastVisible] = useState(false);

  const showToast = (msg) => {
    setToastMessage(msg);
    setIsToastVisible(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  const [stories, setStories] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCommentOpen, setIsCommentOpen] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [newComment, setNewComment] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [cardAnimation, setCardAnimation] = useState("animate-card-enter");
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isPosting, setIsPosting] = useState(false);

  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);

  const currentStory = stories[currentIndex];
  // 如果没有故事，displayedText为空
  const { displayedText: displayedAiSummary, isTyping } = useTypewriter(currentStory?.aiSummary || "", 30, 500);

  // 初始化加载数据
  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    setIsInitialLoading(true);
    try {
      const response = await fetch('/api/stories');
      if (!response.ok) throw new Error('Failed to fetch stories');
      const data = await response.json();

      // 为每个story添加isLiked本地状态（如果是刚刷新，默认false，实际项目可能需要持久化）
      const processedStories = data.map(story => ({
        ...story,
        isLiked: false,
        // 格式化日期：这里简单处理，实际可使用 date-fns
        date: new Date(story.created_at).toLocaleString()
      }));
      setStories(processedStories);
    } catch (error) {
      console.error("Error fetching stories:", error);
      showToast("加载失败，请刷新重试");
    } finally {
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    if (isLoading && !isTransitioning && !isTyping) {
      setIsLoading(false);
    }
  }, [isTyping, isTransitioning, isLoading]);

  const handleNext = () => {
    if (isLoading || stories.length === 0) return;
    setIsLoading(true);
    setIsTransitioning(true);
    setCardAnimation("animate-card-exit-left");
    setIsCommentOpen(false);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev + 1) % stories.length);
      setCardAnimation("animate-card-enter-right");
      setIsTransitioning(false);
    }, 500);
  };

  const handlePrev = () => {
    if (isLoading || stories.length === 0) return;
    setIsLoading(true);
    setIsTransitioning(true);
    setCardAnimation("animate-card-exit-right");
    setIsCommentOpen(false);

    setTimeout(() => {
      setCurrentIndex((prev) => (prev - 1 + stories.length) % stories.length);
      setCardAnimation("animate-card-enter-left");
      setIsTransitioning(false);
    }, 500);
  };

  // 双击点赞动画状态
  const [likeAnimation, setLikeAnimation] = useState(false);

  const handleLike = async (isDoubleTap = false) => {
    if (!currentStory) return;
    const storyId = currentStory.id;
    const isLiked = currentStory.isLiked;

    // 如果是双击，只有未点赞时才点赞，已点赞则触发动画不取消
    if (isDoubleTap && isLiked) {
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 800);
      return;
    }

    // 乐观更新
    const updatedStories = [...stories];
    const storyIndex = updatedStories.findIndex(s => s.id === storyId);
    if (storyIndex === -1) return;

    const newIsLiked = !isLiked;
    const newLikes = updatedStories[storyIndex].likes + (newIsLiked ? 1 : -1);

    updatedStories[storyIndex] = {
      ...updatedStories[storyIndex],
      isLiked: newIsLiked,
      likes: newLikes
    };
    setStories(updatedStories);

    if (newIsLiked) {
      setLikeAnimation(true);
      setTimeout(() => setLikeAnimation(false), 800);
    }

    // 提交到服务器
    try {
      const response = await fetch(`/api/stories/${storyId}/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ likes: newLikes }),
      });

      if (!response.ok) throw new Error('Failed to update likes');
    } catch (error) {
      console.error("Error updating likes:", error);
      // 回滚（可选，这里暂不做复杂回滚）
      showToast("点赞失败");
    }
  };

  // 处理分享逻辑
  const handleShare = () => {
    if (!currentStory) return;
    const shareText = `【即刻瓜田】${currentStory.content.substring(0, 30)}... \n\n吃瓜链接：https://guatian.app/s/${currentStory.id}`;

    if (navigator.share) {
      navigator.share({
        title: '即刻瓜田',
        text: shareText,
        url: window.location.href,
      }).catch(console.error);
    } else {
      // 降级处理：复制到剪贴板
      const textArea = document.createElement("textarea");
      textArea.value = shareText;
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        showToast("瓜链接已复制");
      } catch (err) {
        showToast("复制失败");
      }
      document.body.removeChild(textArea);
    }
  };

  const handleCommentSubmit = async () => {
    if (!newComment.trim() || !currentStory) return;

    const tempId = Date.now();
    const commentText = newComment;

    // 乐观更新
    const updatedStories = [...stories];
    const storyIndex = currentIndex;
    const newCommentObj = {
      id: tempId,
      user: "匿名用户",
      text: commentText
    };

    // 确保 comments 数组存在
    if (!updatedStories[storyIndex].comments) {
      updatedStories[storyIndex].comments = [];
    }
    updatedStories[storyIndex].comments.unshift(newCommentObj);
    setStories(updatedStories);
    setNewComment("");

    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          story_id: currentStory.id,
          user: "匿名用户",
          text: commentText
        }),
      });

      if (!response.ok) throw new Error('Failed to post comment');

      const realComment = await response.json();

      // 更新ID为真实ID
      setStories(prev => {
        const nextStories = [...prev];
        const sIdx = nextStories.findIndex(s => s.id === currentStory.id);
        if (sIdx !== -1) {
          const cIdx = nextStories[sIdx].comments.findIndex(c => c.id === tempId);
          if (cIdx !== -1) {
            nextStories[sIdx].comments[cIdx] = realComment;
          }
        }
        return nextStories;
      });
      showToast("评论已发布");
    } catch (error) {
      console.error("Error posting comment:", error);
      showToast("评论发布失败");
      // 回滚乐观更新
      setStories(prev => {
        const nextStories = [...prev];
        const sIdx = nextStories.findIndex(s => s.id === currentStory.id);
        if (sIdx !== -1) {
          nextStories[sIdx].comments = nextStories[sIdx].comments.filter(c => c.id !== tempId);
        }
        return nextStories;
      });
    }
  };

  const handlePostSubmit = async () => {
    if (!newContent.trim()) return;
    setIsPosting(true);

    const content = newContent;
    let finalSummary = "AI 生成失败";

    // AI 生成逻辑，带重试
    const fetchAiSummary = async (text, retries = 3) => {
      const apiKey = "sk-EaIEkoMJooD2u40rZM3BJdmZyusfeaHCuHJAXedjBGL3QsmK";
      const prompt = "扮演一个毒舌故事总结家，喜欢用30字以内的精炼中文语句总结锐评故事";

      for (let i = 0; i < retries; i++) {
        try {
          // Use local proxy /api/ai which maps to -> https://kfc-api.sxxe.net/v1/chat/completions
          const response = await fetch("/api/ai", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${apiKey}`,
              // User-Agent is handled by Vite proxy
            },
            body: JSON.stringify({
              model: "gpt-4o-mini",
              temperature: 0.8, // 增加多样性
              messages: [
                { role: "system", content: prompt },
                { role: "user", content: `${text}\n\n(Request ID: ${Date.now()})` } // 添加随机 ID 防止缓存
              ]
            })
          });

          if (!response.ok) throw new Error("API call failed");

          const data = await response.json();
          const summary = data.choices[0]?.message?.content?.trim();

          // 校验逻辑：非空，且不等于原内容（部分失败模型会复读），且不包含错误关键词
          if (summary && summary !== text && summary.length > 2) {
            return summary;
          }
          console.warn(`Attempt ${i + 1}: Invalid summary generated:`, summary);
        } catch (err) {
          console.error(`Attempt ${i + 1}: AI generation error:`, err);
        }
        // 简单延迟重试
        await new Promise(res => setTimeout(res, 500));
      }
      return null;
    };

    try {
      console.log("Starting AI generation...");
      const generatedSummary = await fetchAiSummary(content);
      console.log("AI Summary Result:", generatedSummary);

      if (generatedSummary) {
        finalSummary = generatedSummary;
      } else {
        console.warn("AI generation returned null, using fallback.");
        finalSummary = content.substring(0, 30) + "...(AI罢工了)";
      }

      console.log("Inserting into Server:", { content, aiSummary: finalSummary });

      // 插入服务器
      const response = await fetch('/api/stories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: content,
          aiSummary: finalSummary,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to post story');
      }

      const newStory = await response.json();
      console.log("Server Insert Success:", newStory);

      // 补充本地字段以匹配组件格式
      newStory.isLiked = false;
      newStory.comments = [];
      newStory.date = "刚刚";
      // 临时计算一个 displayId，实际刷新后会由后端重新分配
      // 获取当前最大 displayId + 1，如果列表为空则为 1
      const maxDisplayId = stories.length > 0 ? Math.max(...stories.map(s => s.displayId || 0)) : 0;
      newStory.displayId = maxDisplayId + 1;

      setStories([newStory, ...stories]);
      setCurrentIndex(0);
      setNewContent("");
      setIsModalOpen(false);
      showToast("投稿发布成功");

    } catch (error) {
      console.error("Post processing failed:", error);
      showToast(`发布失败: ${error.message}`);
    } finally {
      setIsPosting(false);
    }
  };

  const minSwipeDistance = 50;
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };
  const onTouchMove = (e) => setTouchEnd(e.targetTouches[0].clientX);
  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    if (distance > minSwipeDistance) handleNext();
    else if (distance < -minSwipeDistance) handlePrev();
  };

  // --- 样式配置 ---
  const isDark = theme === 'dark';
  const colors = {
    bg: isDark ? 'bg-[#1c1b1a]' : 'bg-[#f2f0e9]',
    text: isDark ? 'text-[#ebe8e0]' : 'text-[#3e3c38]',
    accent: isDark ? 'text-[#aab396]' : 'text-[#656d4a]',
    selection: isDark ? 'selection:bg-[#aab396] selection:text-[#1c1b1a]' : 'selection:bg-[#656d4a] selection:text-[#f2f0e9]',
    card: {
      bg: isDark ? 'bg-[#262524]/60' : 'bg-[#ffffff]/60',
      border: isDark ? 'border-[#ffffff]/5' : 'border-[#3e3c38]/5',
      shadow: isDark ? 'shadow-[0_20px_60px_-15px_rgba(0,0,0,0.6)]' : 'shadow-[0_20px_40px_-10px_rgba(62,60,56,0.08)]',
      textPrimary: isDark ? 'text-[#ebe8e0]' : 'text-[#3e3c38]',
      textSecondary: isDark ? 'text-[#8c8a85]' : 'text-[#8c8a85]',
      textSerif: isDark ? 'text-[#d6d3cd]' : 'text-[#2b2a28]',
      divider: isDark ? 'border-[#ffffff]/5' : 'border-[#3e3c38]/5',
      glow: isDark ? 'bg-[#aab396]/10' : 'bg-[#d4b996]/30',
      glowBlend: isDark ? '' : 'mix-blend-multiply',
    },
    aiBox: {
      bg: isDark ? 'bg-[#171615]/40' : 'bg-[#f7f6f2]',
      text: isDark ? 'text-[#8c8a85]' : 'text-[#6e6c67]',
    },
    button: {
      bg: isDark ? 'bg-[#ebe8e0]' : 'bg-[#3e3c38]',
      text: isDark ? 'text-[#1c1b1a]' : 'text-[#f2f0e9]',
      hover: isDark ? 'hover:bg-[#ffffff]' : 'hover:bg-[#2b2a28]',
    },
    icon: {
      default: isDark ? 'text-[#8c8a85]' : 'text-[#a1a1aa]',
      active: isDark ? 'text-[#ebe8e0]' : 'text-[#3e3c38]',
      hoverBg: isDark ? 'hover:bg-[#ffffff]/5' : 'hover:bg-[#3e3c38]/5',
    },
    modal: {
      overlay: isDark ? 'bg-[#000000]/60' : 'bg-[#3e3c38]/20',
      bg: isDark ? 'bg-[#1c1b1a]' : 'bg-[#f7f6f2]',
      border: isDark ? 'border-[#ffffff]/10' : 'border-[#3e3c38]/5',
      text: isDark ? 'text-[#ebe8e0]' : 'text-[#3e3c38]',
      placeholder: isDark ? 'placeholder:text-[#8c8a85]' : 'placeholder:text-[#a1a1aa]',
      btnBg: isDark ? 'bg-[#aab396]' : 'bg-[#656d4a]',
      btnText: isDark ? 'text-[#1c1b1a]' : 'text-[#f2f0e9]',
    },
    drawer: {
      bg: isDark ? 'bg-[#1c1b1a]' : 'bg-[#f7f6f2]',
      handle: isDark ? 'bg-[#3e3c38]' : 'bg-[#e5e5e5]',
      inputBg: isDark ? 'bg-[#262524]' : 'bg-[#ffffff]',
    }
  };

  if (isInitialLoading) {
    return (
      <div className={`min-h-screen w-full flex items-center justify-center ${colors.bg} ${colors.text} transition-colors duration-500`}>
        <div className="flex flex-col items-center gap-4">
          <MelonClockIcon size={48} className={`animate-spin ${colors.accent}`} />
          <span className="text-sm font-bold tracking-widest opacity-60">瓜田数据加载中...</span>
        </div>
      </div>
    );
  }

  // --- 空状态处理 ---
  if (stories.length === 0) {
    return (
      <div className={`relative min-h-screen w-full overflow-hidden font-sans transition-colors duration-500 ${colors.bg} ${colors.text}`}>
        <ParticleBackground theme={theme} />
        <header className={`fixed top-0 w-full z-20 px-6 py-6 flex justify-between items-center pointer-events-none transition-colors duration-500`}>
          <div className="flex items-center gap-4 pointer-events-auto group">
            <div className={`w-12 h-12 rounded-2xl border ${colors.card.border} ${isDark ? 'bg-[#262524]/60' : 'bg-[#ffffff]/60'} backdrop-blur-md flex items-center justify-center shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:shadow-md`}>
              <MelonClockIcon size={24} className={`${colors.accent} transition-colors duration-500`} />
            </div>
            <div className="flex flex-col">
              <h1 className={`text-sm font-bold tracking-[0.2em] uppercase ${colors.text} transition-colors duration-500`}>即刻瓜田</h1>
              <span className={`text-[9px] tracking-wider ${colors.card.textSecondary} opacity-60`}>INSTANT MELON FIELD</span>
            </div>
          </div>

          <div className="flex items-center gap-3 pointer-events-auto">
            <button
              onClick={toggleTheme}
              className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md ${isDark ? 'bg-[#262524]/60 border-white/5 text-white/60 hover:text-white' : 'bg-[#ffffff]/60 border-[#3e3c38]/5 text-[#3e3c38]/60 hover:text-[#3e3c38]'}`}
            >
              {isDark ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className={`px-5 py-2.5 rounded-full border backdrop-blur-md transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md group flex items-center gap-2 ${isDark ? 'bg-[#262524]/60 border-white/5 hover:bg-[#262524]' : 'bg-[#ffffff]/60 border-[#3e3c38]/5 hover:bg-[#ffffff]'}`}
            >
              <Plus size={16} className={`${colors.card.textSecondary} group-hover:${colors.text}`} />
              <span className={`text-[11px] font-bold tracking-widest ${colors.card.textSecondary} group-hover:${colors.text}`}>投稿</span>
            </button>
          </div>
        </header>

        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 w-full">
          <div className={`text-center space-y-4 ${colors.card.textSecondary}`}>
            <div className="w-24 h-24 mx-auto rounded-full bg-black/5 flex items-center justify-center mb-6">
              <Sparkles size={40} className="opacity-50" />
            </div>
            <h2 className={`text-xl font-bold tracking-widest ${colors.card.textPrimary}`}>暂无瓜田</h2>
            <p className="text-sm font-serif italic max-w-xs mx-auto leading-relaxed opacity-80">
              这里还没有种子。不如点击右上角，种下第一颗瓜？
            </p>
          </div>
        </main>

        {/* 复用投稿模态框 */}
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
            <div className={`absolute inset-0 ${colors.modal.overlay} backdrop-blur-lg`} onClick={() => setIsModalOpen(false)}></div>
            <div className={`${colors.modal.bg} border ${colors.modal.border} w-full max-w-md shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300 p-8 rounded-2xl`}>
              <div className="flex justify-between items-center mb-6">
                <h3 className={`font-bold ${colors.card.textPrimary} tracking-widest text-sm`}>发布新瓜</h3>
                <button onClick={() => setIsModalOpen(false)} className={`${colors.icon.default} hover:${colors.card.textPrimary} transition-colors`}>
                  <X size={20} />
                </button>
              </div>
              <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="讲讲你的故事..." className={`w-full h-40 bg-transparent text-lg font-serif ${colors.modal.text} ${colors.modal.placeholder} focus:outline-none resize-none leading-relaxed`} autoFocus></textarea>
              <div className={`mt-6 flex justify-between items-end border-t ${colors.modal.border} pt-6`}>
                <div className="flex flex-col gap-1">
                  <span className={`text-[10px] ${colors.card.textSecondary} uppercase tracking-widest flex items-center gap-1`}>
                    <Star size={10} />
                    AI 智能分析
                  </span>
                  <span className={`text-[10px] ${colors.aiBox.text}`}>自动生成</span>
                </div>
                <button onClick={handlePostSubmit} disabled={!newContent.trim() || isPosting} className={`${colors.modal.btnBg} ${colors.modal.btnText} px-6 py-2.5 rounded-full text-[11px] font-bold tracking-[0.2em] hover:opacity-90 disabled:opacity-50 transition-all hover:scale-105 flex items-center gap-2`}>
                  {isPosting && <MelonClockIcon size={14} className="animate-spin" />}
                  {isPosting ? "生成中..." : "发布"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // --- 正常渲染 ---
  return (
    <div className={`relative min-h-screen w-full overflow-hidden font-sans transition-colors duration-500 ${colors.bg} ${colors.text} ${colors.selection}`}>
      <ParticleBackground theme={theme} />

      {/* Toast 通知容器 */}
      <Toast message={toastMessage} isVisible={isToastVisible} onClose={() => setIsToastVisible(false)} theme={theme} />

      <header className={`fixed top-0 w-full z-20 px-6 py-6 flex justify-between items-center pointer-events-none transition-colors duration-500`}>
        <div className="flex items-center gap-4 pointer-events-auto group">
          <div className={`w-12 h-12 rounded-2xl border ${colors.card.border} ${isDark ? 'bg-[#262524]/60' : 'bg-[#ffffff]/60'} backdrop-blur-md flex items-center justify-center shadow-sm transition-all duration-500 group-hover:scale-105 group-hover:shadow-md`}>
            <MelonClockIcon size={24} className={`${colors.accent} transition-colors duration-500`} />
          </div>
          <div className="flex flex-col">
            <h1 className={`text-sm font-bold tracking-[0.2em] uppercase ${colors.text} transition-colors duration-500`}>即刻瓜田</h1>
            <span className={`text-[9px] tracking-wider ${colors.card.textSecondary} opacity-60`}>INSTANT MELON FIELD</span>
          </div>
        </div>

        <div className="flex items-center gap-3 pointer-events-auto">
          <button
            onClick={toggleTheme}
            className={`w-10 h-10 rounded-full flex items-center justify-center border backdrop-blur-md transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md ${isDark ? 'bg-[#262524]/60 border-white/5 text-white/60 hover:text-white' : 'bg-[#ffffff]/60 border-[#3e3c38]/5 text-[#3e3c38]/60 hover:text-[#3e3c38]'}`}
          >
            {isDark ? <Sun size={18} /> : <Moon size={18} />}
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className={`px-5 py-2.5 rounded-full border backdrop-blur-md transition-all duration-300 active:scale-95 shadow-sm hover:shadow-md group flex items-center gap-2 ${isDark ? 'bg-[#262524]/60 border-white/5 hover:bg-[#262524]' : 'bg-[#ffffff]/60 border-[#3e3c38]/5 hover:bg-[#ffffff]'}`}
          >
            <Plus size={16} className={`${colors.card.textSecondary} group-hover:${colors.text}`} />
            <span className={`text-[11px] font-bold tracking-widest ${colors.card.textSecondary} group-hover:${colors.text}`}>投稿</span>
          </button>
        </div>
      </header>

      <main
        className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20 w-full max-w-lg mx-auto"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className={`w-full relative preserve-3d transition-all duration-500 ease-out ${cardAnimation}`}>
          <div className={`${colors.card.bg} backdrop-blur-xl border ${colors.card.border} ${colors.card.shadow} rounded-[2rem] p-8 md:p-10 relative flex flex-col min-h-[500px] overflow-hidden transition-colors duration-500`}>

            <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full blur-3xl pointer-events-none ${colors.card.glow} ${colors.card.glowBlend} transition-colors duration-500`}></div>

            <div className={`flex justify-between items-end mb-8 border-b ${colors.card.divider} pb-4 transition-colors duration-500`}>
              <div className="flex flex-col gap-1.5">
                <span className={`text-[10px] ${colors.card.textSecondary} font-bold tracking-[0.2em] uppercase flex items-center gap-2`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isDark ? 'bg-[#aab396]' : 'bg-[#656d4a]'} shadow-sm`}></span>
                  编号 {(currentStory.displayId || 0).toString().padStart(3, '0')}
                </span>
                <span className={`text-xs font-serif italic ${colors.card.textSecondary} opacity-80`}>匿名投稿</span>
              </div>
              <span className={`text-[10px] font-mono ${colors.card.textSecondary}`}>{currentStory.date}</span>
            </div>

            {/* 故事内容区 - 支持双击点赞 */}
            <div
              className="flex-1 mb-10 relative group cursor-pointer"
              onDoubleClick={() => handleLike(true)}
            >
              <Quote size={32} className={`absolute -top-3 -left-3 rotate-180 transition-colors ${colors.card.textSecondary} opacity-10`} />
              <p className={`relative z-10 text-lg md:text-xl leading-8 font-serif ${colors.card.textSerif} font-medium whitespace-pre-wrap tracking-wide text-justify select-none transition-colors duration-500`}>
                {currentStory.content}
              </p>

              {/* 点赞时的中心爱心爆裂动画 */}
              {likeAnimation && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <Heart size={80} className="fill-[#bf616a] text-[#bf616a] animate-heart-burst" />
                </div>
              )}
            </div>

            <div className="mb-10 relative min-h-[5rem]">
              <div className={`absolute inset-0 rounded-xl blur-sm transform scale-95 opacity-0 transition-opacity group-hover:opacity-100 ${isDark ? 'bg-white/5' : 'bg-black/5'}`}></div>
              <div className={`relative ${colors.aiBox.bg} rounded-xl p-4 border ${colors.card.divider} h-full transition-colors duration-500`}>
                <div className={`flex items-center gap-2 mb-2 ${colors.aiBox.text} text-[10px] font-bold uppercase tracking-widest`}>
                  <Sparkles size={10} className={isDark ? 'text-[#d4b996]' : 'text-[#8c7e6a]'} />
                  <span>AI 总结</span>
                </div>
                <p className={`text-sm ${colors.aiBox.text} font-mono leading-relaxed`}>
                  {displayedAiSummary}
                  {isTyping && (
                    <span className={`animate-pulse inline-block w-1.5 h-3 ml-1 align-middle ${isDark ? 'bg-[#8c8a85]' : 'bg-[#a1a1aa]'}`}></span>
                  )}
                </p>
              </div>
            </div>

            <div className={`mt-auto flex items-center justify-between pt-6 border-t ${colors.card.divider} transition-colors duration-500`}>
              <div className="flex gap-6">
                <button
                  onClick={() => handleLike(false)}
                  className={`flex items-center gap-2 group px-3 py-1.5 rounded-full ${colors.icon.hoverBg} transition-all duration-300`}
                >
                  <Heart
                    size={18}
                    className={`transition-all duration-300 ${currentStory.isLiked ? 'fill-[#bf616a] text-[#bf616a] scale-110' : `${colors.icon.default} group-hover:${colors.icon.active}`}`}
                  />
                  <span className={`text-xs font-mono transition-colors ${currentStory.isLiked ? 'text-[#bf616a]' : `${colors.icon.default} group-hover:${colors.icon.active}`}`}>
                    {currentStory.likes}
                  </span>
                </button>
                <button
                  onClick={() => setIsCommentOpen(true)}
                  className={`flex items-center gap-2 group px-3 py-1.5 rounded-full ${colors.icon.hoverBg} transition-all duration-300`}
                >
                  <MessageSquare size={18} className={`${colors.icon.default} group-hover:${colors.icon.active} transition-colors`} />
                  <span className={`text-xs font-mono ${colors.icon.default} group-hover:${colors.icon.active} transition-colors`}>
                    {currentStory.comments ? currentStory.comments.length : 0}
                  </span>
                </button>
              </div>
              <button
                onClick={handleShare}
                className={`${colors.icon.default} group-hover:${colors.icon.active} transition-colors p-2 ${colors.icon.hoverBg} rounded-full`}
              >
                {/* 分享图标改为复制/分享 */}
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </main>

      <div className="fixed bottom-12 left-0 w-full flex justify-center px-6 z-20 pointer-events-none">
        <button
          onClick={handleNext}
          disabled={isLoading || stories.length === 0}
          className={`pointer-events-auto group ${colors.button.bg} backdrop-blur-sm ${colors.button.text} px-10 py-4 rounded-full shadow-lg ${colors.button.hover} transition-all duration-500 ease-out flex items-center gap-3 disabled:opacity-80 disabled:scale-95 min-w-[160px] justify-center`}
        >
          {isLoading ? (
            <MelonClockIcon size={20} className={`${colors.accent} opacity-80`} isSpinning={true} />
          ) : (
            <>
              <span className="text-[11px] font-bold tracking-[0.2em]">下一个瓜</span>
              <ChevronDown size={14} className="group-hover:translate-y-0.5 transition-transform opacity-50" />
            </>
          )}
        </button>
      </div>

      <div className={`fixed inset-0 z-50 transition-all duration-500 ${isCommentOpen ? `${colors.modal.overlay} backdrop-blur-sm visible opacity-100` : 'invisible opacity-0 pointer-events-none'}`} onClick={() => setIsCommentOpen(false)}>
        <div className={`absolute bottom-0 left-0 w-full ${colors.drawer.bg} border-t ${colors.modal.border} rounded-t-[2rem] shadow-2xl transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) flex flex-col max-h-[85vh] ${isCommentOpen ? 'translate-y-0' : 'translate-y-full'}`} onClick={e => e.stopPropagation()}>
          <div className="w-full flex justify-center pt-4 pb-2" onClick={() => setIsCommentOpen(false)}>
            <div className={`w-12 h-1 ${colors.drawer.handle} rounded-full`}></div>
          </div>
          <div className={`px-8 py-4 border-b ${colors.card.divider} flex justify-between items-center`}>
            <h3 className={`text-sm font-bold tracking-widest ${colors.card.textPrimary}`}>评论 ({currentStory.comments ? currentStory.comments.length : 0})</h3>
            <button onClick={() => setIsCommentOpen(false)} className={`${colors.icon.default} hover:${colors.card.textPrimary} transition-colors p-2`}>
              <X size={20} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-8 space-y-8">
            {currentStory.comments && currentStory.comments.length > 0 ? (
              currentStory.comments.map(comment => (
                <div key={comment.id} className="flex gap-4 group">
                  <div className={`w-8 h-8 rounded-full ${colors.drawer.inputBg} border ${colors.card.divider} flex items-center justify-center text-xs font-bold ${colors.card.textSecondary} shrink-0 font-serif`}>
                    {comment.user ? comment.user[0] : "匿"}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1.5">
                      <span className={`text-xs font-bold ${colors.card.textPrimary} tracking-wider`}>{comment.user}</span>
                      <span className={`text-[10px] ${colors.card.textSecondary} font-mono`}>刚刚</span>
                    </div>
                    <p className={`text-sm ${colors.aiBox.text} font-serif leading-relaxed font-light group-hover:${colors.card.textPrimary} transition-colors`}>{comment.text}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className={`py-20 text-center ${colors.card.textSecondary} flex flex-col items-center gap-4`}>
                <MessageSquare size={24} strokeWidth={1} />
                <p className="text-xs tracking-widest">暂无评论</p>
              </div>
            )}
          </div>
          <div className={`p-6 ${colors.drawer.bg} border-t ${colors.card.divider}`}>
            <div className={`flex items-center gap-3 ${colors.drawer.inputBg} border ${colors.card.divider} rounded-full px-4 py-1 focus-within:border-current transition-colors`}>
              <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="分享你的看法..." className={`flex-1 bg-transparent py-3 text-sm ${colors.card.textPrimary} ${colors.modal.placeholder} focus:outline-none font-serif`} onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()} />
              <button onClick={handleCommentSubmit} disabled={!newComment.trim()} className={`p-2 ${colors.icon.default} hover:${colors.card.textPrimary} disabled:opacity-30 transition-colors`}>
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6">
          <div className={`absolute inset-0 ${colors.modal.overlay} backdrop-blur-lg`} onClick={() => setIsModalOpen(false)}></div>
          <div className={`${colors.modal.bg} border ${colors.modal.border} w-full max-w-md shadow-2xl relative z-10 animate-in fade-in zoom-in duration-300 p-8 rounded-2xl`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`font-bold ${colors.card.textPrimary} tracking-widest text-sm`}>发布新瓜</h3>
              <button onClick={() => setIsModalOpen(false)} className={`${colors.icon.default} hover:${colors.card.textPrimary} transition-colors`}>
                <X size={20} />
              </button>
            </div>
            <textarea value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="讲讲你的故事..." className={`w-full h-40 bg-transparent text-lg font-serif ${colors.modal.text} ${colors.modal.placeholder} focus:outline-none resize-none leading-relaxed`} autoFocus></textarea>
            <div className={`mt-6 flex justify-between items-end border-t ${colors.modal.border} pt-6`}>
              <div className="flex flex-col gap-1">
                <span className={`text-[10px] ${colors.card.textSecondary} uppercase tracking-widest flex items-center gap-1`}>
                  <Star size={10} />
                  AI 智能分析
                </span>
                <span className={`text-[10px] ${colors.aiBox.text}`}>自动生成</span>
              </div>
              <button onClick={handlePostSubmit} disabled={!newContent.trim() || isPosting} className={`${colors.modal.btnBg} ${colors.modal.btnText} px-6 py-2.5 rounded-full text-[11px] font-bold tracking-[0.2em] hover:opacity-90 disabled:opacity-50 transition-all hover:scale-105 flex items-center gap-2`}>
                {isPosting && <MelonClockIcon size={14} className="animate-spin" />}
                {isPosting ? "生成中..." : "发布"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @keyframes card-enter-right { from { opacity: 0; transform: translateX(50px) scale(0.96) rotateY(-5deg); } to { opacity: 1; transform: translateX(0) scale(1) rotateY(0deg); } }
        @keyframes card-exit-left { from { opacity: 1; transform: translateX(0) scale(1) rotateY(0deg); } to { opacity: 0; transform: translateX(-50px) scale(0.96) rotateY(5deg); } }
        @keyframes card-enter-left { from { opacity: 0; transform: translateX(-50px) scale(0.96) rotateY(5deg); } to { opacity: 1; transform: translateX(0) scale(1) rotateY(0deg); } }
        @keyframes card-exit-right { from { opacity: 1; transform: translateX(0) scale(1) rotateY(0deg); } to { opacity: 0; transform: translateX(50px) scale(0.96) rotateY(-5deg); } }
        
        @keyframes clock-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .animate-clock-spin { animation: clock-spin 1.5s linear infinite; }

        @keyframes fade-in-down { from { opacity: 0; transform: translate(-50%, -20px); } to { opacity: 1; transform: translate(-50%, 0); } }
        .animate-fade-in-down { animation: fade-in-down 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }

        @keyframes heart-burst {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); opacity: 1; }
          100% { transform: scale(1); opacity: 0; }
        }
        .animate-heart-burst { animation: heart-burst 0.6s ease-out forwards; }
      `}</style>
    </div>
  );
};

export default InfiniteMelon;
