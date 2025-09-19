import React, { createContext, useState, useEffect } from 'react';
import { themeConfig } from '@/styles/theme';

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [themeSettings, setThemeSettings] = useState({
    mode: 'light',              // light, dark, system
    accentColor: 'blue',        // blue, green, purple, pink, orange, red
    fontSize: 'medium',         // small, medium, large
    spacing: 'normal',          // compact, normal, comfortable
    borderRadius: 'rounded',    // rounded, square
  });

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('chatmate-theme');
    if (savedTheme) {
      try {
        const parsed = JSON.parse(savedTheme);
        setThemeSettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error parsing saved theme:', error);
      }
    }
  }, []);

  // Save theme to localStorage when settings change
  useEffect(() => {
    localStorage.setItem('chatmate-theme', JSON.stringify(themeSettings));
  }, [themeSettings]);

  // Apply system theme detection
  useEffect(() => {
    if (themeSettings.mode === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => {
        // This would trigger re-render with system theme
        setThemeSettings(prev => ({ ...prev }));
      };
      
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [themeSettings.mode]);

  // Get effective theme mode (resolve system preference)
  const getEffectiveTheme = () => {
    if (themeSettings.mode === 'system') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return themeSettings.mode;
  };

  // Get current theme colors
  const getCurrentTheme = () => {
    const effectiveMode = getEffectiveTheme();
    return themeConfig[effectiveMode];
  };

  // Get current accent colors
  const getCurrentAccent = () => {
    return themeConfig.accent[themeSettings.accentColor];
  };

  // Get current typography settings
  const getCurrentTypography = () => {
    return themeConfig.typography.fontSize[themeSettings.fontSize];
  };

  // Get current spacing settings
  const getCurrentSpacing = () => {
    return themeConfig.spacing[themeSettings.spacing];
  };

  // Get current border radius settings
  const getCurrentBorderRadius = () => {
    return themeConfig.borderRadius[themeSettings.borderRadius];
  };

  // Update theme setting
  const updateThemeSetting = (key, value) => {
    setThemeSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  // Helper functions to get theme classes
  const getThemeClasses = () => {
    const theme = getCurrentTheme();
    const accent = getCurrentAccent();
    
    return {
      // Background classes
      bg: {
        primary: `bg-[${theme.bg.primary}]`,
        secondary: `bg-[${theme.bg.secondary}]`,
        tertiary: `bg-[${theme.bg.tertiary}]`,
        card: `bg-[${theme.bg.card}]`,
        modal: `bg-[${theme.bg.modal}]`,
        sidebar: `bg-[${theme.bg.sidebar}]`,
      },
      
      // Text classes
      text: {
        primary: `text-[${theme.text.primary}]`,
        secondary: `text-[${theme.text.secondary}]`,
        tertiary: `text-[${theme.text.tertiary}]`,
        muted: `text-[${theme.text.muted}]`,
        inverse: `text-[${theme.text.inverse}]`,
      },
      
      // Border classes
      border: {
        primary: `border-[${theme.border.primary}]`,
        secondary: `border-[${theme.border.secondary}]`,
        tertiary: `border-[${theme.border.tertiary}]`,
        focus: `border-[${theme.border.focus}]`,
      },
      
      // Accent classes
      accent: {
        primary: `bg-[${accent.primary}]`,
        light: `bg-[${accent.light}]`,
        dark: `bg-[${accent.dark}]`,
        text: `text-[${accent.text}]`,
      },
      
      // State classes
      state: {
        hover: `hover:bg-[${theme.state.hover}]`,
        active: `active:bg-[${theme.state.active}]`,
        selected: `bg-[${theme.state.selected}]`,
        disabled: `bg-[${theme.state.disabled}]`,
      }
    };
  };

  // CSS Variables approach (recommended)
  const getCSSVariables = () => {
    const theme = getCurrentTheme();
    const accent = getCurrentAccent();
    
    return {
      // Background variables
      '--bg-primary': theme.bg.primary,
      '--bg-secondary': theme.bg.secondary,
      '--bg-tertiary': theme.bg.tertiary,
      '--bg-card': theme.bg.card,
      '--bg-modal': theme.bg.modal,
      '--bg-sidebar': theme.bg.sidebar,
      
      // Text variables
      '--text-primary': theme.text.primary,
      '--text-secondary': theme.text.secondary,
      '--text-tertiary': theme.text.tertiary,
      '--text-muted': theme.text.muted,
      '--text-inverse': theme.text.inverse,
      
      // Border variables
      '--border-primary': theme.border.primary,
      '--border-secondary': theme.border.secondary,
      '--border-tertiary': theme.border.tertiary,
      '--border-focus': theme.border.focus,
      
      // Accent variables
      '--accent-primary': accent.primary,
      '--accent-light': accent.light,
      '--accent-dark': accent.dark,
      '--accent-hover': accent.hover,
      '--accent-text': accent.text,
      
      // State variables
      '--state-hover': theme.state.hover,
      '--state-active': theme.state.active,
      '--state-selected': theme.state.selected,
      '--state-disabled': theme.state.disabled,
      
      // Typography variables
      '--font-size-base': getCurrentTypography().base,
      '--font-size-sm': getCurrentTypography().sm,
      '--font-size-lg': getCurrentTypography().lg,
      
      // Spacing variables
      '--spacing-sm': getCurrentSpacing().sm,
      '--spacing-md': getCurrentSpacing().md,
      '--spacing-lg': getCurrentSpacing().lg,
      '--spacing-xl': getCurrentSpacing().xl,
      
      // Border radius variables
      '--radius-sm': getCurrentBorderRadius().sm,
      '--radius-md': getCurrentBorderRadius().md,
      '--radius-lg': getCurrentBorderRadius().lg,
      '--radius-xl': getCurrentBorderRadius().xl,
    };
  };

  const value = {
    themeSettings,
    updateThemeSetting,
    getCurrentTheme,
    getCurrentAccent,
    getCurrentTypography,
    getCurrentSpacing,
    getCurrentBorderRadius,
    getEffectiveTheme,
    getThemeClasses,
    getCSSVariables,
    themeConfig
  };

  // Apply CSS variables to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Get effective theme mode
    const effectiveMode = themeSettings.mode === 'system' 
      ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
      : themeSettings.mode;
    
    const theme = themeConfig[effectiveMode];
    const accent = themeConfig.accent[themeSettings.accentColor];
    const typography = themeConfig.typography.fontSize[themeSettings.fontSize];
    const spacing = themeConfig.spacing[themeSettings.spacing];
    const borderRadius = themeConfig.borderRadius[themeSettings.borderRadius];
    
    const variables = {
      // Background variables
      '--bg-primary': theme.bg.primary,
      '--bg-secondary': theme.bg.secondary,
      '--bg-tertiary': theme.bg.tertiary,
      '--bg-card': theme.bg.card,
      '--bg-modal': theme.bg.modal,
      '--bg-sidebar': theme.bg.sidebar,
      
      // Text variables
      '--text-primary': theme.text.primary,
      '--text-secondary': theme.text.secondary,
      '--text-tertiary': theme.text.tertiary,
      '--text-muted': theme.text.muted,
      '--text-inverse': theme.text.inverse,
      
      // Border variables
      '--border-primary': theme.border.primary,
      '--border-secondary': theme.border.secondary,
      '--border-tertiary': theme.border.tertiary,
      '--border-focus': theme.border.focus,
      
      // Accent variables
      '--accent-primary': accent.primary,
      '--accent-light': accent.light,
      '--accent-dark': accent.dark,
      '--accent-hover': accent.hover,
      '--accent-text': accent.text,
      
      // State variables
      '--state-hover': theme.state.hover,
      '--state-active': theme.state.active,
      '--state-selected': theme.state.selected,
      '--state-disabled': theme.state.disabled,
      
      // Typography variables
      '--font-size-base': typography.base,
      '--font-size-sm': typography.sm,
      '--font-size-lg': typography.lg,
      
      // Spacing variables
      '--spacing-sm': spacing.sm,
      '--spacing-md': spacing.md,
      '--spacing-lg': spacing.lg,
      '--spacing-xl': spacing.xl,
      
      // Border radius variables
      '--radius-sm': borderRadius.sm,
      '--radius-md': borderRadius.md,
      '--radius-lg': borderRadius.lg,
      '--radius-xl': borderRadius.xl,
    };
    
    Object.entries(variables).forEach(([key, value]) => {
      root.style.setProperty(key, value);
    });
  }, [themeSettings]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;