import { firestore, auth } from '../config';

describe('Firebase Configuration', () => {
  it('should initialize Firestore', () => {
    expect(firestore).toBeDefined();
    expect(firestore().app.name).toBe('[DEFAULT]');
  });

  it('should initialize Auth', () => {
    expect(auth).toBeDefined();
    expect(auth().app.name).toBe('[DEFAULT]');
  });

  it('should have offline persistence enabled', () => {
    const settings = firestore()._settings;
    expect(settings.persistence).toBe(true);
  });
});
