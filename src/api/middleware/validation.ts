import { Request, Response, NextFunction } from 'express';
import { body, query, param, validationResult } from 'express-validator';

/**
 * Middleware to check validation results
 */
export const validateRequest = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      error: 'Validation failed',
      details: errors.array() 
    });
  }
  next();
};

/**
 * Validators for search queries
 */
export const searchValidator = [
  query('q')
    .trim()
    .escape()
    .isLength({ min: 1, max: 100 })
    .withMessage('Search query must be between 1 and 100 characters'),
  
  query('filter')
    .optional()
    .isIn(['all', 'title', 'content', 'course'])
    .withMessage('Invalid filter type'),
  
  query('sort')
    .optional()
    .isIn(['recent', 'relevant', 'popular'])
    .withMessage('Invalid sort option'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 50 })
    .withMessage('Limit must be between 1 and 50'),
  
  validateRequest
];

/**
 * Validators for case brief creation/update
 */
export const briefValidator = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 200 })
    .withMessage('Title must be between 3 and 200 characters'),
  
  body('citation')
    .trim()
    .optional()
    .isLength({ max: 200 })
    .withMessage('Citation must be less than 200 characters'),
  
  body('court')
    .trim()
    .optional()
    .isLength({ max: 100 })
    .withMessage('Court must be less than 100 characters'),
  
  body('date')
    .trim()
    .optional()
    .isISO8601()
    .withMessage('Date must be in ISO format (YYYY-MM-DD)'),
  
  body('facts')
    .trim()
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Facts must be less than 10,000 characters'),
  
  body('issue')
    .trim()
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Issue must be less than 5,000 characters'),
  
  body('holding')
    .trim()
    .optional()
    .isLength({ max: 5000 })
    .withMessage('Holding must be less than 5,000 characters'),
  
  body('reasoning')
    .trim()
    .optional()
    .isLength({ max: 10000 })
    .withMessage('Reasoning must be less than 10,000 characters'),
  
  validateRequest
];

/**
 * Validators for user profile updates
 */
export const profileValidator = [
  body('displayName')
    .optional()
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Display name must be between 2 and 50 characters'),
  
  body('email')
    .optional()
    .trim()
    .isEmail()
    .withMessage('Invalid email address'),
  
  body('membershipStatus')
    .optional()
    .isIn(['free', 'premium', 'contributor'])
    .withMessage('Invalid membership status'),
  
  validateRequest
];

/**
 * Validators for ID parameters
 */
export const idValidator = [
  param('id')
    .trim()
    .isLength({ min: 1 })
    .withMessage('ID parameter is required'),
  
  validateRequest
]; 