import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { NavigationContainer } from '@react-navigation/native';
import ChatScreen from '@/app/chat/[id]';
import { useMessageStore } from '@/lib/store/messageStore';
import { useAuthStore } from '@/lib/store/authStore';

jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/config');
jest.mock('@expo/vector-icons', () => ({
  Ionicons: 'Ionicons',
}));
jest.mock('expo-router', () => ({
  ...jest.requireActual('expo-router'),
  useLocalSearchParams: () => ({ id: 'chat1' }),
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  }),
  Stack: {
    Screen: ({ children, options }: any) => children || null,
  },
}));

// Test wrapper with navigation context
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <NavigationContainer>{children}</NavigationContainer>
);

describe('Messaging Integration', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: { uid: 'user1', email: 'user1@test.com', displayName: 'Test User' } as any,
      loading: false,
      error: null,
    });

    useMessageStore.setState({
      messages: {},
      loading: false,
      error: null,
      sendingMessages: new Set(),
    });

    jest.clearAllMocks();
  });

  it('should send and display message', async () => {
    const { addDoc, updateDoc, serverTimestamp, collection, query, orderBy, limit, onSnapshot, doc } =
      require('firebase/firestore');

    addDoc.mockResolvedValue({ id: 'new-msg' });
    updateDoc.mockResolvedValue(undefined);
    serverTimestamp.mockReturnValue('TIMESTAMP');

    collection.mockReturnValue({});
    query.mockReturnValue({});
    orderBy.mockReturnValue({});
    limit.mockReturnValue({});
    doc.mockReturnValue({});

    // Mock onSnapshot with sequential calls: typing indicator first, then messages
    onSnapshot
      .mockImplementationOnce((ref: any, callback: any) => {
        // First call: typing indicator (document snapshot)
        callback({
          data: () => ({ typing: {} }),
          exists: () => true,
          id: 'chat1',
        });
        return jest.fn(); // unsubscribe
      })
      .mockImplementationOnce((ref: any, callback: any) => {
        // Second call: messages collection (query snapshot)
        callback({
          docs: [
            {
              id: 'new-msg',
              data: () => ({
                chatId: 'chat1',
                text: 'Test message',
                senderId: 'user1',
                timestamp: { toDate: () => new Date() },
                status: 'sent',
                readBy: ['user1'],
              }),
            },
          ],
        });
        // Send update after user sends message
        setTimeout(() => {
          callback({
            docs: [
              {
                id: 'new-msg',
                data: () => ({
                  chatId: 'chat1',
                  text: 'Test message',
                  senderId: 'user1',
                  timestamp: { toDate: () => new Date() },
                  status: 'sent',
                  readBy: ['user1'],
                }),
              },
            ],
          });
        }, 100);
        return jest.fn(); // unsubscribe
      });

    const { getByTestId, findByText } = render(<ChatScreen />, { wrapper: TestWrapper });

    const input = getByTestId('message-input');
    const sendButton = getByTestId('send-button');

    fireEvent.changeText(input, 'Test message');
    fireEvent.press(sendButton);

    // Should show optimistic message immediately
    const optimisticMessage = await findByText('Test message');
    expect(optimisticMessage).toBeTruthy();

    // Should confirm sent
    await waitFor(() => {
      expect(addDoc).toHaveBeenCalled();
    });
  });

  it('should receive messages in real-time', async () => {
    const { collection, query, orderBy, limit, onSnapshot, doc } = require('firebase/firestore');

    collection.mockReturnValue({});
    query.mockReturnValue({});
    orderBy.mockReturnValue({});
    limit.mockReturnValue({});
    doc.mockReturnValue({});

    // Mock onSnapshot with sequential calls: typing indicator first, then messages
    onSnapshot
      .mockImplementationOnce((ref: any, callback: any) => {
        // First call: typing indicator (document snapshot)
        callback({
          data: () => ({ typing: {} }),
          exists: () => true,
          id: 'chat1',
        });
        return jest.fn(); // unsubscribe
      })
      .mockImplementationOnce((ref: any, callback: any) => {
        // Second call: messages collection (query snapshot)
        callback({
          docs: [],
        });
        // Simulate incoming message after delay
        setTimeout(() => {
          callback({
            docs: [
              {
                id: 'incoming-msg',
                data: () => ({
                  chatId: 'chat1',
                  text: 'Incoming message',
                  senderId: 'user2',
                  timestamp: { toDate: () => new Date() },
                  status: 'sent',
                  readBy: ['user2'],
                }),
              },
            ],
          });
        }, 200);
        return jest.fn(); // unsubscribe
      });

    const { findByText } = render(<ChatScreen />, { wrapper: TestWrapper });

    // Should receive and display message
    const incomingMessage = await findByText('Incoming message', {}, { timeout: 3000 });
    expect(incomingMessage).toBeTruthy();
  });

  it('should mark messages as read when viewing', async () => {
    const { collection, query, orderBy, limit, onSnapshot, updateDoc, arrayUnion, doc } =
      require('firebase/firestore');

    collection.mockReturnValue({});
    query.mockReturnValue({});
    orderBy.mockReturnValue({});
    limit.mockReturnValue({});
    doc.mockReturnValue({});
    updateDoc.mockResolvedValue(undefined);
    arrayUnion.mockImplementation((val: any) => ['ARRAY_UNION', val]);

    // Mock onSnapshot with sequential calls: typing indicator first, then messages
    onSnapshot
      .mockImplementationOnce((ref: any, callback: any) => {
        // First call: typing indicator (document snapshot)
        callback({
          data: () => ({ typing: {} }),
          exists: () => true,
          id: 'chat1',
        });
        return jest.fn(); // unsubscribe
      })
      .mockImplementationOnce((ref: any, callback: any) => {
        // Second call: messages collection (query snapshot)
        callback({
          docs: [
            {
              id: 'msg1',
              data: () => ({
                chatId: 'chat1',
                text: 'Unread message',
                senderId: 'user2',
                timestamp: { toDate: () => new Date() },
                status: 'sent',
                readBy: ['user2'],
              }),
            },
          ],
        });
        return jest.fn(); // unsubscribe
      });

    render(<ChatScreen />, { wrapper: TestWrapper });

    await waitFor(() => {
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          readBy: ['ARRAY_UNION', 'user1'],
        })
      );
    });
  });
});
