import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface HeroBackgroundProps {
    currentPage: string;
}

export default function HeroBackground({ currentPage }: HeroBackgroundProps) {
    const [style, setStyle] = useState<any>({
        '--bg-blur': '0px',
        backgroundImage: "url('/hero/hero-car.jpg')"
    });

    useEffect(() => {
        // Mapping page to blur and image values
        const configMap: Record<string, { blur: number; image: string }> = {
            'home': { blur: 0, image: '/hero/home-bg-new.jpg' },
            'simulation': { blur: 4, image: '/hero/simulation-bg-new.jpg' },
            'predict': { blur: 6, image: '/hero/predict-bg.jpg' },
            'intelligence': { blur: 8, image: '/hero/hero-intelligence.jpg' },
            'schedule': { blur: 8, image: '/hero/hero-schedule.jpg' },
            'results': { blur: 10, image: '/hero/hero-results.jpg' },
            'profile': { blur: 15, image: '/hero/home-bg-new.jpg' },
            'teams': { blur: 12, image: '/hero/hero-schedule.jpg' },
            'driver': { blur: 8, image: '/hero/hero-schedule.jpg' },
        };

        const config = configMap[currentPage] ?? configMap['home'];

        setStyle({
            '--bg-blur': `${config.blur}px`,
            backgroundImage: `url('${config.image}')`
        });
    }, [currentPage]);

    return (
        <motion.div
            key={currentPage} // Force re-render/re-animate on page change
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.2, ease: "easeOut" }}
            className="hero-static-bg -z-10"
            style={style}
            aria-hidden="true"
        />
    );
}
