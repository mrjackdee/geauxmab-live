import React from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface LoadingScreenProps {
  isLoading: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({ isLoading }) => {
  const dotVariants = {
    animate: (i: number) => ({
      opacity: [0, 1, 0],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        delay: i * 0.2,
      },
    }),
  };

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1, ease: "easeInOut" }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-royal-blue text-blue-200 overflow-hidden"
        >
          {/* Dynamic Background Elements */}
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.05, 0.1, 0.05],
              rotate: [0, 90, 180, 270, 360]
            }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 z-0 flex items-center justify-center pointer-events-none"
          >
             <div className="w-[800px] h-[800px] border border-white/10 rounded-full" />
             <div className="absolute w-[600px] h-[600px] border border-white/5 rounded-full" />
          </motion.div>

          <div className="relative z-10 flex flex-col items-center">
            <motion.div
              initial="hidden"
              animate="visible"
              variants={{
                visible: { transition: { staggerChildren: 0.3 } }
              }}
              className="flex flex-col items-center"
            >
              <motion.h1
                variants={{
                  hidden: { opacity: 0, y: 20, filter: "blur(10px)" },
                  visible: { opacity: 1, y: 0, filter: "blur(0px)" }
                }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                className="signature-text text-5xl md:text-7xl lg:text-8xl text-center mb-2 py-4 px-6 overflow-visible loading-text-shadow"
              >
                Geauxmab.com
              </motion.h1>

              <motion.div
                variants={{
                  hidden: { opacity: 0, y: 10 },
                  visible: { opacity: 0.7, y: 0 }
                }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="flex items-center text-xl md:text-2xl font-medium uppercase tracking-[0.4em] text-blue-100/80"
              >
                Loading
                <div className="flex ml-2">
                  {[0, 1, 2, 3].map((i) => (
                    <motion.span
                      key={i}
                      custom={i}
                      variants={dotVariants}
                      animate="animate"
                    >
                      .
                    </motion.span>
                  ))}
                </div>
              </motion.div>
            </motion.div>

            <motion.div 
              className="mt-12 h-[2px] bg-blue-200/10 w-64 md:w-80 overflow-hidden rounded-full"
            >
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ 
                  duration: 2.5, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
                className="h-full w-1/2 bg-gradient-to-r from-transparent via-blue-200 to-transparent shadow-md"
              />
            </motion.div>
          </div>

          {/* Ambient Glow */}
          <motion.div 
            animate={{ 
              scale: [1, 1.1, 1],
              opacity: [0.05, 0.08, 0.05] 
            }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white rounded-full blur-[120px] pointer-events-none" 
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default LoadingScreen;
