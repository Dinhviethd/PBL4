// Theme configuration file
export const themeConfig = {
  // Light theme colors
  light: {
    // Background colors
    bg: {
      primary: '#ffffff',      // bg-white
      secondary: '#f8fafc',    // bg-slate-50
      tertiary: '#f1f5f9',     // bg-slate-100
      card: '#ffffff',         // bg-white
      modal: '#ffffff',        // bg-white
      sidebar: '#f8fafc',      // bg-slate-50
    },
    
    // Text colors
    text: {
      primary: '#1f2937',      // text-gray-800
      secondary: '#6b7280',    // text-gray-500
      tertiary: '#9ca3af',     // text-gray-400
      muted: '#d1d5db',        // text-gray-300
      inverse: '#ffffff',      // text-white
    },
    
    // Border colors
    border: {
      primary: '#e5e7eb',      // border-gray-200
      secondary: '#d1d5db',    // border-gray-300
      tertiary: '#9ca3af',     // border-gray-400
      focus: '#3b82f6',        // border-blue-500
    },
    
    // State colors
    state: {
      hover: '#f3f4f6',        // hover:bg-gray-100
      active: '#e5e7eb',       // active:bg-gray-200
      selected: '#dbeafe',     // bg-blue-50
      disabled: '#f3f4f6',     // bg-gray-100
    }
  },
  
  // Dark theme colors
  dark: {
    // Background colors
    bg: {
      primary: '#1f2937',      // bg-gray-800
      secondary: '#111827',    // bg-gray-900
      tertiary: '#374151',     // bg-gray-700
      card: '#1f2937',         // bg-gray-800
      modal: '#1f2937',        // bg-gray-800
      sidebar: '#111827',      // bg-gray-900
    },
    
    // Text colors
    text: {
      primary: '#f9fafb',      // text-gray-50
      secondary: '#d1d5db',    // text-gray-300
      tertiary: '#9ca3af',     // text-gray-400
      muted: '#6b7280',        // text-gray-500
      inverse: '#1f2937',      // text-gray-800
    },
    
    // Border colors
    border: {
      primary: '#374151',      // border-gray-700
      secondary: '#4b5563',    // border-gray-600
      tertiary: '#6b7280',     // border-gray-500
      focus: '#3b82f6',        // border-blue-500
    },
    
    // State colors
    state: {
      hover: '#374151',        // hover:bg-gray-700
      active: '#4b5563',       // active:bg-gray-600
      selected: '#1e3a8a',     // bg-blue-900
      disabled: '#374151',     // bg-gray-700
    }
  },
  
  // Accent colors (work for both light and dark themes)
  accent: {
    blue: {
      primary: '#3b82f6',      // bg-blue-600
      light: '#dbeafe',        // bg-blue-50
      dark: '#1e3a8a',         // bg-blue-900
      hover: '#2563eb',        // hover:bg-blue-700
      text: '#1d4ed8',         // text-blue-700
    },
    green: {
      primary: '#059669',      // bg-green-600
      light: '#d1fae5',        // bg-green-50
      dark: '#064e3b',         // bg-green-900
      hover: '#047857',        // hover:bg-green-700
      text: '#047857',         // text-green-700
    },
    purple: {
      primary: '#7c3aed',      // bg-purple-600
      light: '#f3e8ff',        // bg-purple-50
      dark: '#581c87',         // bg-purple-900
      hover: '#6d28d9',        // hover:bg-purple-700
      text: '#6d28d9',         // text-purple-700
    },
    pink: {
      primary: '#db2777',      // bg-pink-600
      light: '#fdf2f8',        // bg-pink-50
      dark: '#831843',         // bg-pink-900
      hover: '#be185d',        // hover:bg-pink-700
      text: '#be185d',         // text-pink-700
    },
    orange: {
      primary: '#ea580c',      // bg-orange-600
      light: '#fff7ed',        // bg-orange-50
      dark: '#9a3412',         // bg-orange-900
      hover: '#c2410c',        // hover:bg-orange-700
      text: '#c2410c',         // text-orange-700
    },
    red: {
      primary: '#dc2626',      // bg-red-600
      light: '#fef2f2',        // bg-red-50
      dark: '#991b1b',         // bg-red-900
      hover: '#b91c1c',        // hover:bg-red-700
      text: '#b91c1c',         // text-red-700
    }
  },
  
  // Status colors
  status: {
    success: {
      primary: '#059669',      // bg-green-600
      light: '#d1fae5',        // bg-green-50
      text: '#047857',         // text-green-700
      border: '#059669',       // border-green-600
    },
    error: {
      primary: '#dc2626',      // bg-red-600
      light: '#fef2f2',        // bg-red-50
      text: '#b91c1c',         // text-red-700
      border: '#dc2626',       // border-red-600
    },
    warning: {
      primary: '#d97706',      // bg-yellow-600
      light: '#fffbeb',        // bg-yellow-50
      text: '#b45309',         // text-yellow-700
      border: '#d97706',       // border-yellow-600
    },
    info: {
      primary: '#2563eb',      // bg-blue-600
      light: '#dbeafe',        // bg-blue-50
      text: '#1d4ed8',         // text-blue-700
      border: '#2563eb',       // border-blue-600
    }
  },
  
  // Typography
  typography: {
    fontSize: {
      small: {
        xs: '0.75rem',         // text-xs
        sm: '0.875rem',        // text-sm
        base: '1rem',          // text-base
        lg: '1.125rem',        // text-lg
        xl: '1.25rem',         // text-xl
        '2xl': '1.5rem',       // text-2xl
      },
      medium: {
        xs: '0.875rem',        // text-sm
        sm: '1rem',            // text-base
        base: '1.125rem',      // text-lg
        lg: '1.25rem',         // text-xl
        xl: '1.5rem',          // text-2xl
        '2xl': '1.875rem',     // text-3xl
      },
      large: {
        xs: '1rem',            // text-base
        sm: '1.125rem',        // text-lg
        base: '1.25rem',       // text-xl
        lg: '1.5rem',          // text-2xl
        xl: '1.875rem',        // text-3xl
        '2xl': '2.25rem',      // text-4xl
      }
    },
    fontWeight: {
      normal: '400',           // font-normal
      medium: '500',           // font-medium
      semibold: '600',         // font-semibold
      bold: '700',             // font-bold
    }
  },
  
  // Spacing
  spacing: {
    compact: {
      xs: '0.125rem',          // 2px
      sm: '0.25rem',           // 4px
      md: '0.5rem',            // 8px
      lg: '0.75rem',           // 12px
      xl: '1rem',              // 16px
      '2xl': '1.25rem',        // 20px
      '3xl': '1.5rem',         // 24px
    },
    normal: {
      xs: '0.25rem',           // 4px
      sm: '0.5rem',            // 8px
      md: '0.75rem',           // 12px
      lg: '1rem',              // 16px
      xl: '1.5rem',            // 24px
      '2xl': '2rem',           // 32px
      '3xl': '3rem',           // 48px
    },
    comfortable: {
      xs: '0.5rem',            // 8px
      sm: '0.75rem',           // 12px
      md: '1rem',              // 16px
      lg: '1.5rem',            // 24px
      xl: '2rem',              // 32px
      '2xl': '2.5rem',         // 40px
      '3xl': '4rem',           // 64px
    }
  },
  
  // Border radius
  borderRadius: {
    rounded: {
      sm: '0.125rem',          // rounded-sm
      md: '0.375rem',          // rounded-md
      lg: '0.5rem',            // rounded-lg
      xl: '0.75rem',           // rounded-xl
      '2xl': '1rem',           // rounded-2xl
      full: '9999px',          // rounded-full
    },
    square: {
      sm: '0.125rem',          // rounded-sm
      md: '0.25rem',           // rounded
      lg: '0.375rem',          // rounded-md
      xl: '0.5rem',            // rounded-lg
      '2xl': '0.75rem',        // rounded-xl
      full: '0.375rem',        // rounded-md
    }
  }
};

export default themeConfig;