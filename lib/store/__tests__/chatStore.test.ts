import { renderHook, act, waitFor } from '@testing-library/react-native';
import { useChatStore } from '../chatStore';

// Mock Firebase modules
jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/config');

describe('chatStore', () => {
  beforeEach(() => {
    // Reset store state before each test
    useChatStore.setState({ chats: [], loading: false, error: null });

    // Reset all mocks
    jest.clearAllMocks();
  });

  describe('subscribeToChats', () => {
    it('should load user chats on subscribe', async () => {
      const { collection, query, where, orderBy, limit, onSnapshot } = require('firebase/firestore');

      const mockChats = [
        {
          id: 'chat1',
          type: 'one-on-one',
          participants: ['user1', 'user2'],
          participantDetails: {
            user2: { displayName: 'User 2' },
          },
          unreadCount: { user1: 0, user2: 0 },
          createdBy: 'user1',
          createdAt: { toDate: () => new Date('2024-01-01') },
          updatedAt: { toDate: () => new Date('2024-01-02') },
        },
      ];

      collection.mockReturnValue({});
      query.mockReturnValue({});
      where.mockReturnValue({});
      orderBy.mockReturnValue({});
      limit.mockReturnValue({});

      onSnapshot.mockImplementation((q: any, callback: any) => {
        callback({
          docs: mockChats.map((chat) => ({
            id: chat.id,
            data: () => chat,
          })),
        });
        return jest.fn(); // unsubscribe function
      });

      const { result } = renderHook(() => useChatStore());

      let unsubscribe: any;
      await act(async () => {
        unsubscribe = result.current.subscribeToChats('user1');
      });

      await waitFor(() => {
        expect(result.current.chats).toHaveLength(1);
        expect(result.current.chats[0].id).toBe('chat1');
        expect(result.current.loading).toBe(false);
      });
    });

    it('should filter chats by user participants', () => {
      const { collection, query, where, orderBy, limit, onSnapshot } = require('firebase/firestore');

      collection.mockReturnValue({});
      query.mockReturnValue({});
      where.mockReturnValue({});
      orderBy.mockReturnValue({});
      limit.mockReturnValue({});
      onSnapshot.mockReturnValue(jest.fn());

      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.subscribeToChats('user1');
      });

      expect(where).toHaveBeenCalledWith('participants', 'array-contains', 'user1');
    });

    it('should order chats by updatedAt descending', () => {
      const { collection, query, where, orderBy, limit, onSnapshot } = require('firebase/firestore');

      collection.mockReturnValue({});
      query.mockReturnValue({});
      where.mockReturnValue({});
      orderBy.mockReturnValue({});
      limit.mockReturnValue({});
      onSnapshot.mockReturnValue(jest.fn());

      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.subscribeToChats('user1');
      });

      expect(orderBy).toHaveBeenCalledWith('updatedAt', 'desc');
    });

    it('should limit chats to 100', () => {
      const { collection, query, where, orderBy, limit, onSnapshot } = require('firebase/firestore');

      collection.mockReturnValue({});
      query.mockReturnValue({});
      where.mockReturnValue({});
      orderBy.mockReturnValue({});
      limit.mockReturnValue({});
      onSnapshot.mockReturnValue(jest.fn());

      const { result } = renderHook(() => useChatStore());

      act(() => {
        result.current.subscribeToChats('user1');
      });

      expect(limit).toHaveBeenCalledWith(100);
    });
  });

  describe('createOneOnOneChat', () => {
    it('should return existing chat if already exists', async () => {
      const { collection, query, where, getDocs } = require('firebase/firestore');

      const existingChatId = 'existing-chat-id';
      const mockSnapshot = {
        docs: [
          {
            id: existingChatId,
            data: () => ({
              participants: ['user1', 'user2'],
              type: 'one-on-one',
            }),
          },
        ],
      };

      collection.mockReturnValue({});
      query.mockReturnValue({});
      where.mockReturnValue({});
      getDocs.mockResolvedValue(mockSnapshot);

      const { result } = renderHook(() => useChatStore());

      let chatId: string;
      await act(async () => {
        chatId = await result.current.createOneOnOneChat(
          'user1',
          'user2',
          { displayName: 'User 2' }
        );
      });

      expect(chatId!).toBe(existingChatId);
      expect(result.current.loading).toBe(false);
    });

    it('should create new chat if none exists', async () => {
      const { collection, query, where, getDocs, addDoc, serverTimestamp } = require('firebase/firestore');

      const newChatId = 'new-chat-id';
      const mockSnapshot = { docs: [] };

      collection.mockReturnValue({});
      query.mockReturnValue({});
      where.mockReturnValue({});
      getDocs.mockResolvedValue(mockSnapshot);
      addDoc.mockResolvedValue({ id: newChatId });
      serverTimestamp.mockReturnValue('TIMESTAMP');

      const { result } = renderHook(() => useChatStore());

      let chatId: string;
      await act(async () => {
        chatId = await result.current.createOneOnOneChat(
          'user1',
          'user2',
          { displayName: 'User 2', photoURL: 'photo.jpg' }
        );
      });

      expect(chatId!).toBe(newChatId);
      expect(addDoc).toHaveBeenCalled();
      expect(result.current.loading).toBe(false);
    });
  });

  describe('createGroupChat', () => {
    it('should create group chat with participants', async () => {
      const { collection, addDoc, serverTimestamp } = require('firebase/firestore');

      const groupChatId = 'group-chat-id';
      collection.mockReturnValue({});
      addDoc.mockResolvedValue({ id: groupChatId });
      serverTimestamp.mockReturnValue('TIMESTAMP');

      const { result } = renderHook(() => useChatStore());

      let chatId: string;
      await act(async () => {
        chatId = await result.current.createGroupChat(
          'user1',
          ['user2', 'user3'],
          'Test Group',
          { displayName: 'User 1' },
          {
            user2: { displayName: 'User 2' },
            user3: { displayName: 'User 3' },
          }
        );
      });

      expect(chatId!).toBe(groupChatId);
      expect(addDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          type: 'group',
          participants: ['user1', 'user2', 'user3'],
          groupName: 'Test Group',
        })
      );
      expect(result.current.loading).toBe(false);
    });
  });
});
