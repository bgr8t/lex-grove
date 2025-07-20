/**
 * Markdown security utilities for safe rendering of user-generated content
 */

import rehypeSanitize, { defaultSchema } from 'rehype-sanitize';
import { sanitizeInput, sanitizeUrl } from './security';

/**
 * Safe HTML schema for markdown content
 * Based on GitHub's markdown sanitization but more restrictive
 */
export const safeMarkdownSchema = {
  ...defaultSchema,
  tagNames: [
    // Text formatting
    'p', 'br', 'strong', 'b', 'em', 'i', 'u', 's', 'del', 'ins',
    // Headings
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    // Lists
    'ul', 'ol', 'li',
    // Quotes and code
    'blockquote', 'code', 'pre',
    // Tables
    'table', 'thead', 'tbody', 'tr', 'th', 'td',
    // Links (with restrictions)
    'a',
    // Horizontal rule
    'hr',
    // Line breaks and spans
    'span', 'div',
  ],
  attributes: {
    ...defaultSchema.attributes,
    // Only allow safe attributes on links
    a: ['href', 'title'],
    // Remove any other potentially dangerous attributes
    '*': [],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],
  },
  ancestors: {
    li: ['ol', 'ul'],
    td: ['tr'],
    th: ['tr'],
    tr: ['table', 'thead', 'tbody'],
    thead: ['table'],
    tbody: ['table'],
  },
  clobberPrefix: 'user-content-',
  clobber: ['name', 'id'],
  strip: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input', 'button'],
};

/**
 * Extra restrictive schema for user comments and brief descriptions
 */
export const restrictiveMarkdownSchema = {
  ...safeMarkdownSchema,
  tagNames: [
    'p', 'br', 'strong', 'b', 'em', 'i',
    'ul', 'ol', 'li',
    'code', 'blockquote',
    'a',
  ],
  attributes: {
    a: ['href', 'title'],
    '*': [],
  },
};

/**
 * Configuration for different content types
 */
export const markdownConfigs = {
  // For articles and research documents (more permissive)
  article: {
    schema: safeMarkdownSchema,
    rehypePlugins: [
      [rehypeSanitize, safeMarkdownSchema]
    ],
  },
  
  // For user comments and descriptions (restrictive)
  comment: {
    schema: restrictiveMarkdownSchema,
    rehypePlugins: [
      [rehypeSanitize, restrictiveMarkdownSchema]
    ],
  },
  
  // For case briefs and legal content (balanced)
  legal: {
    schema: {
      ...safeMarkdownSchema,
      tagNames: [
        'p', 'br', 'strong', 'b', 'em', 'i',
        'h1', 'h2', 'h3', 'h4',
        'ul', 'ol', 'li',
        'blockquote', 'code', 'pre',
        'table', 'thead', 'tbody', 'tr', 'th', 'td',
        'a', 'hr',
      ],
    },
    rehypePlugins: [
      [rehypeSanitize, {
        ...safeMarkdownSchema,
        tagNames: [
          'p', 'br', 'strong', 'b', 'em', 'i',
          'h1', 'h2', 'h3', 'h4',
          'ul', 'ol', 'li',
          'blockquote', 'code', 'pre',
          'table', 'thead', 'tbody', 'tr', 'th', 'td',
          'a', 'hr',
        ],
      }]
    ],
  },
};

/**
 * Pre-processes markdown content before rendering
 * @param content Raw markdown content
 * @param contentType Type of content for appropriate sanitization level
 * @returns Sanitized markdown content
 */
export const preprocessMarkdown = (
  content: string | null | undefined, 
  contentType: 'article' | 'comment' | 'legal' = 'article'
): string => {
  if (!content) return '';
  
  // First pass: Basic XSS protection on the raw markdown
  const sanitizedContent = sanitizeInput(content);
  
  // Additional markdown-specific sanitization
  return sanitizedContent
    // Remove HTML comments
    .replace(/<!--[\s\S]*?-->/g, '')
    // Remove script tags that might have been missed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    // Remove style tags
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
    // Remove iframe tags
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    // Sanitize any remaining URLs in markdown links
    .replace(/\[([^\]]*)\]\(([^)]+)\)/g, (match, text, url) => {
      const sanitizedUrl = sanitizeUrl(url);
      return sanitizedUrl ? `[${text}](${sanitizedUrl})` : text;
    })
    // Remove excessive whitespace but preserve formatting
    .replace(/\n{4,}/g, '\n\n\n')
    .trim();
};

/**
 * Validates markdown content for security issues
 * @param content Markdown content to validate
 * @returns Object with validation results
 */
export const validateMarkdownSecurity = (content: string): {
  isValid: boolean;
  warnings: string[];
  sanitizedContent: string;
} => {
  const warnings: string[] = [];
  
  if (!content) {
    return { isValid: true, warnings: [], sanitizedContent: '' };
  }
  
  // Check for potential security issues
  const securityChecks = [
    {
      test: /<script/i,
      warning: 'Script tags detected in markdown content',
    },
    {
      test: /javascript:/i,
      warning: 'JavaScript protocol detected in URLs',
    },
    {
      test: /data:/i,
      warning: 'Data URLs detected (potential XSS vector)',
    },
    {
      test: /<iframe/i,
      warning: 'iframe tags detected',
    },
    {
      test: /<object/i,
      warning: 'Object tags detected',
    },
    {
      test: /<embed/i,
      warning: 'Embed tags detected',
    },
    {
      test: /on\w+\s*=/i,
      warning: 'Event handlers detected in HTML attributes',
    },
  ];
  
  securityChecks.forEach(({ test, warning }) => {
    if (test.test(content)) {
      warnings.push(warning);
    }
  });
  
  const sanitizedContent = preprocessMarkdown(content);
  const isValid = warnings.length === 0;
  
  return { isValid, warnings, sanitizedContent };
};

/**
 * Hook to use secure markdown rendering in React components
 */
export const useSecureMarkdown = () => {
  return {
    preprocess: preprocessMarkdown,
    validate: validateMarkdownSecurity,
    configs: markdownConfigs,
  };
};

/**
 * Default export with the most commonly used configuration
 */
export default {
  preprocess: preprocessMarkdown,
  validate: validateMarkdownSecurity,
  configs: markdownConfigs,
  schemas: {
    safe: safeMarkdownSchema,
    restrictive: restrictiveMarkdownSchema,
  },
}; 