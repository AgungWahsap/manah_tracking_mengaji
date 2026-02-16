/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    darkMode: "class",
    theme: {
        extend: {
            colors: {
                "primary": "#0d4a3a",
                "primary-light": "#1a6b57", // Updated to match Admin HTML
                "primary-dark": "#072e23",  // Updated to match Admin HTML
                "accent-gold": "#d4a017",
                "gold": "#D4AF37",          // Added from Admin HTML
                "gold-light": "#f3d97f",    // Added from Admin HTML
                "background-light": "#f6f8f7",
                "background-dark": "#05110e", // Updated to match Admin HTML
                "glass": "rgba(255, 255, 255, 0.05)",
                "glass-hover": "rgba(255, 255, 255, 0.08)",
                "glass-border": "rgba(255, 255, 255, 0.08)", // Updated opacity
                "glass-panel": "rgba(13, 74, 58, 0.25)",     // Updated color
                "glass-bg": "rgba(13, 74, 58, 0.3)",         // Added
            },
            fontFamily: {
                "display": ["Inter", "sans-serif"]
            },
            borderRadius: { "DEFAULT": "0.25rem", "lg": "0.5rem", "xl": "0.75rem", "2xl": "1rem", "full": "9999px" },
            backgroundImage: {
                'islamic-pattern': "radial-gradient(#0d4a3a 1px, transparent 1px), radial-gradient(#0d4a3a 1px, transparent 1px)",
                'gradient-radial': 'radial-gradient(circle at center, rgba(13, 74, 58, 0.25) 0%, transparent 70%)',
            },
            backgroundPosition: {
                'islamic-pattern': '0 0, 25px 25px',
            },
            backgroundSize: {
                'islamic-pattern': '50px 50px',
            }
        },
    },
    plugins: [
        require('@tailwindcss/forms'),
        require('@tailwindcss/container-queries'),
    ],
}
