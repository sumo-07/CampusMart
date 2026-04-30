import { motion } from "framer-motion";

export const PageTransition = ({ children }) => {
  const pageVariants = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 }
  };

  return (
    <motion.div
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ 
        duration: 0.3, 
        ease: "easeInOut" 
      }}
      style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column" }}
    >
      {children}
    </motion.div>
  );
};
