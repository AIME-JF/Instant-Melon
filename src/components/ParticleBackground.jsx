import React, { useEffect, useRef } from 'react';

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

export default ParticleBackground;
