/**
 * CustomAlert.tsx — Wedo Premium Alert Component
 * Replaces native Alert.alert() with a beautiful, branded modal.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { CheckCircle, XCircle, AlertTriangle, Info, X } from 'lucide-react-native';
import { COLORS, RADIUS, SHADOWS } from '../constants/theme';

const { width } = Dimensions.get('window');

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface CustomAlertProps {
  visible: boolean;
  type?: AlertType;
  title: string;
  message?: string;
  buttons?: AlertButton[];
  onDismiss?: () => void;
  emoji?: string;
}

const TYPE_CONFIG: Record<AlertType, { color: string; bg: string; Icon: any }> = {
  success: { color: '#10B981', bg: '#ECFDF5', Icon: CheckCircle },
  error:   { color: '#EF4444', bg: '#FEF2F2', Icon: XCircle },
  warning: { color: '#F59E0B', bg: '#FFFBEB', Icon: AlertTriangle },
  info:    { color: COLORS.primary, bg: '#EFF6FF', Icon: Info },
};

export default function CustomAlert({
  visible,
  type = 'info',
  title,
  message,
  buttons,
  onDismiss,
  emoji,
}: CustomAlertProps) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  const config = TYPE_CONFIG[type];
  const DefaultButtons: AlertButton[] = buttons || [
    { text: 'حسناً', style: 'default', onPress: onDismiss },
  ];

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 160,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 0.85,
          tension: 200,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 120,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Backdrop */}
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onDismiss}
        />

        <Animated.View
          style={[
            styles.card,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Close button */}
          {onDismiss && (
            <TouchableOpacity style={styles.closeBtn} onPress={onDismiss} activeOpacity={0.7}>
              <X size={18} color="#9CA3AF" />
            </TouchableOpacity>
          )}

          {/* Icon area removed entirely per user request for clean alert design */}

          {/* Text */}
          <Text style={styles.title}>{title}</Text>
          {message ? (
            <Text style={styles.message}>{message}</Text>
          ) : null}

          {/* Buttons */}
          <View style={[
            styles.btnGroup,
            DefaultButtons.length === 1 ? styles.btnGroupSingle : styles.btnGroupMulti,
          ]}>
            {DefaultButtons.map((btn, i) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const isPrimary = !isCancel && !isDestructive;

              return (
                <TouchableOpacity
                  key={i}
                  style={[
                    styles.btn,
                    isPrimary && [styles.btnPrimary, { backgroundColor: config.color }],
                    isCancel && styles.btnCancel,
                    isDestructive && styles.btnDestructive,
                    DefaultButtons.length === 1 && { flex: 1 },
                    DefaultButtons.length > 1 && { flex: 1 },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => {
                    btn.onPress?.();
                    if (!btn.onPress) onDismiss?.();
                  }}
                >
                  <Text
                    style={[
                      styles.btnText,
                      isPrimary && styles.btnTextPrimary,
                      isCancel && styles.btnTextCancel,
                      isDestructive && styles.btnTextDestructive,
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
}

// ── Hook: useAlert — easy API to show alerts anywhere ──────────────────────────
export function useAlert() {
  const [alertState, setAlertState] = React.useState<{
    visible: boolean;
    type: AlertType;
    title: string;
    message?: string;
    buttons?: AlertButton[];
    emoji?: string;
  }>({
    visible: false,
    type: 'info',
    title: '',
  });

  const showAlert = (
    title: string,
    message?: string,
    type: AlertType = 'info',
    buttons?: AlertButton[],
    emoji?: string,
  ) => {
    setAlertState({ visible: true, type, title, message, buttons, emoji });
  };

  const hideAlert = () => setAlertState(prev => ({ ...prev, visible: false }));

  const AlertComponent = () => (
    <CustomAlert
      visible={alertState.visible}
      type={alertState.type}
      title={alertState.title}
      message={alertState.message}
      buttons={alertState.buttons}
      onDismiss={hideAlert}
      emoji={alertState.emoji}
    />
  );

  return { showAlert, hideAlert, AlertComponent };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },

  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    alignItems: 'center',
    ...SHADOWS.lg,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 40,
    shadowOffset: { width: 0, height: 16 },
    elevation: 20,
  },

  closeBtn: {
    position: 'absolute',
    top: 14,
    right: 14,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },

  iconWrapper: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },

  emojiText: {
    fontSize: 40,
  },

  accentLine: {
    width: 32,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },

  title: {
    fontSize: 20,
    fontWeight: '900',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: -0.3,
    marginBottom: 10,
  },

  message: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
    fontWeight: '500',
  },

  btnGroup: {
    width: '100%',
    gap: 10,
  },
  btnGroupSingle: {
    flexDirection: 'column',
  },
  btnGroupMulti: {
    flexDirection: 'row',
  },

  btn: {
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  btnPrimary: {
    backgroundColor: COLORS.primary,
  },
  btnCancel: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  btnDestructive: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
  },

  btnText: {
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  btnTextPrimary: {
    color: '#FFFFFF',
  },
  btnTextCancel: {
    color: '#374151',
  },
  btnTextDestructive: {
    color: '#EF4444',
  },
});
