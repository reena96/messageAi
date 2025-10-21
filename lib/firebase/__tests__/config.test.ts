import { firestore, auth } from '../config';

describe('Firebase Configuration', () => {
  it('should initialize Firestore', () => {
    expect(firestore).toBeDefined();
    expect(firestore.app.name).toBe('[DEFAULT]');
  });

  it('should initialize Auth', () => {
    expect(auth).toBeDefined();
    expect(auth.app.name).toBe('[DEFAULT]');
  });

  it('should have Firebase app configured', () => {
    expect(firestore.app).toBeDefined();
    expect(auth.app).toBeDefined();
    expect(firestore.app.name).toBe(auth.app.name);
  });
});
