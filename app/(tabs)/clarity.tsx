import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { Feather } from '@expo/vector-icons';
import { theme } from '../../constants/theme';
import ClarityMessage from '../../components/ClarityMessage';
import UpgradePrompt from '../../components/UpgradePrompt';
import { useUserStore } from '../../store/userStore';
import { useMedStore } from '../../store/medStore';
import {
  createConversation,
  addMessage,
  getDailyUsage,
  incrementDailyUsage,
  getMedications,
} from '../../lib/api';

const FREE_DAILY_LIMIT = 3;

const SUGGESTED_QUESTIONS = [
  'What are common side effects of antihistamines?',
  'How does staying hydrated affect medication absorption?',
  'What foods can interfere with common medications?',
  'How can I build a consistent wellness routine?',
];

const SYSTEM_PROMPT = `You are Clarity, a friendly wellness assistant in the Nurvo app. You help users understand general wellness information and organize their health routines.

IMPORTANT RULES:
- You are NOT a medical professional and do NOT provide medical advice
- Always recommend consulting a qualified healthcare provider for medical decisions
- Never diagnose conditions or recommend specific treatments
- Focus on general wellness education and routine organization
- Be warm, clear, and supportive
- Keep responses concise (3-5 paragraphs max)
- End every response with a gentle reminder to consult a healthcare provider when relevant

The user has these medications in their Nurvo profile: {MEDICATIONS}

You can reference these medications for general wellness context, but never advise on dosing or medical use.`;

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

export default function ClarityScreen() {
  const insets = useSafeAreaInsets();
  const { activeProfileId, subscriptionTier } = useUserStore();
  const { medications } = useMedStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [dailyCount, setDailyCount] = useState(0);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const scrollRef = useRef<ScrollView>(null);

  const isPremium =
    subscriptionTier === 'premium' || subscriptionTier === 'family';
  const reachedLimit = !isPremium && dailyCount >= FREE_DAILY_LIMIT;

  useFocusEffect(
    useCallback(() => {
      loadState();
    }, [activeProfileId])
  );

  const loadState = async () => {
    if (!activeProfileId) return;
    try {
      const usage = await getDailyUsage(activeProfileId);
      setDailyCount(usage?.question_count ?? 0);

      if (!conversationId) {
        const conv = await createConversation(activeProfileId);
        setConversationId(conv.id);
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content:
              "Hi, I'm Clarity — your wellness assistant. I can help you understand general wellness information and answer questions about healthy habits. What's on your mind?\n\nNote: I'm not a medical professional. Always consult your healthcare provider for medical advice.",
            timestamp: new Date().toISOString(),
          },
        ]);
      }
    } catch (err) {
      console.error('Clarity load error:', err);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  };

  const handleSend = async (text?: string) => {
    const messageText = (text ?? input).trim();
    if (!messageText || loading || !activeProfileId || !conversationId) return;

    if (reachedLimit) {
      setShowUpgrade(true);
      return;
    }

    if (Platform.OS !== 'web') {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    scrollToBottom();

    try {
      // Save user message
      await addMessage(conversationId, 'user', messageText);

      // Build context
      const medNames = medications.map((m) => m.name).join(', ') || 'None listed';
      const systemPrompt = SYSTEM_PROMPT.replace('{MEDICATIONS}', medNames);

      // Call Claude API
      const apiKey = process.env.EXPO_PUBLIC_CLAUDE_API_KEY;
      if (!apiKey || apiKey === 'your_claude_key_here') {
        throw new Error('Claude API key not configured');
      }

      const messageHistory = messages
        .filter((m) => m.id !== 'welcome')
        .map((m) => ({ role: m.role, content: m.content }));

      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-3-haiku-20240307',
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            ...messageHistory,
            { role: 'user', content: messageText },
          ],
        }),
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`API error: ${errText}`);
      }

      const data = await response.json();
      const assistantContent = data.content?.[0]?.text ?? 'No response received.';

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: assistantContent,
        timestamp: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, assistantMsg]);
      await addMessage(conversationId, 'assistant', assistantContent);

      // Update usage
      await incrementDailyUsage(activeProfileId);
      setDailyCount((prev) => prev + 1);
      scrollToBottom();
    } catch (err: any) {
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content:
          err.message?.includes('API key')
            ? "Clarity needs a Claude API key to work. Please add your EXPO_PUBLIC_CLAUDE_API_KEY to the .env file."
            : "I'm having trouble connecting right now. Please try again in a moment.",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
      scrollToBottom();
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { paddingTop: insets.top }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={insets.top}
    >
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarSmall}>
            <Text style={styles.avatarSmallText}>C</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>Clarity</Text>
            <Text style={styles.headerSubtitle}>Wellness assistant</Text>
          </View>
        </View>
        {!isPremium && (
          <View style={styles.usageBadge}>
            <Text style={styles.usageText}>
              {Math.max(0, FREE_DAILY_LIMIT - dailyCount)}/{FREE_DAILY_LIMIT} today
            </Text>
          </View>
        )}
      </View>

      {/* Disclaimer banner */}
      <View style={styles.disclaimerBanner}>
        <Feather name="info" size={12} color={theme.colors.textTertiary} />
        <Text style={styles.disclaimerBannerText}>
          General wellness info only. Not medical advice. Always consult a healthcare provider.
        </Text>
      </View>

      {/* Messages */}
      <ScrollView
        ref={scrollRef}
        style={styles.messageList}
        contentContainerStyle={styles.messageContent}
        showsVerticalScrollIndicator={false}
        keyboardDismissMode="interactive"
        onContentSizeChange={scrollToBottom}
      >
        {messages.map((msg) => (
          <ClarityMessage
            key={msg.id}
            role={msg.role}
            content={msg.content}
            timestamp={msg.timestamp}
          />
        ))}

        {loading && (
          <View style={styles.typingIndicator}>
            <View style={styles.typingBubble}>
              <ActivityIndicator size="small" color={theme.colors.primary} />
              <Text style={styles.typingText}>Clarity is thinking...</Text>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Suggested questions */}
      {messages.length <= 1 && !loading && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.suggestionsScroll}
          contentContainerStyle={styles.suggestionsContent}
        >
          {SUGGESTED_QUESTIONS.map((q, i) => (
            <TouchableOpacity
              key={i}
              style={styles.suggestionPill}
              onPress={() => handleSend(q)}
            >
              <Text style={styles.suggestionPillText}>{q}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Input bar */}
      <View style={[styles.inputBar, { paddingBottom: insets.bottom + 8 }]}>
        {reachedLimit ? (
          <TouchableOpacity
            style={styles.limitBanner}
            onPress={() => setShowUpgrade(true)}
          >
            <Feather name="lock" size={14} color={theme.colors.warning} />
            <Text style={styles.limitText}>
              Daily limit reached. Upgrade for unlimited questions.
            </Text>
          </TouchableOpacity>
        ) : (
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Ask a wellness question..."
              placeholderTextColor={theme.colors.textTertiary}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
              returnKeyType="send"
              onSubmitEditing={() => handleSend()}
            />
            <TouchableOpacity
              style={[
                styles.sendButton,
                (!input.trim() || loading) && styles.sendButtonDisabled,
              ]}
              onPress={() => handleSend()}
              disabled={!input.trim() || loading}
            >
              <Feather
                name="send"
                size={18}
                color={
                  !input.trim() || loading
                    ? theme.colors.textTertiary
                    : theme.colors.surface
                }
              />
            </TouchableOpacity>
          </View>
        )}
      </View>

      <UpgradePrompt
        visible={showUpgrade}
        onClose={() => setShowUpgrade(false)}
        feature="unlimited Clarity questions"
        reason="You've reached today's free limit. Upgrade to ask unlimited questions."
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.md,
    backgroundColor: theme.colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatarSmall: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarSmallText: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.surface,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: theme.colors.textTertiary,
  },
  usageBadge: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.md,
    paddingVertical: 4,
  },
  usageText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  disclaimerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
    paddingVertical: theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  disclaimerBannerText: {
    flex: 1,
    fontSize: 11,
    color: theme.colors.textTertiary,
    lineHeight: 16,
  },
  messageList: {
    flex: 1,
  },
  messageContent: {
    paddingVertical: theme.spacing.lg,
    paddingBottom: theme.spacing.xxl,
  },
  typingIndicator: {
    paddingHorizontal: theme.spacing.lg,
    marginBottom: theme.spacing.md,
  },
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.surface,
    borderRadius: 18,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  typingText: {
    fontSize: 14,
    color: theme.colors.textTertiary,
    fontStyle: 'italic',
  },
  suggestionsScroll: {
    maxHeight: 60,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  suggestionsContent: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    gap: theme.spacing.sm,
    alignItems: 'center',
  },
  suggestionPill: {
    backgroundColor: theme.colors.primaryLight,
    borderRadius: theme.radius.pill,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    maxWidth: 220,
  },
  suggestionPillText: {
    fontSize: 13,
    color: theme.colors.primary,
    fontWeight: '500',
  },
  inputBar: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingTop: theme.spacing.md,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.background,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    minHeight: 48,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: theme.colors.textPrimary,
    maxHeight: 100,
    paddingVertical: 4,
  },
  sendButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: theme.colors.border,
  },
  limitBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
    backgroundColor: theme.colors.warningLight,
    borderRadius: theme.radius.card,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.sm,
    borderWidth: 1,
    borderColor: '#F5D49A',
  },
  limitText: {
    flex: 1,
    fontSize: 14,
    color: theme.colors.warning,
    fontWeight: '500',
  },
});
