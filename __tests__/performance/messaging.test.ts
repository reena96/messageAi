import { useMessageStore } from '@/lib/store/messageStore';

jest.mock('firebase/firestore');
jest.mock('@/lib/firebase/config');
jest.mock('@/lib/utils/performance');

describe('Messaging Performance', () => {
  beforeEach(() => {
    useMessageStore.setState({
      messages: {},
      loading: false,
      error: null,
      sendingMessages: new Set(),
    });

    jest.clearAllMocks();
  });

  it('should send message in <200ms', async () => {
    const { addDoc, updateDoc, serverTimestamp } = require('firebase/firestore');

    addDoc.mockResolvedValue({ id: 'msg-123' });
    updateDoc.mockResolvedValue(undefined);
    serverTimestamp.mockReturnValue('TIMESTAMP');

    const { sendMessage } = useMessageStore.getState();

    const startTime = Date.now();
    await sendMessage('chat1', 'user1', 'Test message');
    const endTime = Date.now();

    const duration = endTime - startTime;

    console.log(`⏱️ Message send time: ${duration}ms`);
    expect(duration).toBeLessThan(200);
  });

  it('should handle 20 messages in rapid succession', async () => {
    const { addDoc, updateDoc, serverTimestamp } = require('firebase/firestore');

    addDoc.mockResolvedValue({ id: 'msg' });
    updateDoc.mockResolvedValue(undefined);
    serverTimestamp.mockReturnValue('TIMESTAMP');

    const { sendMessage } = useMessageStore.getState();

    const startTime = Date.now();
    const promises = [];

    for (let i = 0; i < 20; i++) {
      promises.push(sendMessage('chat1', 'user1', `Message ${i + 1}`));
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    await Promise.all(promises);
    const endTime = Date.now();

    const duration = endTime - startTime;

    console.log(`⏱️ 20 messages sent in: ${duration}ms`);
    console.log(`⏱️ Average: ${duration / 20}ms per message`);

    expect(duration).toBeLessThan(5000); // Allow 5s for 20 messages
    expect(addDoc).toHaveBeenCalledTimes(20);
  });
});
