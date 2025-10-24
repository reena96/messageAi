import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useMessageStore } from '../messageStore';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/config');
jest.mock('@/lib/utils/performance');

describe('messageStore', () => {
  // Suppress console.error for expected errors during tests
  const originalConsoleError = console.error;

  beforeEach(() => {
    // Reset store state before each test
    useMessageStore.setState({
      messages: {},
      loading: false,
      error: null,
      sendingMessages: new Set(),
    });

    // Reset all mocks
    jest.clearAllMocks();

    // Mock console.error to suppress expected error logs
    console.error = jest.fn();
  });

  afterEach(() => {
    // Restore console.error
    console.error = originalConsoleError;
  });

  describe('sendMessage', () => {
    it('should add optimistic message immediately', async () => {
      const { addDoc, updateDoc, collection, doc, serverTimestamp } = require('firebase/firestore');

      collection.mockReturnValue({});
      doc.mockReturnValue({});
      addDoc.mockResolvedValue({ id: 'msg-123' });
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      const { result } = renderHook(() => useMessageStore());

      // Send message
      let sendPromise: Promise<void>;
      act(() => {
        sendPromise = result.current.sendMessage('chat1', 'user1', 'Hello!');
      });

      // Check optimistic message exists (state should be updated synchronously)
      const chatMessages = result.current.messages['chat1'] || [];
      expect(chatMessages.length).toBeGreaterThan(0);

      const optimisticMsg = chatMessages.find(m => m.tempId);
      expect(optimisticMsg).toBeDefined();
      if (optimisticMsg) {
        expect(optimisticMsg.text).toBe('Hello!');
        expect(optimisticMsg.status).toBe('sending');
        expect(optimisticMsg.tempId).toBeDefined();
      }

      // Wait for completion
      await act(async () => {
        await sendPromise!;
      });
    });

    it('should write message to Firestore', async () => {
      const { addDoc, updateDoc, serverTimestamp, collection, doc } = require('firebase/firestore');

      collection.mockReturnValue({});
      doc.mockReturnValue({});
      addDoc.mockResolvedValue({ id: 'msg-123' });
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      const { result } = renderHook(() => useMessageStore());

      await act(async () => {
        await result.current.sendMessage('chat1', 'user1', 'Hello!');
      });

      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          chatId: 'chat1',
          senderId: 'user1',
          text: 'Hello!',
          status: 'sent',
        })
      );
    });

    it('should update chat lastMessage', async () => {
      const { addDoc, updateDoc, serverTimestamp, collection, doc } = require('firebase/firestore');

      const mockDocRef = { id: 'chat1' };
      collection.mockReturnValue({});
      doc.mockReturnValue(mockDocRef);
      addDoc.mockResolvedValue({ id: 'msg-123' });
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      const { result } = renderHook(() => useMessageStore());

      await act(async () => {
        await result.current.sendMessage('chat1', 'user1', 'Hello!');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          lastMessage: expect.objectContaining({
            text: 'Hello!',
            senderId: 'user1',
          }),
        })
      );
    });

    it('should track performance metrics', async () => {
      const { addDoc, updateDoc, collection, doc, serverTimestamp } = require('firebase/firestore');
      const { performanceMonitor } = require('@/lib/utils/performance');

      collection.mockReturnValue({});
      doc.mockReturnValue({});
      addDoc.mockResolvedValue({ id: 'msg-123' });
      updateDoc.mockResolvedValue(undefined);
      serverTimestamp.mockReturnValue('TIMESTAMP');

      const mockMark = jest.fn();
      const mockMeasure = jest.fn();
      performanceMonitor.mark = mockMark;
      performanceMonitor.measure = mockMeasure;

      const { result } = renderHook(() => useMessageStore());

      await act(async () => {
        await result.current.sendMessage('chat1', 'user1', 'Hello!');
      });

      expect(mockMark).toHaveBeenCalled();
      expect(mockMeasure).toHaveBeenCalledWith(
        'Message Send Time',
        expect.stringContaining('message-send')
      );
    });

    it('should handle send errors', async () => {
      const { addDoc, collection, doc } = require('firebase/firestore');

      collection.mockReturnValue({});
      doc.mockReturnValue({});
      addDoc.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMessageStore());

      await act(async () => {
        try {
          await result.current.sendMessage('chat1', 'user1', 'Hello!');
        } catch (error) {
          // Expected to throw
        }
      });

      // Check message marked as failed
      const chatMessages = result.current.messages['chat1'] || [];
      const failedMsg = chatMessages.find((m) => m.status === 'failed');

      expect(failedMsg).toBeDefined();
      expect(result.current.error).toBeDefined();

      // Verify console.error was called
      expect(console.error).toHaveBeenCalledWith('Error sending message:', expect.any(Error));
    });
  });

  describe('markAsRead', () => {
    it('should update readBy array', async () => {
      const { updateDoc, arrayUnion, doc } = require('firebase/firestore');

      const mockDocRef = { id: 'msg1' };
      doc.mockReturnValue(mockDocRef);
      updateDoc.mockResolvedValue(undefined);
      arrayUnion.mockImplementation((val: any) => ['ARRAY_UNION', val]);

      const { result } = renderHook(() => useMessageStore());

      await act(async () => {
        await result.current.markAsRead('chat1', 'msg1', 'user2');
      });

      expect(updateDoc).toHaveBeenCalledWith(
        mockDocRef,
        expect.objectContaining({
          readBy: ['ARRAY_UNION', 'user2'],
        })
      );
    });

    it('should handle markAsRead errors gracefully', async () => {
      const { updateDoc, doc } = require('firebase/firestore');

      doc.mockReturnValue({});
      updateDoc.mockRejectedValue(new Error('Permission denied'));

      const { result } = renderHook(() => useMessageStore());

      // Should not throw
      await act(async () => {
        await result.current.markAsRead('chat1', 'msg1', 'user2');
      });

      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('subscribeToMessages', () => {
    it('should subscribe to chat messages', () => {
      const { collection, query, orderBy, limit, onSnapshot } = require('firebase/firestore');

      const mockMessages = [
        {
          id: 'msg1',
          chatId: 'chat1',
          senderId: 'user1',
          text: 'Hello',
          status: 'sent',
          readBy: ['user1'],
          timestamp: { toDate: () => new Date() },
        },
      ];

      collection.mockReturnValue({});
      query.mockReturnValue({});
      orderBy.mockReturnValue({});
      limit.mockReturnValue({});

      onSnapshot.mockImplementation((q: any, callback: any) => {
        callback({
          docs: mockMessages.map((msg) => ({
            id: msg.id,
            data: () => msg,
          })),
        });
        return jest.fn(); // unsubscribe function
      });

      const { result } = renderHook(() => useMessageStore());

      act(() => {
        result.current.subscribeToMessages('chat1');
      });

      expect(onSnapshot).toHaveBeenCalled();
    });

    it('should order messages by timestamp ascending', () => {
      const { collection, query, orderBy, onSnapshot } = require('firebase/firestore');

      collection.mockReturnValue({});
      query.mockReturnValue({});
      orderBy.mockReturnValue({});
      onSnapshot.mockReturnValue(jest.fn());

      const { result } = renderHook(() => useMessageStore());

      act(() => {
        result.current.subscribeToMessages('chat1');
      });

      expect(orderBy).toHaveBeenCalledWith('timestamp', 'asc');
    });
  });
});
