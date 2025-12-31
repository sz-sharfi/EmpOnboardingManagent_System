/**
 * Environment Variables Validation
 * Ensures required environment variables are present and valid
 */

export interface EnvironmentConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

/**
 * Validate and retrieve environment variables
 * Throws error with helpful message if variables are missing or invalid
 */
export function validateEnvironment(): EnvironmentConfig {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  // Check if variables exist
  if (!supabaseUrl) {
    throw new Error(
      '❌ VITE_SUPABASE_URL is not set!\n\n' +
      'Please create a .env file in the project root with:\n' +
      'VITE_SUPABASE_URL=https://your-project.supabase.co\n\n' +
      'See .env.example for reference or ENVIRONMENT_SETUP.md for detailed instructions.'
    );
  }

  if (!supabaseAnonKey) {
    throw new Error(
      '❌ VITE_SUPABASE_ANON_KEY is not set!\n\n' +
      'Please add your Supabase anon key to the .env file:\n' +
      'VITE_SUPABASE_ANON_KEY=your-anon-key-here\n\n' +
      'Get your key from: Supabase Dashboard → Settings → API → anon public\n' +
      'See ENVIRONMENT_SETUP.md for detailed instructions.'
    );
  }

  // Validate URL format
  if (!supabaseUrl.startsWith('https://')) {
    console.warn(
      '⚠️ Warning: VITE_SUPABASE_URL should start with https://\n' +
      `Current value: ${supabaseUrl}\n` +
      'This may cause connection issues.'
    );
  }

  if (supabaseUrl.endsWith('/')) {
    console.warn(
      '⚠️ Warning: VITE_SUPABASE_URL should not end with /\n' +
      'Removing trailing slash...'
    );
  }

  // Validate key format (JWT tokens start with 'eyJ')
  if (!supabaseAnonKey.startsWith('eyJ')) {
    console.warn(
      '⚠️ Warning: VITE_SUPABASE_ANON_KEY should be a JWT token (starts with eyJ)\n' +
      'Make sure you copied the "anon public" key, not the "service_role" key.'
    );
  }

  // Check key length (JWT tokens are typically 200+ characters)
  if (supabaseAnonKey.length < 100) {
    console.warn(
      '⚠️ Warning: VITE_SUPABASE_ANON_KEY seems too short\n' +
      'Make sure you copied the complete key from Supabase dashboard.'
    );
  }

  // Remove trailing slash from URL if present
  const cleanUrl = supabaseUrl.replace(/\/$/, '');

  // Log success in development mode only
  if (import.meta.env.DEV) {
    console.log('✅ Environment variables loaded successfully');
    console.log('📍 Supabase URL:', cleanUrl);
    console.log('🔑 Anon Key:', supabaseAnonKey.substring(0, 20) + '...[HIDDEN]');
  }

  return {
    supabaseUrl: cleanUrl,
    supabaseAnonKey,
  };
}

/**
 * Check environment variables without throwing
 * Useful for conditional features
 */
export function checkEnvironment(): {
  isValid: boolean;
  hasUrl: boolean;
  hasKey: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  const hasUrl = !!import.meta.env.VITE_SUPABASE_URL;
  const hasKey = !!import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!hasUrl) {
    errors.push('VITE_SUPABASE_URL is not set');
  }

  if (!hasKey) {
    errors.push('VITE_SUPABASE_ANON_KEY is not set');
  }

  return {
    isValid: hasUrl && hasKey,
    hasUrl,
    hasKey,
    errors,
  };
}

/**
 * Get environment mode
 */
export function getEnvironmentMode(): 'development' | 'production' | 'test' {
  if (import.meta.env.MODE === 'production') return 'production';
  if (import.meta.env.MODE === 'test') return 'test';
  return 'development';
}

/**
 * Check if running in development
 */
export function isDevelopment(): boolean {
  return import.meta.env.DEV;
}

/**
 * Check if running in production
 */
export function isProduction(): boolean {
  return import.meta.env.PROD;
}

/**
 * Log environment info (development only)
 */
export function logEnvironmentInfo(): void {
  if (!isDevelopment()) return;

  console.group('🌍 Environment Information');
  console.log('Mode:', getEnvironmentMode());
  console.log('Development:', isDevelopment());
  console.log('Production:', isProduction());
  
  const envCheck = checkEnvironment();
  console.log('Environment Valid:', envCheck.isValid ? '✅' : '❌');
  console.log('Has Supabase URL:', envCheck.hasUrl ? '✅' : '❌');
  console.log('Has Anon Key:', envCheck.hasKey ? '✅' : '❌');
  
  if (envCheck.errors.length > 0) {
    console.error('Errors:', envCheck.errors);
  }
  
  console.groupEnd();
}
