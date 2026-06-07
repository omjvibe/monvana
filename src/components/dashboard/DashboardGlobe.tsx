"use client";

import { useEffect, useRef, useState } from "react";

export function DashboardGlobe() {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [isMounted, setIsMounted] = useState(false);

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
        const radius = Math.min(width, height) * 0.4;

        // Generate dots
        const dots: Array<{ lat: number; lng: number; size: number }> = [];
        for (let lat = -80; lat <= 80; lat += 12) {
            const latRad = (lat * Math.PI) / 180;
            const circumference = Math.cos(latRad);
            const dotsAtLat = Math.max(1, Math.floor(circumference * 28));
            for (let i = 0; i < dotsAtLat; i++) {
                const lng = (i / dotsAtLat) * 360 - 180;
                dots.push({
                    lat: latRad,
                    lng: (lng * Math.PI) / 180,
                    size: 1 + Math.random() * 0.8,
                });
            }
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

            // Subtle glow
            const gradient = ctx.createRadialGradient(
                centerX,
                centerY,
                radius * 0.1,
                centerX,
                centerY,
                radius * 1.2
            );
            gradient.addColorStop(0, "rgba(6, 182, 212, 0.06)");
            gradient.addColorStop(0.6, "rgba(6, 182, 212, 0.02)");
            gradient.addColorStop(1, "transparent");
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius * 1.2, 0, Math.PI * 2);
            ctx.fill();

            // Globe outline
            ctx.beginPath();
            ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            ctx.strokeStyle = "rgba(6, 182, 212, 0.15)";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw dots
            dots.forEach((dot) => {
                const p = project(dot.lat, dot.lng, rotation);
                if (p.visible) {
                    const opacity = 0.15 + p.z * 0.25;
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, dot.size * (0.5 + p.z * 0.5), 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(6, 182, 212, ${opacity})`;
                    ctx.fill();
                }
            });

            rotation += 0.001;
            animationId = requestAnimationFrame(draw);
        };

        draw();

        const handleResize = () => setCanvasSize();
        window.addEventListener("resize", handleResize);

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener("resize", handleResize);
        };
    }, [isMounted]);

    if (!isMounted) {
        return <div className="absolute inset-0" />;
    }

    return (
        <canvas
            ref={canvasRef}
            className="absolute inset-0 w-full h-full opacity-50"
            style={{ width: "100%", height: "100%" }}
        />
    );
}
