"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

export function AnimatedGlobe() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMounted, setIsMounted] = useState(false);

    // Prevent hydration mismatch by only rendering on client
    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const canvas = canvasRef.current;
        if (!canvas) return;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        let animationId: number;
        let rotation = 0;

        // Set canvas size
        const setCanvasSize = () => {
            const rect = canvas.getBoundingClientRect();
            const dpr = window.devicePixelRatio || 1;
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            ctx.scale(dpr, dpr);
        };

        setCanvasSize();

        const width = canvas.getBoundingClientRect().width;
        const height = canvas.getBoundingClientRect().height;
        const centerX = width / 2;
        const centerY = height / 2;
        const radius = Math.min(width, height) * 0.42;

        // Generate dots for the globe
        const dots: Array<{ lat: number; lng: number; size: number }> = [];
        for (let lat = -80; lat <= 80; lat += 8) {
            const latRad = (lat * Math.PI) / 180;
            const circumference = Math.cos(latRad);
            const dotsAtLat = Math.max(1, Math.floor(circumference * 36));
            for (let i = 0; i < dotsAtLat; i++) {
                const lng = (i / dotsAtLat) * 360 - 180;
                dots.push({
                    lat: latRad,
                    lng: (lng * Math.PI) / 180,
                    size: 1.5 + Math.random() * 1,
                });
            }
        }

        // Generate connection lines (flight paths)
        const connections = [
            { from: { lat: 40.7, lng: -74 }, to: { lat: 51.5, lng: -0.1 } },
            { from: { lat: 35.7, lng: 139.7 }, to: { lat: -33.9, lng: 151.2 } },
            { from: { lat: 1.3, lng: 103.8 }, to: { lat: 22.3, lng: 114.2 } },
            { from: { lat: 48.9, lng: 2.3 }, to: { lat: 55.8, lng: 37.6 } },
            { from: { lat: 37.8, lng: -122.4 }, to: { lat: 35.7, lng: 139.7 } },
            { from: { lat: -23.5, lng: -46.6 }, to: { lat: 40.7, lng: -74 } },
        ].map((c) => ({
            from: { lat: (c.from.lat * Math.PI) / 180, lng: (c.from.lng * Math.PI) / 180 },
            to: { lat: (c.to.lat * Math.PI) / 180, lng: (c.to.lng * Math.PI) / 180 },
        }));

        // Particles for ambient effect
        const particles: Array<{
            x: number;
            y: number;
            vx: number;
            vy: number;
            size: number;
            opacity: number;
        }> = [];
        for (let i = 0; i < 50; i++) {
            particles.push({
                x: Math.random() * width,
                y: Math.random() * height,
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                size: Math.random() * 2 + 0.5,
                opacity: Math.random() * 0.4 + 0.1,
            });
        }

        const project = (lat: number, lng: number, rotY: number) => {
            const x = Math.cos(lat) * Math.sin(lng + rotY);
            const y = Math.sin(lat);
            const z = Math.cos(lat) * Math.cos(lng + rotY);
            return {
                x: centerX + x * radius,
                y: centerY - y * radius,
                z,
                visible: z > -0.1,
            };
        };

        const draw = () => {
            ctx.clearRect(0, 0, width, height);

            // Draw ambient particles - cyan colored
            particles.forEach((p) => {
                p.x += p.vx;
                p.y += p.vy;
                if (p.x < 0 || p.x > width) p.vx *= -1;
                if (p.y < 0 || p.y > height) p.vy *= -1;

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(6, 182, 212, ${p.opacity})`;
                ctx.fill();
            });

            // Draw globe glow - subtle cyan gradient
            const gradient = ctx.createRadialGradient(
                centerX,
                centerY,
                radius * 0.3,
                centerX,
                centerY,
                radius * 1.2
            );
            gradient.addColorStop(0, "rgba(6, 182, 212, 0.08)");
            gradient.addColorStop(0.5, "rgba(6, 182, 212, 0.04)");
            gradient.addColorStop(0.8, "rgba(6, 182, 212, 0.01)");
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Draw globe outline - cyan
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(6, 182, 212, 0.4)";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Inner glow ring
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 0.98, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(6, 182, 212, 0.2)";
            ctx.lineWidth = 4;
            ctx.stroke();

            // Draw latitude lines - cyan
            for (let lat = -60; lat <= 60; lat += 30) {
                const latRad = (lat * Math.PI) / 180;
                ctx.beginPath();
                let started = false;
                for (let lng = 0; lng <= 360; lng += 5) {
                    const lngRad = (lng * Math.PI) / 180;
                    const p = project(latRad, lngRad, rotation);
                    if (p.visible) {
                        if (!started) {
                            ctx.moveTo(p.x, p.y);
                            started = true;
                        } else {
                            ctx.lineTo(p.x, p.y);
                        }
                    }
                }
                ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Draw longitude lines - cyan
            for (let lng = 0; lng < 360; lng += 30) {
                const lngRad = (lng * Math.PI) / 180;
                ctx.beginPath();
                let started = false;
                for (let lat = -90; lat <= 90; lat += 5) {
                    const latRad = (lat * Math.PI) / 180;
                    const p = project(latRad, lngRad, rotation);
                    if (p.visible) {
                        if (!started) {
                            ctx.moveTo(p.x, p.y);
                            started = true;
                        } else {
                            ctx.lineTo(p.x, p.y);
                        }
                    }
                }
                ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
                ctx.lineWidth = 1;
                ctx.stroke();
            }

            // Draw dots - cyan with better visibility
            dots.forEach((dot) => {
                const p = project(dot.lat, dot.lng, rotation);
                if (p.visible) {
                    const opacity = 0.4 + p.z * 0.6;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, dot.size * (0.6 + p.z * 0.4), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(6, 182, 212, ${opacity})`;
                    ctx.fill();
                }
            });

            // Draw connections (arcs) - cyan with glow effect
            connections.forEach((conn) => {
                const from = project(conn.from.lat, conn.from.lng, rotation);
                const to = project(conn.to.lat, conn.to.lng, rotation);

                if (from.visible && to.visible && from.z > 0.2 && to.z > 0.2) {
                    const midX = (from.x + to.x) / 2;
                    const midY = (from.y + to.y) / 2;
                    const dist = Math.sqrt((to.x - from.x) ** 2 + (to.y - from.y) ** 2);
                    const ctrlY = midY - dist * 0.3;

                    // Glow effect
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.quadraticCurveTo(midX, ctrlY, to.x, to.y);
                    ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
                    ctx.lineWidth = 4;
                    ctx.stroke();

                    // Main line
                    ctx.beginPath();
                    ctx.moveTo(from.x, from.y);
                    ctx.quadraticCurveTo(midX, ctrlY, to.x, to.y);
                    ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
                    ctx.lineWidth = 1.5;
                    ctx.stroke();

                    // Draw endpoints with glow
                    [from, to].forEach((point) => {
                        // Glow
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(6, 182, 212, 0.2)";
                        ctx.fill();
                        // Center
                        ctx.beginPath();
                        ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                        ctx.fillStyle = "rgba(6, 182, 212, 0.9)";
                        ctx.fill();
                    });
                }
            });

            // Pulsing ring effect
            const pulsePhase = (Date.now() / 2000) % 1;
            const pulseRadius = radius * (1 + pulsePhase * 0.15);
            const pulseOpacity = 0.3 * (1 - pulsePhase);
            ctx.beginPath();
            ctx.arc(centerX, centerY, pulseRadius, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(6, 182, 212, ${pulseOpacity})`;
            ctx.lineWidth = 2;
            ctx.stroke();

            rotation += 0.002;
            animationId = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => {
            setCanvasSize();
        };
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);
        };
    }, [isMounted]);

    // Don't render anything until mounted on client
    if (!isMounted) {
        return (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-full h-full max-w-[900px] max-h-[900px]" />
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
        >
            <canvas
                ref={canvasRef}
                className="w-full h-full max-w-[900px] max-h-[900px]"
                style={{ width: "100%", height: "100%", minHeight: "400px" }}
            />
        </motion.div>
    );
}
