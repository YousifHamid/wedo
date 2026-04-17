/**
 * InTripContactModal
 * ─────────────────────────────────────
 * Anonymous communication between rider and captain.
 * Real phone numbers are NEVER shown or shared.
 * All messages and calls are relayed through the server via Socket.io.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, Modal, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { MessageCircle, Phone, X, PhoneCall, PhoneOff, Send } from 'lucide-react-native';
import { COLORS, SHADOWS, RADIUS, FONT_SIZES } from '../constants/theme';
import { getSocket } from '../services/socket';

interface Message {
  id: string;
  text: string;
  senderRole: 'driver' | 'rider';
  senderName: string;
  timestamp: number;
}

interface Props {
  visible: boolean;
  onClose: () => void;
  tripId: string;
  myRole: 'driver' | 'rider';
  otherName: string;  // Captain or Rider display name
  isRTL: boolean;
}

type CallState = 'idle' | 'calling' | 'connected' | 'incoming';

export default function InTripContactModal({ visible, onClose, tripId, myRole, otherName, isRTL }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [callState, setCallState] = useState<CallState>('idle');
  const [callSeconds, setCallSeconds] = useState(0);
  const callTimerRef = useRef<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const socket = getSocket();

  useEffect(() => {
    if (!socket || !visible) return;

    socket.on('trip:message_received', (data: Message) => {
      setMessages(prev => [...prev, { ...data, id: `${Date.now()}-${Math.random()}` }]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    });

    socket.on('trip:incoming_call', () => {
      setCallState('incoming');
    });

    socket.on('trip:call_connected', () => {
      setCallState('connected');
      startCallTimer();
    });

    socket.on('trip:call_ended', () => {
      endCall(false);
    });

    return () => {
      socket.off('trip:message_received');
      socket.off('trip:incoming_call');
      socket.off('trip:call_connected');
      socket.off('trip:call_ended');
    };
  }, [visible, socket]);

  const startCallTimer = () => {
    setCallSeconds(0);
    callTimerRef.current = setInterval(() => setCallSeconds(s => s + 1), 1000);
  };

  const endCall = (emit = true) => {
    clearInterval(callTimerRef.current);
    setCallState('idle');
    setCallSeconds(0);
    if (emit && socket) socket.emit('trip:call_ended', { tripId });
  };

  const sendMessage = () => {
    const text = inputText.trim();
    if (!text || !socket) return;
    socket.emit('trip:message', { tripId, text });
    // Optimistically add own message
    setMessages(prev => [...prev, {
      id: `${Date.now()}`,
      text,
      senderRole: myRole,
      senderName: myRole === 'driver' ? 'الكابتن' : 'أنت',
      timestamp: Date.now(),
    }]);
    setInputText('');
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const initiateCall = () => {
    if (!socket) return;
    setCallState('calling');
    socket.emit('trip:call_request', { tripId });
    // Auto-cancel if no answer in 30s
    setTimeout(() => {
      if (callState === 'calling') endCall(true);
    }, 30000);
  };

  const acceptCall = () => {
    if (!socket) return;
    socket.emit('trip:call_accepted', { tripId });
    setCallState('connected');
    startCallTimer();
  };

  const declineCall = () => {
    if (!socket) return;
    socket.emit('trip:call_declined', { tripId });
    setCallState('idle');
  };

  const formatCallTime = () => {
    const m = Math.floor(callSeconds / 60).toString().padStart(2, '0');
    const s = (callSeconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMe = item.senderRole === myRole;
    return (
      <View style={[
        styles.msgBubble,
        isMe ? styles.msgRight : styles.msgLeft,
        isRTL && { alignSelf: isMe ? 'flex-start' : 'flex-end' }
      ]}>
        {!isMe && <Text style={styles.msgSender}>{item.senderName}</Text>}
        <Text style={[styles.msgText, isMe && { color: '#fff' }]}>{item.text}</Text>
        <Text style={[styles.msgTime, isMe && { color: 'rgba(255,255,255,0.7)' }]}>
          {new Date(item.timestamp).toLocaleTimeString('ar', { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheet}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <X size={20} color={COLORS.onSurface} />
            </TouchableOpacity>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={styles.headerTitle}>{otherName}</Text>
              <Text style={styles.headerSub}>
                {isRTL ? '🔒 الأرقام مخفية — التواصل آمن' : '🔒 Numbers hidden — Secure contact'}
              </Text>
            </View>
            {/* Anonymous Call Button */}
            {callState === 'idle' && (
              <TouchableOpacity onPress={initiateCall} style={styles.callBtn}>
                <Phone size={18} color={COLORS.primary} />
              </TouchableOpacity>
            )}
          </View>

          {/* Call UI overlay */}
          {callState !== 'idle' && (
            <View style={styles.callOverlay}>
              <PhoneCall size={40} color={COLORS.primary} />
              <Text style={styles.callName}>{otherName}</Text>
              <Text style={styles.callStatus}>
                {callState === 'calling'
                  ? (isRTL ? 'جارٍ الاتصال...' : 'Calling...')
                  : callState === 'incoming'
                  ? (isRTL ? 'اتصال وارد...' : 'Incoming call...')
                  : formatCallTime()}
              </Text>

              <View style={styles.callActions}>
                {callState === 'incoming' ? (
                  <>
                    <TouchableOpacity style={[styles.callActionBtn, { backgroundColor: COLORS.success }]} onPress={acceptCall}>
                      <Phone size={24} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.callActionBtn, { backgroundColor: COLORS.error }]} onPress={declineCall}>
                      <PhoneOff size={24} color="#fff" />
                    </TouchableOpacity>
                  </>
                ) : (
                  <TouchableOpacity style={[styles.callActionBtn, { backgroundColor: COLORS.error }]} onPress={() => endCall(true)}>
                    <PhoneOff size={24} color="#fff" />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}

          {/* Chat area */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={renderMessage}
            contentContainerStyle={styles.chatContainer}
            ListEmptyComponent={
              <View style={styles.emptyChat}>
                <MessageCircle size={32} color={COLORS.primaryLightMid} />
                <Text style={styles.emptyChatText}>
                  {isRTL ? 'أرسل رسالة للكابتن الآن' : 'Send a message now'}
                </Text>
              </View>
            }
          />

          {/* Input */}
          <View style={styles.inputRow}>
            <TextInput
              style={[styles.input, isRTL && { textAlign: 'right' }]}
              placeholder={isRTL ? 'اكتب رسالة...' : 'Type a message...'}
              placeholderTextColor={COLORS.onSurfaceVariant}
              value={inputText}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
              returnKeyType="send"
            />
            <TouchableOpacity
              style={[styles.sendBtn, !inputText.trim() && { opacity: 0.4 }]}
              onPress={sendMessage}
              disabled={!inputText.trim()}
            >
              <Send size={18} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24, maxHeight: '85%', minHeight: '60%' },

  header: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.primaryLight },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  callBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontWeight: 'bold', fontSize: FONT_SIZES.md, color: COLORS.onSurface },
  headerSub: { fontSize: 10, color: COLORS.onSurfaceVariant, marginTop: 2 },

  callOverlay: { backgroundColor: COLORS.primaryLight, margin: 16, borderRadius: 16, padding: 24, alignItems: 'center' },
  callName: { fontSize: 20, fontWeight: 'bold', color: COLORS.primary, marginTop: 8 },
  callStatus: { fontSize: 14, color: COLORS.onSurfaceVariant, marginTop: 4 },
  callActions: { flexDirection: 'row', gap: 20, marginTop: 16 },
  callActionBtn: { width: 56, height: 56, borderRadius: 28, justifyContent: 'center', alignItems: 'center' },

  chatContainer: { padding: 16, flexGrow: 1 },
  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyChatText: { color: COLORS.onSurfaceVariant, marginTop: 8, fontSize: 13 },

  msgBubble: { maxWidth: '75%', padding: 10, borderRadius: 14, marginBottom: 8 },
  msgLeft: { alignSelf: 'flex-start', backgroundColor: COLORS.primaryLight },
  msgRight: { alignSelf: 'flex-end', backgroundColor: COLORS.primary },
  msgSender: { fontSize: 10, color: COLORS.primary, fontWeight: 'bold', marginBottom: 2 },
  msgText: { fontSize: 14, color: COLORS.onSurface },
  msgTime: { fontSize: 10, color: COLORS.onSurfaceVariant, marginTop: 4, alignSelf: 'flex-end' },

  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 12, borderTopWidth: 1, borderTopColor: COLORS.primaryLight, gap: 8 },
  input: { flex: 1, backgroundColor: COLORS.primaryLight, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 10, fontSize: 14, color: COLORS.onSurface },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, justifyContent: 'center', alignItems: 'center' },
});
