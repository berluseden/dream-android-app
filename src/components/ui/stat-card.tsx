import { motion } from 'framer-motion';
import { Dumbbell, Zap, TrendingUp, Award } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  icon: ReactNode;
  label: string;
  value: string | number;
  change?: string;
  gradient: 'primary' | 'success' | 'energy' | 'power';
  delay?: number;
}

const gradientClasses = {
  primary: 'from-purple-500 to-indigo-600',
  success: 'from-teal-500 to-green-500',
  energy: 'from-pink-500 to-rose-500',
  power: 'from-amber-500 to-orange-500',
};

/**
 * Stat Card moderno con glassmorphism y efectos 3D
 */
export function StatCard({ icon, label, value, change, gradient, delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -8, scale: 1.02 }}
      className="relative group"
    >
      {/* Glow effect */}
      <div className={`absolute inset-0 bg-gradient-to-r ${gradientClasses[gradient]} opacity-20 blur-xl rounded-2xl group-hover:opacity-40 transition-opacity`} />
      
      {/* Card */}
      <div className="relative glass-card p-6">
        {/* Gradient border */}
        <div className={`absolute inset-0 bg-gradient-to-r ${gradientClasses[gradient]} opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity blur-sm -z-10`} />
        
        {/* Icon with floating animation */}
        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className={`inline-flex p-3 rounded-xl bg-gradient-to-r ${gradientClasses[gradient]} text-white mb-4`}
        >
          {icon}
        </motion.div>
        
        {/* Content */}
        <h3 className="text-sm font-medium text-muted-foreground mb-1">{label}</h3>
        <p className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
          {value}
        </p>
        
        {/* Change indicator */}
        {change && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: delay + 0.2 }}
            className="flex items-center gap-1 mt-2"
          >
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium text-green-500">{change}</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Grid de stats con stagger animation
 */
interface StatsGridProps {
  stats: Omit<StatCardProps, 'delay'>[];
}

export function StatsGrid({ stats }: StatsGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {stats.map((stat, index) => (
        <StatCard key={stat.label} {...stat} delay={index * 0.1} />
      ))}
    </div>
  );
}
