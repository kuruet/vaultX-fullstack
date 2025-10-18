// import React, { useState, useEffect } from 'react';
// import { RotateCw, X } from 'lucide-react';

// export default function SwiftShareLoader() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [progress, setProgress] = useState(0);
//   const [longLoad, setLongLoad] = useState(false);
//   const [showRetry, setShowRetry] = useState(false);
//   const [theme, setTheme] = useState('light');
//   const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

//   useEffect(() => {
//     const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
//     setPrefersReducedMotion(mediaQuery.matches);
//   }, []);

//   useEffect(() => {
//     if (!isLoading) return;

//     const progressInterval = setInterval(() => {
//       setProgress((prev) => {
//         const next = prev + Math.random() * 20;
//         return next > 95 ? 95 : next;
//       });
//     }, 800);

//     return () => clearInterval(progressInterval);
//   }, [isLoading]);

//   useEffect(() => {
//     if (!isLoading) return;

//     const longLoadTimer = setTimeout(() => {
//       setLongLoad(true);
//     }, 6000);

//     const retryTimer = setTimeout(() => {
//       setShowRetry(true);
//     }, 15000);

//     return () => {
//       clearTimeout(longLoadTimer);
//       clearTimeout(retryTimer);
//     };
//   }, [isLoading]);

//   const handleCancel = () => {
//     setIsLoading(false);
//     setLongLoad(false);
//     setShowRetry(false);
//   };

//   const handleRetry = () => {
//     setIsLoading(true);
//     setProgress(0);
//     setLongLoad(false);
//     setShowRetry(false);
//   };

//   const handleDone = () => {
//     setProgress(100);
//     setTimeout(() => {
//       setIsLoading(false);
//       setLongLoad(false);
//       setShowRetry(false);
//     }, 150);
//   };

//   const bgClass = theme === 'dark' 
//     ? 'bg-gray-900 text-white' 
//     : 'bg-gray-50 text-gray-900';

//   const cardBgClass = theme === 'dark'
//     ? 'bg-gray-800/80 border border-gray-700/50'
//     : 'bg-white/85 border border-gray-200/30';

//   const skeletonBgClass = theme === 'dark'
//     ? 'from-gray-700 to-gray-600'
//     : 'from-gray-200 to-gray-100';

//   const accentColor = '#2E8BFF';

//   return (
//     <div className={`min-h-screen flex flex-col items-center justify-center p-4 transition-colors ${bgClass}`}>
//       {/* Header & Theme Toggle */}
//       <div className="absolute top-4 right-4 flex gap-2">
//         <button
//           onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
//           className="px-3 py-1 text-sm rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
//         >
//           {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
//         </button>
//         <button
//           onClick={handleDone}
//           className="px-3 py-1 text-sm rounded-full bg-green-500 text-white hover:bg-green-600 transition"
//         >
//           Complete
//         </button>
//       </div>

//       {/* Loader Container */}
//       {isLoading ? (
//         <div className={`animate-fadeInScale w-full max-w-sm rounded-[10px] shadow-lg p-6 backdrop-blur-sm ${cardBgClass} relative`}>
//           {/* Close Button */}
//           <button
//             onClick={handleCancel}
//             className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition"
//             aria-label="Cancel loading"
//           >
//             <X size={20} />
//           </button>

//           {/* Animation Area */}
//           <div className="flex justify-center mb-6">
//             {prefersReducedMotion ? (
//               <div className="w-16 h-16 rounded-lg bg-gray-300 dark:bg-gray-600" />
//             ) : (
//               <div className="relative w-20 h-20">
//                 {/* Skeleton Shimmer Animation */}
//                 <div className="space-y-3 w-full">
//                   {[1, 2, 3].map((i) => (
//                     <div
//                       key={i}
//                       className="relative overflow-hidden rounded-md h-4"
//                     >
//                       <div
//                         className={`absolute inset-0 bg-gradient-to-r ${skeletonBgClass}`}
//                         style={{
//                           animation: prefersReducedMotion ? 'none' : `shimmer 1.1s infinite`,
//                           backgroundSize: '200% 100%',
//                         }}
//                       />
//                     </div>
//                   ))}
//                 </div>
//               </div>
//             )}
//           </div>

//           {/* Title & Subtitle */}
//           <div className="text-center mb-6">
//             <h2 className="text-lg font-semibold mb-1">
//               Loading your files
//               {prefersReducedMotion ? '.' : <span className="inline-block animate-pulse">…</span>}
//             </h2>
//             <p className={theme === 'dark' ? 'text-gray-400 text-sm' : 'text-gray-600 text-sm'}>
//               Fetching documents from the server — this should only take a few seconds.
//             </p>
//           </div>

//           {/* Progress Bar */}
//           <div className="mb-4">
//             <div className={`h-1 rounded-full overflow-hidden ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
//               <div
//                 className="h-full rounded-full transition-all"
//                 style={{
//                   width: `${Math.min(progress, 90)}%`,
//                   backgroundColor: accentColor,
//                   transitionDuration: '300ms',
//                 }}
//               />
//             </div>
//             <p className={`text-xs mt-2 text-center ${theme === 'dark' ? 'text-gray-500' : 'text-gray-500'}`}>
//               {Math.round(Math.min(progress, 90))}%
//             </p>
//           </div>

//           {/* Long Load Message */}
//           {longLoad && (
//             <div className={`text-xs mb-4 p-3 rounded-lg ${theme === 'dark' ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
//               <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}>
//                 Still loading? This is taking longer than expected. Try refreshing or check your connection.
//               </p>
//             </div>
//           )}

//           {/* Retry Button (after 15s) */}
//           {showRetry && (
//             <button
//               onClick={handleRetry}
//               className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-medium transition"
//               style={{
//                 backgroundColor: accentColor,
//                 color: 'white',
//               }}
//               onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
//               onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
//             >
//               <RotateCw size={16} />
//               Retry
//             </button>
//           )}

//           {/* Status for Screen Readers */}
//           <div
//             role="status"
//             aria-live="polite"
//             className="sr-only"
//           >
//             Loading your files. Progress: {Math.round(Math.min(progress, 90))}%
//             {longLoad && ' Still loading.'}
//           </div>
//         </div>
//       ) : (
//         <div className={`text-center p-8 rounded-[10px] ${cardBgClass}`}>
//           <h2 className="text-xl font-semibold mb-2">Files Loaded! ✨</h2>
//           <p className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}>
//             Click "Complete" to reset and try again.
//           </p>
//         </div>
//       )}

//       {/* CSS Styles */}
//       <style>{`
//         @keyframes fadeInScale {
//           from {
//             opacity: 0;
//             transform: scale(0.98);
//           }
//           to {
//             opacity: 1;
//             transform: scale(1);
//           }
//         }

//         @keyframes shimmer {
//           0% {
//             backgroundPosition: -200% 0;
//           }
//           100% {
//             backgroundPosition: 200% 0;
//           }
//         }

//         .animate-fadeInScale {
//           animation: fadeInScale 0.22s cubic-bezier(0.34, 1.56, 0.64, 1);
//         }

//         .sr-only {
//           position: absolute;
//           width: 1px;
//           height: 1px;
//           padding: 0;
//           margin: -1px;
//           overflow: hidden;
//           clip: rect(0, 0, 0, 0);
//           white-space: nowrap;
//           border-width: 0;
//         }

//         @media (prefers-reduced-motion: reduce) {
//           * {
//             animation-duration: 0.01ms !important;
//             animation-iteration-count: 1 !important;
//             transition-duration: 0.01ms !important;
//           }
//         }
//       `}</style>
//     </div>
//   );
// }