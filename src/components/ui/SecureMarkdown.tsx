/**
 * Secure Markdown component with built-in XSS protection and sanitization
 * Use this component instead of ReactMarkdown directly for user-generated content
 */

import React from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeSanitize from 'rehype-sanitize';
import { markdownConfigs, preprocessMarkdown, validateMarkdownSecurity } from '@/utils/markdownSecurity';
import { cn } from '@/lib/utils';

interface SecureMarkdownProps {
  /** Markdown content to render */
  children: string | null | undefined;
  /** Content type for appropriate security level */
  contentType?: 'article' | 'comment' | 'legal';
  /** Additional CSS classes */
  className?: string;
  /** Whether to show security warnings in development */
  showWarnings?: boolean;
  /** Custom components for ReactMarkdown */
  components?: React.ComponentProps<typeof ReactMarkdown>['components'];
  /** Whether to skip link transformation */
  skipHtml?: boolean;
}

/**
 * SecureMarkdown component that automatically sanitizes content
 */
export const SecureMarkdown: React.FC<SecureMarkdownProps> = ({
  children,
  contentType = 'article',
  className,
  showWarnings = process.env.NODE_ENV === 'development',
  components,
  skipHtml = false,
}) => {
  // Validate and sanitize content
  const { isValid, warnings, sanitizedContent } = validateMarkdownSecurity(children || '');
  
  // Log warnings in development
  React.useEffect(() => {
    if (showWarnings && warnings.length > 0) {
      console.warn('SecureMarkdown security warnings:', warnings);
    }
  }, [warnings, showWarnings]);
  
  // Preprocess content based on type
  const processedContent = preprocessMarkdown(sanitizedContent, contentType);
  
  if (!processedContent) {
    return null;
  }
  
  // Get configuration for content type
  const config = markdownConfigs[contentType];
  
  // Default secure components
  const secureComponents: React.ComponentProps<typeof ReactMarkdown>['components'] = {
    // Secure link component
    a: ({ href, children, title, ...props }) => {
      // Validate URL before rendering
      if (!href || href.startsWith('javascript:') || href.startsWith('data:')) {
        return <span className="text-muted-foreground">{children}</span>;
      }
      
      // External links open in new tab with security attributes
      const isExternal = href.startsWith('http://') || href.startsWith('https://');
      if (isExternal) {
        return (
          <a
            href={href}
            title={title}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="text-blue-600 hover:text-blue-800 underline"
            {...props}
          >
            {children}
          </a>
        );
      }
      
      // Internal links
      return (
        <a
          href={href}
          title={title}
          className="text-blue-600 hover:text-blue-800 underline"
          {...props}
        >
          {children}
        </a>
      );
    },
    
    // Secure image component (if images are allowed)
    img: ({ src, alt, title, ...props }) => {
      // Block data URLs and javascript
      if (!src || src.startsWith('javascript:') || src.startsWith('data:')) {
        return <span className="text-muted-foreground italic">[Image blocked for security]</span>;
      }
      
      return (
        <img
          src={src}
          alt={alt || 'User uploaded image'}
          title={title}
          loading="lazy"
          className="max-w-full h-auto rounded-md"
          {...props}
        />
      );
    },
    
    // Security-conscious code blocks
    code: ({ children, className, ...props }) => {
      return (
        <code
          className={cn(
            'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
            className
          )}
          {...props}
        >
          {children}
        </code>
      );
    },
    
    // Pre blocks for code
    pre: ({ children, ...props }) => {
      return (
        <pre
          className="mb-4 mt-6 overflow-x-auto rounded-lg bg-muted p-4"
          {...props}
        >
          {children}
        </pre>
      );
    },
    
    // Custom components override defaults
    ...components,
  };
  
  return (
    <div className={cn('prose dark:prose-invert max-w-none', className)}>
      {/* Show warnings in development */}
      {showWarnings && warnings.length > 0 && (
        <div className="mb-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-sm text-yellow-800">
          <strong>Security warnings:</strong>
          <ul className="mt-1 ml-4 list-disc">
            {warnings.map((warning, index) => (
              <li key={index}>{warning}</li>
            ))}
          </ul>
        </div>
      )}
      
      <ReactMarkdown
        components={secureComponents}
        rehypePlugins={[[rehypeSanitize, config.schema]]}
        skipHtml={skipHtml}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
};

/**
 * Lightweight secure markdown for comments and short content
 */
export const SecureMarkdownComment: React.FC<Omit<SecureMarkdownProps, 'contentType'>> = (props) => {
  return <SecureMarkdown {...props} contentType="comment" />;
};

/**
 * Secure markdown for legal content with appropriate styling
 */
export const SecureMarkdownLegal: React.FC<Omit<SecureMarkdownProps, 'contentType'>> = (props) => {
  return (
    <SecureMarkdown
      {...props}
      contentType="legal"
      className={cn('prose-legal', props.className)}
    />
  );
};

/**
 * Hook for manual content preprocessing
 */
export const useSecureMarkdownProcessing = () => {
  const processContent = React.useCallback((
    content: string | null | undefined,
    contentType: 'article' | 'comment' | 'legal' = 'article'
  ) => {
    if (!content) return { content: '', isValid: true, warnings: [] };
    
    const validation = validateMarkdownSecurity(content);
    const processedContent = preprocessMarkdown(validation.sanitizedContent, contentType);
    
    return {
      content: processedContent,
      isValid: validation.isValid,
      warnings: validation.warnings,
    };
  }, []);
  
  return { processContent };
};

export default SecureMarkdown; 