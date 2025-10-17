import { motion, useMotionValue, useTransform, useSpring } from 'framer-motion';
import { ReactNode, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface InteractiveCardProps {
  children: ReactNode;
  title?: string;
  icon?: ReactNode;
  gradient?: string;
  onClick?: () => void;
}

/**
 * Card 3D interactiva con efecto tilt al hover
 * Inspirado en Apple y glassmorphism moderno
 */
export function InteractiveCard({ 
  children, 
  title, 
  icon,
  gradient = 'from-purple-500 to-indigo-600',
  onClick 
}: InteractiveCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Motion values para el tilt 3D
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  // Transformar posición del mouse en rotación
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [10, -10]), {
    stiffness: 400,
    damping: 30,
  });
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-10, 10]), {
    stiffness: 400,
    damping: 30,
  });
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((event.clientX - centerX) / rect.width);
    y.set((event.clientY - centerY) / rect.height);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onClick}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
      }}
      whileHover={{ scale: 1.05, z: 50 }}
      whileTap={{ scale: 0.98 }}
      className="relative cursor-pointer"
    >
      {/* Glow effect */}
      <motion.div
        className={`absolute -inset-1 bg-gradient-to-r ${gradient} opacity-0 blur-xl rounded-2xl`}
        whileHover={{ opacity: 0.6 }}
        transition={{ duration: 0.3 }}
      />
      
      {/* Card */}
      <Card className="relative glass-card border-2 overflow-hidden">
        {/* Gradient overlay */}
        <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${gradient}`} />
        
        {/* Shimmer effect on hover */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-100%' }}
          whileHover={{ x: '100%' }}
          transition={{ duration: 0.6 }}
        />
        
        {title && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {icon && (
                <motion.div
                  animate={{ rotate: [0, 10, 0] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  {icon}
                </motion.div>
              )}
              {title}
            </CardTitle>
          </CardHeader>
        )}
        
        <CardContent style={{ transform: 'translateZ(20px)' }}>
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Card flotante con parallax suave
 */
export function FloatingCard({ children, delay = 0 }: { children: ReactNode; delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 50 }}
      animate={{ 
        opacity: 1, 
        y: 0,
      }}
      transition={{
        duration: 0.6,
        delay,
        type: "spring",
        stiffness: 100,
      }}
      whileHover={{
        y: -10,
        transition: { duration: 0.2 }
      }}
      className="floating"
    >
      {children}
    </motion.div>
  );
}

/**
 * Card con efecto magnetic hover
 */
export function MagneticCard({ children }: { children: ReactNode }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    
    const rect = cardRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    x.set((event.clientX - centerX) * 0.1);
    y.set((event.clientY - centerY) * 0.1);
  };
  
  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };
  
  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{ x, y }}
      transition={{ type: "spring", stiffness: 300, damping: 20 }}
      className="magnetic-hover"
    >
      {children}
    </motion.div>
  );
}
