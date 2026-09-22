import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { format } from 'date-fns';
import { useRouter } from 'expo-router';

export interface Message {
  id: string;
  content: string;
  senderName: string;
  createdAt: string;
  isMine: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message }) => {
  const router = useRouter();

  const renderContentWithTags = (content: string) => {
    const words = content.split(/(\s+)/);
    return words.map((word, index) => {
      if (word.startsWith('#') && word.length > 1) {
        const tag = word.substring(1);
        return (
          <Text
            key={index}
            style={styles.tagText}
            onPress={() => router.push(`/tags/${tag}`)}
          >
            {word}
          </Text>
        );
      }
      return <Text key={index}>{word}</Text>;
    });
  };

  return (
    <View style={[styles.container, message.isMine ? styles.myContainer : styles.otherContainer]}>
      {!message.isMine && <Text style={styles.senderName}>{message.senderName}</Text>}
      <View style={[styles.bubble, message.isMine ? styles.myBubble : styles.otherBubble]}>
        <Text style={[styles.content, message.isMine ? styles.myContent : styles.otherContent]}>
          {renderContentWithTags(message.content)}
        </Text>
      </View>
      <Text style={[styles.timestamp, message.isMine ? styles.myTimestamp : styles.otherTimestamp]}>
        {format(new Date(message.createdAt), 'h:mm a')}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
    maxWidth: '80%',
  },
  myContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  senderName: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
    marginLeft: 4,
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  myBubble: {
    backgroundColor: '#1B4FD8',
    borderBottomRightRadius: 4,
  },
  otherBubble: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  content: {
    fontSize: 15,
    lineHeight: 22,
  },
  myContent: {
    color: '#FFFFFF',
  },
  otherContent: {
    color: '#111827',
  },
  tagText: {
    color: '#3B82F6',
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 11,
    marginTop: 4,
  },
  myTimestamp: {
    color: '#9CA3AF',
    alignSelf: 'flex-end',
  },
  otherTimestamp: {
    color: '#9CA3AF',
    alignSelf: 'flex-start',
    marginLeft: 4,
  },
});
