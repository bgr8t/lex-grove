import { z } from 'zod';
import DOMPurify from 'dompurify';

// Enhanced validation schema with security considerations
export const secureCreateBriefSchema = z.object({
  title: z.string()
    .min(1, 'Brief title is required')
    .max(100, 'Title must be 100 characters or less')
    .regex(/^[a-zA-Z0-9\s\-\.\(\),&]+$/, 'Title contains invalid characters'),
  facts: z.string()
    .min(10, 'Facts must be at least 10 characters')
    .max(5000, 'Facts must be 5000 characters or less'),
  issue: z.string()
    .min(10, 'Issue must be at least 10 characters')
    .max(2000, 'Issue must be 2000 characters or less'),
  rule: z.string()
    .min(10, 'Rule must be at least 10 characters')
    .max(2000, 'Rule must be 2000 characters or less'),
  analysis: z.string()
    .min(20, 'Analysis must be at least 20 characters')
    .max(5000, 'Analysis must be 5000 characters or less'),
  conclusion: z.string()
    .min(10, 'Conclusion must be at least 10 characters')
    .max(2000, 'Conclusion must be 2000 characters or less'),
  tags: z.array(z.string().max(30)).max(10, 'Maximum 10 tags allowed').optional(),
});

export type SecureCreateBriefFormValues = z.infer<typeof secureCreateBriefSchema>;

/**
 * Sanitize user input to prevent XSS attacks
 */
export function sanitizeBriefInput(input: SecureCreateBriefFormValues): SecureCreateBriefFormValues {
  const sanitized = { ...input };
  
  // Sanitize string fields
  sanitized.title = DOMPurify.sanitize(input.title, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
  
  sanitized.facts = DOMPurify.sanitize(input.facts, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
  
  sanitized.issue = DOMPurify.sanitize(input.issue, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
  
  sanitized.rule = DOMPurify.sanitize(input.rule, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
  
  sanitized.analysis = DOMPurify.sanitize(input.analysis, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
  
  sanitized.conclusion = DOMPurify.sanitize(input.conclusion, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  }).trim();
  
  // Sanitize tags array
  if (sanitized.tags) {
    sanitized.tags = sanitized.tags.map(tag => 
      DOMPurify.sanitize(tag, { 
        ALLOWED_TAGS: [], 
        ALLOWED_ATTR: [] 
      }).trim()
    );
  }
  
  return sanitized;
}

/**
 * Additional validation for case brief content
 */
export function validateCaseBriefContent(values: SecureCreateBriefFormValues): string[] {
  const errors: string[] = [];
  
  // Check for suspicious patterns
  const suspiciousPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /data:text\/html/i,
  ];
  
  const textFields = [
    values.title, 
    values.facts, 
    values.issue, 
    values.rule, 
    values.analysis, 
    values.conclusion
  ];
  
  for (const field of textFields) {
    for (const pattern of suspiciousPatterns) {
      if (pattern.test(field)) {
        errors.push('Content contains potentially unsafe elements');
        break;
      }
    }
  }
  
  // Check minimum content quality
  if (values.facts.split(' ').length < 5) {
    errors.push('Facts section needs more detail');
  }
  
  if (values.analysis.split(' ').length < 10) {
    errors.push('Analysis section needs more detail');
  }
  
  return errors;
}

/**
 * Rate limiting check (client-side helper)
 */
export function checkBriefCreationRateLimit(userId: string): boolean {
  const key = `${userId}_create_brief`;
  const now = Date.now();
  const stored = localStorage.getItem(key);
  
  if (stored) {
    const { timestamp, count } = JSON.parse(stored);
    const timeDiff = now - timestamp;
    
    // Allow 3 brief creations per hour
    if (timeDiff < 60 * 60 * 1000 && count >= 3) {
      return false;
    }
    
    // Reset if more than an hour has passed
    if (timeDiff >= 60 * 60 * 1000) {
      localStorage.setItem(key, JSON.stringify({ timestamp: now, count: 1 }));
      return true;
    }
    
    // Increment counter
    localStorage.setItem(key, JSON.stringify({ timestamp, count: count + 1 }));
    return true;
  }
  
  // First time
  localStorage.setItem(key, JSON.stringify({ timestamp: now, count: 1 }));
  return true;
} 