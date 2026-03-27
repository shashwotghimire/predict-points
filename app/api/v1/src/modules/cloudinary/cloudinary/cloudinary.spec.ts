import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryProvider } from './cloudinary';

jest.mock('cloudinary', () => ({
  v2: {
    config: jest.fn(() => 'configured-cloudinary'),
  },
}));

describe('Cloudinary', () => {
  it('builds the cloudinary provider configuration from env vars', () => {
    process.env.CLOUDINARY_NAME = 'demo-cloud';
    process.env.CLOUDINARY_API_KEY = 'key-123';
    process.env.CLOUDINARY_API_SECRET = 'secret-123';

    const configured = CloudinaryProvider.useFactory();

    expect(CloudinaryProvider.provide).toBe('CLOUDINARY');
    expect(configured).toBe('configured-cloudinary');
    expect(cloudinary.config).toHaveBeenCalledWith({
      cloud_name: 'demo-cloud',
      api_key: 'key-123',
      api_secret: 'secret-123',
    });
  });
});
