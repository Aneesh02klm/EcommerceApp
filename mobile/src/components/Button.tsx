import React from 'react';
import { TouchableOpacity, Text, StyleSheet, TouchableOpacityProps, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { spacing } from '../theme/spacing';

interface ButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  title, 
  variant = 'primary', 
  isLoading = false,
  style, 
  ...props 
}) => {
  const getBackgroundStyle = () => {
    switch (variant) {
      case 'primary': return { backgroundColor: colors.primary };
      case 'secondary': return { backgroundColor: colors.secondary };
      case 'outline': return { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.border };
      case 'ghost': return { backgroundColor: 'transparent' };
    }
  };

  const getTextStyle = () => {
    switch (variant) {
      case 'primary': return { color: colors.surface };
      case 'secondary': return { color: colors.primary };
      case 'outline': return { color: colors.text };
      case 'ghost': return { color: colors.primary };
    }
  };

  return (
    <TouchableOpacity 
      style={[styles.button, getBackgroundStyle(), props.disabled && styles.disabled, style]} 
      disabled={props.disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <ActivityIndicator color={getTextStyle().color} />
      ) : (
        <Text style={[styles.text, getTextStyle()]}>{title}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    height: 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
  disabled: {
    opacity: 0.5,
  }
});
