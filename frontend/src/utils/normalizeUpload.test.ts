import { normalizeUpload } from './normalizeUpload';

test('нормализует строку', () => {
  expect(normalizeUpload('image.jpg')).toBe('image.jpg');
});

test('нормализует массив строк', () => {
  expect(normalizeUpload(['img1.jpg', 'img2.jpg'])).toBe('img1.jpg');
});
